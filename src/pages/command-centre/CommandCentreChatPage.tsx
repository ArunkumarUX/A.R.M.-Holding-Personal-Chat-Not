// @ts-nocheck
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CcIcon } from '../../command-centre/CcIcon';
import { Emblem } from '../../command-centre/CcPrimitives';
import { CcChatAiMessage } from '../../command-centre/CcChatAiMessage';
import { AGENTS, SUGGESTIONS, CANNED } from '../../data/commandCentreData';
import { useApp } from '../../context/AppContext';
import { buildIntelligentResponse, getSourcesForQuery } from '../../data/executiveStore';
import { buildChatContext, buildChatHistory } from '../../api/buildChatContext';
import { checkClaudeAvailable, streamClaudeChat } from '../../api/claudeChat';
import { PRODUCT_AGENT_NAME, PRODUCT_AGENT_NAME_AR } from '../../config/user';
import { IntelCard, IntelCardBody } from '../../command-centre/CcCard';
import type { Source } from '../../types';

const USE_CLAUDE = import.meta.env.VITE_USE_CLAUDE_API !== 'false';

type ChatMsg =
  | { id: number; role: 'user'; text: string }
  | {
      id: number;
      role: 'ai';
      text: string;
      agents?: string[];
      thinking?: boolean;
      activeAgent?: number | null;
      confidence?: number;
      sources?: Source[];
    };

function pickAgents(q: string) {
  const sug = SUGGESTIONS.find((s) => s.q === q);
  if (sug) return sug.agents;
  if (q.match(/[\u0600-\u06FF]/)) return ['comms', 'strategy'];
  return ['strategy', 'cos'];
}

function buildAiPayload(q: string, executiveState: import('../../data/executiveStore').ExecutiveState) {
  const intel = buildIntelligentResponse(q, executiveState);
  const canned = CANNED[q as keyof typeof CANNED];
  const text = canned ?? intel.content;
  const sources = getSourcesForQuery(executiveState, intel.sourceDocIds);
  return {
    text,
    agents: intel.agents,
    confidence: intel.confidence,
    sources,
  };
}

export function CommandCentreChatPage() {
  const {
    settings,
    executiveState,
    recordChatTurn,
    createConversation,
    activeConversationId,
    copyMessage,
    setActiveSources,
    setSourcesPanelOpen,
  } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const seed = searchParams.get('seed');
  const lang = settings.language === 'ar' ? 'ar' : 'en';
  const ar = lang === 'ar';

  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [claudeLive, setClaudeLive] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const msgsRef = useRef(msgs);
  const idRef = useRef(0);
  msgsRef.current = msgs;

  useEffect(() => {
    if (!USE_CLAUDE) return;
    checkClaudeAvailable().then(setClaudeLive);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs, busy]);

  const runAgentAnimation = useCallback(async (aid: number, agents: string[]) => {
    for (let i = 0; i < agents.length; i++) {
      await new Promise((r) => setTimeout(r, 360));
      setMsgs((m) =>
        m.map((x) => (x.id === aid && x.role === 'ai' ? { ...x, activeAgent: i } : x)),
      );
    }
    await new Promise((r) => setTimeout(r, 280));
  }, []);

  const fillAiMessage = useCallback(
    async (aid: number, q: string, agents: string[]) => {
      const intel = buildIntelligentResponse(q, executiveState);
      const meta = {
        agents: intel.agents.length ? intel.agents : agents,
        confidence: intel.confidence,
        sources: getSourcesForQuery(executiveState, intel.sourceDocIds),
      };

      if (USE_CLAUDE) {
        const live = claudeLive || (await checkClaudeAvailable());
        if (live) {
          setClaudeLive(true);
          try {
          const anim = runAgentAnimation(aid, agents);
          let streamed = '';
          const history = buildChatHistory(
            msgsRef.current.filter((m) => m.id !== aid) as { id: number; role: string; text: string }[],
            aid,
          );

          await Promise.all([
            anim,
            streamClaudeChat({
              message: q,
              language: ar ? 'ar' : 'en',
              history,
              context: buildChatContext(executiveState),
              onToken: (chunk) => {
                streamed += chunk;
                setMsgs((m) =>
                  m.map((x) =>
                    x.id === aid && x.role === 'ai'
                      ? {
                          ...x,
                          text: streamed,
                          thinking: false,
                          activeAgent: null,
                          agents: meta.agents,
                        }
                      : x,
                  ),
                );
              },
            }),
          ]);

          if (!streamed.trim()) {
            throw new Error('Empty response from Claude');
          }

          setMsgs((m) =>
            m.map((x) =>
              x.id === aid && x.role === 'ai'
                ? {
                    ...x,
                    text: streamed,
                    agents: meta.agents,
                    confidence: meta.confidence,
                    sources: meta.sources,
                    activeAgent: null,
                    thinking: false,
                  }
                : x,
            ),
          );
          return;
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'AI request failed';
            console.warn('[chat] Claude failed', err);
            setMsgs((m) =>
              m.map((x) =>
                x.id === aid && x.role === 'ai'
                  ? {
                      ...x,
                      text: ar
                        ? `تعذر الاتصال بـ Claude: ${msg}`
                        : `Could not reach Claude: ${msg}. Check ANTHROPIC_API_KEY and restart npm run dev.`,
                      agents: meta.agents,
                      activeAgent: null,
                      thinking: false,
                    }
                  : x,
              ),
            );
            return;
          }
        }
      }

      await runAgentAnimation(aid, agents);
      const { text, confidence, sources } = buildAiPayload(q, executiveState);
      setMsgs((m) =>
        m.map((x) =>
          x.id === aid && x.role === 'ai'
            ? {
                ...x,
                text,
                agents,
                confidence,
                sources,
                activeAgent: null,
                thinking: false,
              }
            : x,
        ),
      );
    },
    [executiveState, runAgentAnimation, ar, claudeLive],
  );

  const send = useCallback(
    async (text: string) => {
      const q = (text || '').trim();
      if (!q || busy) return;
      setInput('');
      setBusy(true);
      const uid = ++idRef.current;
      setMsgs((m) => [...m, { id: uid, role: 'user', text: q }]);

      const agents = pickAgents(q);
      const aid = ++idRef.current;
      setMsgs((m) => [
        ...m,
        { id: aid, role: 'ai', agents, text: '', activeAgent: 0, thinking: true },
      ]);

      await fillAiMessage(aid, q, agents);
      setBusy(false);

      const aiRow = msgsRef.current.find((m) => m.id === aid && m.role === 'ai');
      if (aiRow && aiRow.role === 'ai' && aiRow.text.trim()) {
        let convId = activeConversationId;
        if (!convId) convId = createConversation(q.slice(0, 40));
        recordChatTurn(
          q,
          {
            content: aiRow.text,
            agents: aiRow.agents,
            confidence: aiRow.confidence,
            sources: aiRow.sources,
          },
          convId,
        );
      }
    },
    [busy, activeConversationId, createConversation, recordChatTurn, fillAiMessage],
  );

  const retryAiMessage = useCallback(
    async (aiId: number) => {
      if (busy) return;
      const idx = msgs.findIndex((m) => m.id === aiId);
      if (idx < 0) return;
      let userText = '';
      for (let i = idx - 1; i >= 0; i--) {
        if (msgs[i].role === 'user') {
          userText = msgs[i].text;
          break;
        }
      }
      if (!userText) return;

      setBusy(true);
      const agents = pickAgents(userText);
      setMsgs((m) =>
        m.map((x) =>
          x.id === aiId && x.role === 'ai'
            ? { ...x, text: '', thinking: true, activeAgent: 0, confidence: undefined, sources: undefined }
            : x,
        ),
      );
      await fillAiMessage(aiId, userText, agents);
      setBusy(false);
    },
    [busy, msgs, fillAiMessage],
  );

  const handleCopy = useCallback(
    (id: number, text: string) => {
      copyMessage(text);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 2000);
    },
    [copyMessage],
  );

  const openSourcesPanel = useCallback(
    (sources: Source[]) => {
      setActiveSources(sources);
      setSourcesPanelOpen(true);
    },
    [setActiveSources, setSourcesPanelOpen],
  );

  useEffect(() => {
    if (seed) {
      send(seed);
      setSearchParams({}, { replace: true });
    }
  }, [seed]);

  const empty = msgs.length === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div ref={scrollRef} className="content" style={{ padding: '8px 0', flex: 1, overflow: 'auto' }}>
        <div className="cc-chat-inner" style={{ maxWidth: 860, margin: '0 auto', padding: '14px 24px 24px' }}>
          {empty ? (
            <div className="rise" style={{ paddingTop: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
                <Emblem size={40} />
                <div>
                  <h2 style={{ fontSize: 24 }}>
                    {ar ? `اسأل ${PRODUCT_AGENT_NAME_AR}` : `Ask ${PRODUCT_AGENT_NAME}`}
                  </h2>
                  <div className="muted" style={{ fontSize: 14 }}>
                    {ar
                      ? 'خمسة وكلاء متخصصين ينسّقون عبر LangGraph — بالعربية والإنجليزية.'
                      : 'Five specialised agents, orchestrated by LangGraph — in English or Arabic.'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '18px 0 26px' }}>
                {AGENTS.map((a) => (
                  <div key={a.id} className="pill ghost" style={{ height: 30 }}>
                    <CcIcon name={a.icon} size={13} style={{ color: a.color }} />
                    {a.name.replace(' AI', '')}
                  </div>
                ))}
              </div>
              <div className="eyebrow" style={{ marginBottom: 12 }}>
                {ar ? 'جرّب أحد هذه' : 'Try one of these'}
              </div>
              <div className="grid mi-stagger" style={{ gap: 10 }} data-tour="chat-suggestions">
                {SUGGESTIONS.map((s) => (
                  <IntelCard key={s.q} interactive onClick={() => send(s.q)}>
                    <IntelCardBody style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                      <CcIcon name="sparkles" size={18} style={{ color: 'var(--accent-bright)', flex: 'none' }} />
                      <span className="cc-chat-suggest-text">{s.q}</span>
                      <CcIcon name={ar ? 'arrow-left' : 'arrow-right'} size={16} className="muted-3" />
                    </IntelCardBody>
                  </IntelCard>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid mi-stagger" style={{ gap: 22 }}>
              {msgs.map((m) =>
                m.role === 'user' ? (
                  <div key={m.id} className="mi-user-bubble" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <div
                      style={{
                        background: 'var(--petrol-700)',
                        color: '#fff',
                        padding: '12px 17px',
                        borderRadius: '16px 16px 4px 16px',
                        maxWidth: '78%',
                        fontSize: 15,
                        lineHeight: 1.45,
                      }}
                    >
                      {m.text}
                    </div>
                  </div>
                ) : (
                  <CcChatAiMessage
                    key={m.id}
                    message={m}
                    ar={ar}
                    busy={busy}
                    copied={copiedId === m.id}
                    onCopy={() => handleCopy(m.id, m.text)}
                    onRetry={() => retryAiMessage(m.id)}
                    onOpenSources={openSourcesPanel}
                  />
                ),
              )}
            </div>
          )}
        </div>
      </div>

      <footer className="chat-composer">
        <div className="chat-composer__inner chat-composer__row">
          <div className="chat-composer__input-wrap" data-tour="chat-input">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') send(input);
              }}
              placeholder={ar ? 'اكتب سؤالك التنفيذي…' : 'Type an executive question…'}
              disabled={busy}
            />
            <button
              type="button"
              className="btn btn-primary"
              style={{ height: 38, width: 44, padding: 0 }}
              onClick={() => send(input)}
              disabled={busy || !input.trim()}
            >
              <CcIcon name={busy ? 'loader' : 'arrow-up'} size={18} className={busy ? 'spin' : ''} />
            </button>
          </div>
        </div>
        <p className="chat-composer__note">
          {claudeLive
            ? ar
              ? 'مدعوم بـ Claude — إجابات حية من نموذج Anthropic.'
              : 'Powered by Claude — live answers from Anthropic.'
            : ar
              ? 'وضع تجريبي — أضف ANTHROPIC_API_KEY في .env.local ثم npm run dev (أو في Netlify → Environment variables).'
              : 'Demo mode — set ANTHROPIC_API_KEY in .env.local + npm run dev, or Netlify env vars for production.'}
        </p>
      </footer>
    </div>
  );
}
