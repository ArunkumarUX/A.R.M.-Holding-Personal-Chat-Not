import { getAnthropicConfig } from './chatCore.mjs';
import { PRESENTATION_BUILDER_SYSTEM } from './presentationBuilderPrompts.mjs';

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
  const { apiKey, model } = getAnthropicConfig();
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
  return parts.join('\n\n') || 'General ADGM executive strategy deck';
}

function demoClarifications() {
  return {
    questions: [
      'Who is the primary audience — board, FSRA, or external investors?',
      'Should the deck emphasise D33 alignment and Abu Dhabi positioning?',
      'Do you need bilingual (Arabic + English) speaker notes on any slides?',
    ],
  };
}

function demoOutline(prompt) {
  const topic = (prompt || 'ADGM strategy update').slice(0, 80);
  return {
    title: topic,
    theme: 'adgm-executive',
    estimatedSlides: 10,
    storyline: 'Situation → insights → recommendation → roadmap',
    outline: [
      { type: 'title', title: topic, summary: 'Board-ready opening' },
      { type: 'executive-summary', title: 'Executive summary', summary: '3 decisions for the CSO' },
      { type: 'context-problem', title: 'Context & stakes', summary: 'Why now for ADGM' },
      { type: 'key-insights', title: 'Key insights', summary: 'GCC and regulatory signals' },
      { type: 'strategy-recommendation', title: 'Strategic recommendation', summary: 'One clear path' },
      { type: 'framework-model', title: 'Decision framework', summary: 'MECE options' },
      { type: 'data-metrics', title: 'Metrics that matter', summary: 'D33 & licence KPIs' },
      { type: 'visual-infographic', title: 'Market snapshot', summary: 'Visual competitive lens' },
      { type: 'action-roadmap', title: '90-day roadmap', summary: 'Owners and dates' },
      { type: 'conclusion-next-steps', title: 'Next steps', summary: 'Ask of leadership' },
    ],
  };
}

function demoSlides(outline) {
  return {
    title: outline.title,
    theme: outline.theme || 'adgm-executive',
    brandCheck: ['ADGM navy + Clearsky accent', '16:9 executive layout', 'McKinsey-style headlines'],
    slides: outline.outline.map((o, i) => ({
      id: `slide-${i + 1}`,
      type: o.type,
      title: o.title,
      bullets: [
        'Lead with one crisp insight',
        'Support with demo institutional data where available',
        'Mark inferred points as analysis',
      ],
      visualHint: o.type === 'data-metrics' ? 'Score bar + 3-row metric table' : 'Icon-led layout, minimal text',
      speakerNotes: `Executive narration for ${o.title}. Keep to 45 seconds.`,
      metrics:
        o.type === 'data-metrics'
          ? [
              { label: 'D33 alignment', value: '82/100' },
              { label: 'Licence growth YoY', value: '+12%' },
            ]
          : undefined,
    })),
  };
}

export async function handlePresentationRequest(payload) {
  const action = payload?.action;
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
      return { ok: true, ...data };
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
