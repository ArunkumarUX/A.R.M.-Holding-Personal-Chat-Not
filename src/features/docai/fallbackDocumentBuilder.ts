import { DOC_AUDIENCES, DOC_PURPOSES, DOC_STYLES, DOC_TYPES, labelFor } from './documentCatalog';
import type { GeneratedDocument } from './docTypes';

function humanizeSlug(id: string | undefined, fallback: string) {
  if (!id) return fallback;
  return id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Build a clean executive title — never use the raw chat prompt as the Word title */
export function buildDocumentTitle(opts?: {
  userMessage?: string;
  docType?: string;
  purpose?: string;
  audience?: string;
}): string {
  const typeLabel = labelFor(DOC_TYPES, opts?.docType, false);
  const purposeLabel = labelFor(DOC_PURPOSES, opts?.purpose, false);
  const audienceLabel = labelFor(DOC_AUDIENCES, opts?.audience, false);

  if (opts?.docType && typeLabel !== '—') {
    if (opts.purpose && purposeLabel !== '—') {
      return `${typeLabel}: ${purposeLabel}`;
    }
    if (opts.audience && audienceLabel !== '—') {
      return `${typeLabel} — ${audienceLabel}`;
    }
    return `DMCC ${typeLabel}`;
  }

  const msg = (opts?.userMessage || '').replace(/\s+/g, ' ').trim();
  // Strip wizard boilerplate prompts
  const cleaned = msg
    .replace(/^generate\s+(a\s+)?/i, '')
    .replace(/\bdocument\.?\s*/gi, ' ')
    .replace(/\b(purpose|audience|style|type|include|use command centre context)[:.].*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleaned.length >= 8 && cleaned.length <= 64 && !/^generate\b/i.test(cleaned)) {
    return cleaned.replace(/[,:;].*$/, '').trim();
  }

  return 'DMCC Executive Decision Memo';
}

function notesFromMessage(msg: string): string {
  const m = msg.match(/Include:\s*(.+?)(?:\.\s*Recommend|\.\s*Use Command|$)/i);
  if (m?.[1]) return m[1].trim().slice(0, 280);
  const focus = msg.match(/Focus on[^.]+/i);
  if (focus) return focus[0].trim().slice(0, 280);
  const clean = msg
    .replace(/^Generate[\s\S]*?(?:Style:\s*[\w-]+\.\s*)?/i, '')
    .replace(/Use Command Centre[\s\S]*$/i, '')
    .trim();
  if (clean.length > 24 && clean.length < 320 && !/^Generate\b/i.test(clean)) return clean;
  return '';
}

/** Offline / demo document when API is unavailable — full Word-ready structure */
export function buildFallbackDocument(
  userMessage: string,
  opts?: { executiveBrief?: string; docType?: string; purpose?: string; audience?: string; style?: string },
): GeneratedDocument {
  const now = new Date().toISOString();
  const docType = opts?.docType || 'decision-memo';
  const purpose = opts?.purpose || 'strategic-decision';
  const audience = opts?.audience || 'leadership';
  const style = opts?.style || 'dmcc-brand';
  const title = buildDocumentTitle({
    userMessage,
    docType,
    purpose,
    audience,
  });
  const typeLabel = labelFor(DOC_TYPES, docType, false);
  const purposeLabel = labelFor(DOC_PURPOSES, purpose, false);
  const audienceLabel = labelFor(DOC_AUDIENCES, audience, false);
  const styleLabel = labelFor(DOC_STYLES, style, false);
  const hasContext = Boolean(opts?.executiveBrief);
  const notes = notesFromMessage(userMessage) || humanizeSlug(purpose, 'strategic prioritisation');
  const dateStr = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return {
    id: `doc-fallback-${Date.now()}`,
    title,
    docType,
    purpose,
    audience,
    style,
    status: 'draft',
    summary: `This ${typeLabel.toLowerCase()} is framed around “${purposeLabel}” for the ${audienceLabel.toLowerCase()}. It follows ${styleLabel} and is ready for Word export. ${
      hasContext
        ? 'Command Centre context was attached — verify figures before circulation.'
        : 'Generate again with the AI service connected for a fully drafted CEO-ready paper.'
    }`,
    estimatedPages: 6,
    sources: [
      'User brief',
      ...(hasContext ? ['Command Centre context'] : []),
      'DMCC brand defaults',
      'dmcc.ae public references',
    ],
    brandCheck: ['DMCC sapphire navy', 'Gold accent rules', 'Gotham / Montserrat hierarchy', 'Placeholder for missing data'],
    createdAt: now,
    updatedAt: now,
    version: 1,
    sections: [
      {
        id: 'sec-1',
        title: 'Cover',
        kind: 'cover',
        body: `# ${title}

**DMCC** · Dubai Multi Commodities Centre  
Prepared for: CEO Office · Ahmed Bin Sulayem  
Audience: ${audienceLabel}  
Document type: ${typeLabel}  
Date: ${dateStr}  
Classification: **Confidential — Leadership use only**

Status: Draft · Version 1`,
      },
      {
        id: 'sec-2',
        title: 'Executive Summary',
        kind: 'summary',
        body: `## Purpose

Support a ${purposeLabel.toLowerCase()} on **${notes}**.

## Recommendation

Proceed to a focused leadership review with a clear decision ask, owner, and timing. Separate verified facts from assumptions before board or investor circulation.

### Why this matters now
- Protects DMCC’s free-zone competitiveness across commodities and member services
- Aligns the decision to corridor priorities (gold, diamonds, Cyber, Future of Trade, Uptown Dubai)
- Sets a 30-day action path with accountable owners

> [REQUIRES INPUT: Confirm the specific decision and deadline you need from ${audienceLabel}.]`,
      },
      {
        id: 'sec-3',
        title: 'Situation & Context',
        kind: 'context',
        body: `## Situation

DMCC is a global free zone for commodities trade and business services, with ecosystems spanning gold, diamonds, tea & coffee, Crypto Centre / Cyber, FinX, and major development programmes including Uptown Dubai.

## Brief inputs

**Focus:** ${notes}

${hasContext ? '_Command Centre context was attached to ground this draft._' : '_Say “use Command Centre context” on the next turn to pull internal briefing and performance signals._'}

## Framing for ${audienceLabel}
- Decision clarity over narrative length
- Evidence-backed claims only — mark gaps as **[REQUIRES INPUT]**
- Explicit risks, owners, and next steps`,
      },
      {
        id: 'sec-4',
        title: 'Analysis',
        kind: 'analysis',
        body: `## Options considered

| Option | Upside | Risk | Fit to purpose |
|---|---|---|---|
| A — Accelerate decision | Speed, signal strength | Incomplete evidence | High if facts are validated |
| B — Defer 30–60 days | More data | Competitive lag | Medium |
| C — Narrow pilot | Controlled exposure | Diluted impact | Medium–High |

## Critical questions
1. What must be approved now vs later?
2. Which KPIs or corridor metrics must be attached from Knowledge Base?
3. What regulatory or competitor free-zone risks change the ask?

## Evidence checklist
- [ ] Member / corridor volume confirmed  
- [ ] Competitive benchmarks (ADGM / DIFC / Antwerp / Singapore as relevant)  
- [ ] Resource / budget ask quantified  
- [ ] Legal / licensing constraints reviewed`,
      },
      {
        id: 'sec-5',
        title: 'Recommendations',
        kind: 'recommendations',
        body: `## Recommendations

1. **Clarify the decision** — what must be approved, by whom, and by when  
2. **Evidence pack** — attach KPIs, corridor metrics, or member SLAs from Knowledge Base  
3. **Risk register** — sanctions exposure, competitor free zones, licensing dependencies  
4. **30-day plan** — owners, milestones, and Leadership reporting cadence  

### Decisions required

| Decision | Owner | Timing | Status |
|---|---|---|---|
| [REQUIRES INPUT: primary ask] | CEO Office | [REQUIRES INPUT] | Open |
| Evidence pack complete | Strategy / Analytics | 10 working days | Open |
| Risk sign-off | Legal / Compliance | Before circulation | Open |`,
      },
      {
        id: 'sec-6',
        title: 'Next Steps & Appendix',
        kind: 'next-steps',
        body: `## Next steps

1. Validate figures with Finance / Member Services  
2. Circulate this Word draft for ${audienceLabel} review  
3. Capture amendments in DocAI, then re-export Word  
4. Convert approved narrative into a board pack via **Presentations** if needed  

## Appendix — Brand & quality
- Style: ${styleLabel}  
- No fabricated statistics — replace **[REQUIRES INPUT]** markers before external share  
- Footer on export: DMCC · Confidential · CEO Agent DocAI  

---

*End of document*`,
      },
    ],
  };
}
