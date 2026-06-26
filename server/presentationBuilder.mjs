import { getAnthropicConfig } from './chatCore.mjs';
import { PRESENTATION_BUILDER_SYSTEM } from './presentationBuilderPrompts.mjs';
import { applyBrandToDeck } from './adgmBrandGuidelines.mjs';

function extractJson(text) {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fence) return JSON.parse(fence[1].trim());
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start >= 0 && end > start) return JSON.parse(trimmed.slice(start, end + 1));
    throw new Error('Could not parse AI response as JSON');
  }
}

async function claudeJson(userPrompt, maxTokens = 4096) {
  const { apiKey } = getAnthropicConfig();
  const model =
    process.env.PRESENTATION_ANTHROPIC_MODEL ||
    process.env.SLIDEAI_ANTHROPIC_MODEL ||
    'claude-opus-4-8';
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system: PRESENTATION_BUILDER_SYSTEM,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || res.statusText);
  }

  const data = await res.json();
  const text = data.content?.find((b) => b.type === 'text')?.text || '';
  return extractJson(text);
}

function buildSourceBlock(payload) {
  const parts = [];
  if (payload.prompt?.trim()) parts.push(`User prompt:\n${payload.prompt.trim()}`);
  if (payload.notes?.trim()) parts.push(`Notes:\n${payload.notes.trim()}`);
  if (payload.link?.trim()) parts.push(`Reference link (summarise topic only; do not claim live fetch):\n${payload.link.trim()}`);
  if (payload.documentText?.trim()) {
    const doc = payload.documentText.trim().slice(0, 12000);
    parts.push(`Uploaded / pasted document:\n${doc}`);
  }
  if (payload.slideCount) parts.push(`Target slide count: ~${payload.slideCount}`);
  if (payload.tone) parts.push(`Tone: ${payload.tone}`);
  return parts.join('\n\n') || 'General A.R.M. Holding executive strategy deck';
}

function demoClarifications() {
  return {
    questions: [
      'Who is the primary audience — board, RERA, or external investors?',
      'Should the deck emphasise D33 alignment alignment and Abu Dhabi positioning?',
      'Do you need bilingual (Arabic + English) speaker notes on any slides?',
    ],
  };
}

function demoOutline(prompt) {
  const topic = (prompt || 'A.R.M. Holding strategy update').slice(0, 80);
  return {
    title: topic,
    theme: 'arm-executive',
    estimatedSlides: 10,
    storyline: 'SCQA — Situation → Complication → Question → Answer (Pyramid Principle)',
    outline: [
      { type: 'title', title: topic, summary: 'Board-ready opening — We Emerge Stronger' },
      {
        type: 'executive-summary',
        title: 'Approve [recommendation] — three decisions unlock AED [X]M value by [date]',
        summary: 'Answer upfront — Pyramid Principle',
      },
      {
        type: 'context-problem',
        title: 'Portfolio context sets the stakes — DREC, HUNA, and HIVE face [complication]',
        summary: 'Situation + complication',
      },
      {
        type: 'key-insights',
        title: 'Dubai market signals confirm [insight] — window closes in [N] months',
        summary: 'Evidence-led insights',
      },
      {
        type: 'data-metrics',
        title: 'Market sizing supports AED [X]B addressable pool in [segment]',
        summary: 'Table exhibit + insightPanel',
      },
      {
        type: 'framework-model',
        title: 'Strategic options score highest on [criterion] — Option [A] leads on IRR and risk',
        summary: 'Competitive benchmark / options matrix',
      },
      {
        type: 'strategy-recommendation',
        title: 'Base case delivers break-even at month [N] with 22% IRR under disciplined phasing',
        summary: '3-scenario financial model',
      },
      {
        type: 'visual-infographic',
        title: 'Top risks are manageable — governance controls reduce severity on [risk 1] and [risk 2]',
        summary: 'Risk register',
      },
      {
        type: 'action-roadmap',
        title: '12-month roadmap gates capital at months 6, 12, and 18 — no commitment without KPI proof',
        summary: 'Timeline with decision gates',
      },
      {
        type: 'conclusion-next-steps',
        title: 'CEO must approve [3 items] today to protect first-mover advantage',
        summary: 'Decisions required',
      },
    ],
  };
}

function demoSlides(outline) {
  return applyBrandToDeck({
    title: outline.title,
    theme: 'adgm-brand-2025',
    brandCheck: ['McKinsey action titles on every slide', 'KPI towers + exhibit panels enabled'],
    slides: outline.outline.map((o, i) => ({
      id: `slide-${i + 1}`,
      type: o.type,
      title: o.title,
      bullets: [
        'Lead with one crisp insight',
        'Support with approved institutional data where available',
        'Mark inferred points as analysis',
      ],
      visualHint: o.type === 'data-metrics' ? 'Score bar + 3-row metric table' : 'Icon-led layout, minimal text',
      speakerNotes: `Executive narration for ${o.title}. Keep to 45 seconds.`,
      metrics:
        o.type === 'data-metrics'
          ? [
              { label: 'D33 alignment alignment', value: '82/100' },
              { label: 'Licence growth YoY', value: '+12%' },
            ]
          : undefined,
    })),
  });
}

export async function handlePresentationRequest(payload) {
  const action = payload?.action;

  if (action === 'ping') {
    return { ok: true, service: 'presentation' };
  }

  const source = buildSourceBlock(payload);

  if (action === 'clarify') {
    try {
      const data = await claudeJson(
        `${source}\n\nReturn JSON: { "questions": string[] } with 0 to 3 short clarification questions. Empty array if prompt is already clear.`,
        1024,
      );
      return { ok: true, ...data };
    } catch {
      return { ok: true, ...demoClarifications() };
    }
  }

  if (action === 'outline') {
    const answers = payload.clarificationAnswers || [];
    const answerBlock = answers.length
      ? `Clarification answers:\n${answers.map((a, i) => `Q${i + 1}: ${a}`).join('\n')}`
      : '';
    try {
      const data = await claudeJson(
        `${source}\n${answerBlock}\n\nReturn JSON:\n{
  "title": string,
  "theme": "adgm-executive",
  "estimatedSlides": number,
  "storyline": string,
  "outline": [{ "type": string, "title": string, "summary": string }]
}`,
        2048,
      );
      return { ok: true, ...data };
    } catch {
      return { ok: true, ...demoOutline(payload.prompt) };
    }
  }

  if (action === 'slides') {
    const outline = payload.outline;
    if (!outline?.outline?.length) throw new Error('outline is required');
    try {
      const data = await claudeJson(
        `${source}\n\nApproved outline JSON:\n${JSON.stringify(outline)}\n\nReturn JSON:\n{
  "title": string,
  "theme": "adgm-executive",
  "brandCheck": string[],
  "slides": [{
    "id": string,
    "type": string,
    "title": string,
    "bullets": string[],
    "visualHint": string,
    "speakerNotes": string,
    "metrics": [{ "label": string, "value": string }] | optional
  }]
}`,
        8192,
      );
      return { ok: true, ...applyBrandToDeck(data) };
    } catch {
      return { ok: true, ...demoSlides(outline) };
    }
  }

  if (action === 'regenerate-slide') {
    const slide = payload.slide;
    const instruction = payload.instruction || 'Improve clarity and consulting tone';
    if (!slide) throw new Error('slide is required');
    try {
      const data = await claudeJson(
        `${source}\nRegenerate this slide. Instruction: ${instruction}\nCurrent slide JSON:\n${JSON.stringify(slide)}\n\nReturn JSON: single slide object with same schema.`,
        2048,
      );
      return { ok: true, slide: data };
    } catch {
      return {
        ok: true,
        slide: {
          ...slide,
          bullets: slide.bullets?.map((b) => `${b} (refined)`) || ['Refined executive point'],
        },
      };
    }
  }

  throw new Error(`Unknown action: ${action}`);
}

export async function createPresentationHttpResponse(request) {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  try {
    const result = await handlePresentationRequest(payload);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err?.message || 'Presentation builder failed' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
}
