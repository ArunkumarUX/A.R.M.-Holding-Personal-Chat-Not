import type { PresentationDeck, PresentationOutline } from '../types/presentation';
import { mergeBrandCheck } from '../config/adgmBrandForDeck';

export function demoClarifications() {
  return {
    questions: [
      'Who is the primary audience — board, FSRA, or external investors?',
      'Should the deck emphasise Falcon Economy alignment and Abu Dhabi positioning?',
      'Do you need bilingual (Arabic + English) speaker notes on any slides?',
    ],
  };
}

export function demoOutline(prompt: string): PresentationOutline {
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
      { type: 'data-metrics', title: 'Metrics that matter', summary: 'Falcon Economy & licence KPIs' },
      { type: 'visual-infographic', title: 'Market snapshot', summary: 'Visual competitive lens' },
      { type: 'action-roadmap', title: '90-day roadmap', summary: 'Owners and dates' },
      { type: 'conclusion-next-steps', title: 'Next steps', summary: 'Ask of leadership' },
    ],
  };
}

export function demoSlides(outline: PresentationOutline): PresentationDeck {
  return {
    title: outline.title,
    theme: 'adgm-brand-2025',
    brandCheck: mergeBrandCheck([
      'Unified craft: McKinsey + Open Design + Claude Design',
      'Action titles on every slide',
      'KPI towers + exhibit panels enabled',
    ]),
    slides: outline.outline.map((o, i) => ({
      id: `slide-${i + 1}`,
      type: o.type,
      title: o.title,
      bullets: [
        'Lead with one crisp insight for the CSO',
        'Ground claims in approved ADGM sources where available',
        'Label strategic read as analysis, not fact',
      ],
      visualHint:
        o.type === 'data-metrics' ? 'Score bar + 3-row metric table' : 'Icon-led layout, minimal text',
      speakerNotes: `Executive narration for "${o.title}". Target 45 seconds.`,
      metrics:
        o.type === 'data-metrics'
          ? [
              { label: 'Falcon Economy alignment', value: '82/100' },
              { label: 'Licence growth YoY', value: '+12%' },
            ]
          : undefined,
    })),
  };
}
