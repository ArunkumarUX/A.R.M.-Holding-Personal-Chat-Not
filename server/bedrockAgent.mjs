/**
 * AWS Bedrock Agents — invoke configured agent runtime.
 * Env:
 *   BEDROCK_AGENT_ARN=arn:aws:bedrock:ap-south-1:ACCOUNT:agent/AGENT_ID
 *   BEDROCK_AGENT_ALIAS_ID=ALIAS_ID
 *   AWS_REGION=ap-south-1  (optional if present in ARN)
 *   AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY  (or default credential chain)
 *   CHAT_PROVIDER=bedrock|anthropic|auto  (default auto → bedrock when configured)
 */
import {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand,
} from '@aws-sdk/client-bedrock-agent-runtime';
import { randomUUID } from 'node:crypto';

function trim(v) {
  return String(v || '').trim();
}

/** Parse agent id + region from ARN; alias is never in the agent ARN. */
export function parseBedrockAgentArn(arn) {
  const m = trim(arn).match(
    /^arn:aws:bedrock:([a-z0-9-]+):\d+:agent\/([A-Za-z0-9]+)$/i,
  );
  if (!m) return null;
  return { region: m[1], agentId: m[2] };
}

export function getBedrockAgentConfig() {
  const arn = trim(process.env.BEDROCK_AGENT_ARN);
  const parsed = parseBedrockAgentArn(arn);
  const agentId = trim(process.env.BEDROCK_AGENT_ID) || parsed?.agentId || '';
  const agentAliasId = trim(process.env.BEDROCK_AGENT_ALIAS_ID);
  const region =
    trim(process.env.BEDROCK_REGION) ||
    trim(process.env.AWS_REGION) ||
    parsed?.region ||
    'ap-south-1';

  const accessKeyId = trim(process.env.AWS_ACCESS_KEY_ID);
  const secretAccessKey = trim(process.env.AWS_SECRET_ACCESS_KEY);
  const hasEnvCredentials = Boolean(accessKeyId && secretAccessKey);
  const agentIdsSet = Boolean(agentId && agentAliasId);
  // Ready to invoke only when agent + AWS keys are present (no ~/.aws on this machine).
  const configured = agentIdsSet && hasEnvCredentials;

  return {
    configured,
    agentIdsSet,
    hasEnvCredentials,
    agentId,
    agentAliasId,
    region,
    arn: arn || (agentId ? `arn:aws:bedrock:${region}:*:agent/${agentId}` : ''),
  };
}

export function resolveChatProvider() {
  const pref = trim(process.env.CHAT_PROVIDER || 'auto').toLowerCase();
  const bedrock = getBedrockAgentConfig();
  if (pref === 'bedrock') {
    if (bedrock.configured) return 'bedrock';
    // Agent ID set but no AWS keys — fall back so chat still works.
    if (bedrock.agentIdsSet && !bedrock.hasEnvCredentials) return 'anthropic';
    return 'none';
  }
  if (pref === 'anthropic') return 'anthropic';
  // auto
  if (bedrock.configured) return 'bedrock';
  return 'anthropic';
}

function buildClient(region) {
  const accessKeyId = trim(process.env.AWS_ACCESS_KEY_ID);
  const secretAccessKey = trim(process.env.AWS_SECRET_ACCESS_KEY);
  const sessionToken = trim(process.env.AWS_SESSION_TOKEN);
  const config = { region };
  if (accessKeyId && secretAccessKey) {
    config.credentials = {
      accessKeyId,
      secretAccessKey,
      ...(sessionToken ? { sessionToken } : {}),
    };
  }
  return new BedrockAgentRuntimeClient(config);
}

/**
 * Stream Bedrock agent chunks as { type: 'token' | 'done' | 'error', ... }
 * Compatible with the Claude SSE writeEvent contract used by /api/chat.
 */
export async function streamBedrockAgentChat(payload, writeEvent) {
  const cfg = getBedrockAgentConfig();
  if (!cfg.configured) {
    throw new Error(
      'Bedrock agent not configured — set BEDROCK_AGENT_ARN (or BEDROCK_AGENT_ID) and BEDROCK_AGENT_ALIAS_ID',
    );
  }

  const { message, language = 'en', sessionId: incomingSessionId, context = {} } =
    payload || {};
  if (!message?.trim()) {
    throw new Error('message is required');
  }

  const sessionId = trim(incomingSessionId) || randomUUID();
  writeEvent({ type: 'session', sessionId, provider: 'bedrock' });

  const client = buildClient(cfg.region);
  const promptBits = [];
  if (language === 'ar') {
    promptBits.push('Respond in Arabic (Modern Standard Arabic).');
  }
  if (context?.executiveName) {
    promptBits.push(`Executive: ${context.executiveName}`);
  }
  if (context?.organisation) {
    promptBits.push(`Organisation: ${context.organisation}`);
  }
  const preface = promptBits.length ? `${promptBits.join(' · ')}\n\n` : '';

  const command = new InvokeAgentCommand({
    agentId: cfg.agentId,
    agentAliasId: cfg.agentAliasId,
    sessionId,
    inputText: `${preface}${message.trim()}`,
    enableTrace: false,
    sessionState: {
      sessionAttributes: {
        language: String(language || 'en'),
        organisation: String(context?.organisation || 'DMCC'),
      },
      promptSessionAttributes: {
        language: String(language || 'en'),
      },
    },
  });

  let response;
  try {
    response = await client.send(command);
  } catch (err) {
    const msg = err?.message || String(err);
    if (/could not load credentials|CredentialsProviderError|ExpiredToken/i.test(msg)) {
      throw new Error(
        'AWS credentials missing or expired — set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env.local (account must be allowed to invoke this Bedrock agent).',
      );
    }
    if (/AccessDenied|is not authorized/i.test(msg)) {
      throw new Error(
        `AWS AccessDenied invoking Bedrock agent ${cfg.agentId}/${cfg.agentAliasId} in ${cfg.region}: ${msg}`,
      );
    }
    throw new Error(msg);
  }

  if (!response?.completion) {
    throw new Error('Bedrock agent returned no completion stream');
  }

  const decoder = new TextDecoder('utf-8');
  let anyToken = false;

  for await (const event of response.completion) {
    if (event?.chunk?.bytes) {
      const text = decoder.decode(event.chunk.bytes);
      if (text) {
        anyToken = true;
        writeEvent({ type: 'token', text });
      }
    }
  }

  if (!anyToken) {
    throw new Error('Empty response from Bedrock agent');
  }

  writeEvent({
    type: 'done',
    model: `bedrock-agent:${cfg.agentId}/${cfg.agentAliasId}`,
    provider: 'bedrock',
    sessionId,
  });
}

/**
 * One-shot Bedrock completion (DocAI / SlideAI style).
 * Returns full text. Caller supplies the entire prompt (system + messages).
 */
export async function invokeBedrockAgentCompletion(inputText, { sessionId } = {}) {
  const cfg = getBedrockAgentConfig();
  if (!cfg.configured) {
    throw new Error(
      'Bedrock agent not configured — set BEDROCK_AGENT_ARN + BEDROCK_AGENT_ALIAS_ID + AWS keys',
    );
  }
  if (!String(inputText || '').trim()) {
    throw new Error('inputText is required');
  }

  const client = buildClient(cfg.region);
  const sid = trim(sessionId) || randomUUID();
  const command = new InvokeAgentCommand({
    agentId: cfg.agentId,
    agentAliasId: cfg.agentAliasId,
    sessionId: sid,
    inputText: String(inputText).trim(),
    enableTrace: false,
  });

  let response;
  try {
    response = await client.send(command);
  } catch (err) {
    const msg = err?.message || String(err);
    if (/could not load credentials|CredentialsProviderError|ExpiredToken/i.test(msg)) {
      throw new Error(
        'AWS credentials missing or expired — set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env.local',
      );
    }
    throw new Error(msg);
  }

  if (!response?.completion) {
    throw new Error('Bedrock agent returned no completion stream');
  }

  const decoder = new TextDecoder('utf-8');
  let text = '';
  for await (const event of response.completion) {
    if (event?.chunk?.bytes) {
      text += decoder.decode(event.chunk.bytes);
    }
  }
  if (!text.trim()) {
    throw new Error('Empty response from Bedrock agent');
  }
  return {
    text,
    model: `bedrock-agent:${cfg.agentId}/${cfg.agentAliasId}`,
    sessionId: sid,
  };
}
