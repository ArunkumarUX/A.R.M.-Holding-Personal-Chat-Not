import { EXECUTIVE_USER } from '../config/user';
import type { AgentType } from '../types';
import type { ExecutiveState } from './executiveStore';
import { getDepartment } from './executiveStore';
import type { FocusAreaId } from './focusAreas';
import { FOCUS_AREA_MAP } from './focusAreas';
import type { IntelligentResponse } from './executiveStore';
import {
  actionNow,
  agentTag,
  metricTable,
  plainTerms,
  scoreBar,
  signalEmoji,
} from '../utils/executiveAnswerVisuals';

function baseFollowUps(area: FocusAreaId): string[] {
  return FOCUS_AREA_MAP[area].prompts.slice(1, 4);
}

export function buildFocusAreaResponse(
  areaId: FocusAreaId,
  query: string,
  state: ExecutiveState,
): IntelligentResponse {
  const area = FOCUS_AREA_MAP[areaId];
  const m = state.marketSnapshot;
  const hr = getDepartment(state, 'hr');
  const attrition = hr?.kpis.find((k) => k.label.includes('Attrition'))?.value ?? '16.2% YTD';

  const agents = area.agents as AgentType[];

  switch (areaId) {
    case 'strategic-intelligence': {
      const q = query.toLowerCase();
      if (q.includes('difc') && q.includes('fintech')) {
        return {
          agents,
          confidence: 0.9,
          sourceDocIds: ['d4', 'd5'],
          followUps: baseFollowUps(areaId),
          content: `## DIFC vs ADGM — fintech

${plainTerms('DIFC is pushing retail fintech sandboxes; ADGM should stress institutional funds and clear rules.')}
${metricTable(
  ['Signal', 'DIFC', 'ADGM'],
  [
    ['This week', m.competitorNote, 'Licences +12% YoY'],
    ['Position', 'Retail sandbox', 'Institutional tokenised funds'],
  ],
)}
${actionNow('Refresh competitor messaging for FSRA and authorisations this week.')}
${agentTag(['Strategy AI'])}`,
        };
      }
      if (q.includes('geopolitical')) {
        return {
          agents,
          confidence: 0.91,
          sourceDocIds: ['d4'],
          followUps: baseFollowUps(areaId),
          content: `## Geopolitical brief

${plainTerms('No board crisis today — watch US rates and sanctions screening for banks.')}
${metricTable(
  ['Topic', 'Status', 'Signal'],
  [
    ['Middle East corridor', 'Stable inflows', signalEmoji('good')],
    ['GCC equities', m.gccEquities, signalEmoji('good')],
    ['Sanctions screening', 'Rule updates', signalEmoji('watch')],
    ['USD rates', 'Liquidity shift risk', signalEmoji('watch')],
  ],
)}
${agentTag(['Strategy AI', 'Policy AI'])}`,
        };
      }
      return {
        agents,
        confidence: 0.92,
        sourceDocIds: ['d4', 'd5', 'd2'],
        followUps: baseFollowUps(areaId),
        content: `## Daily briefing — ${new Date().toLocaleDateString('en-AE', { weekday: 'short', day: 'numeric', month: 'short' })}

${plainTerms('Markets are steady; watch DIFC fintech and MAS stablecoin rules this week.')}
${metricTable(
  ['Market', 'Move', 'Signal'],
  [
    ['GCC equities', m.gccEquities, signalEmoji('good')],
    ['ADGM digital assets', m.digitalAssetsWoW + ' WoW', signalEmoji('good')],
    ['Top sector', m.topSector.split('(')[0].trim(), signalEmoji('good')],
  ],
)}
${metricTable(
  ['Competitor', 'Headline', 'Signal'],
  [
    ['DIFC', m.competitorNote, signalEmoji('watch')],
    ['MAS', 'Stablecoin consultation · Fri', signalEmoji('watch')],
    ['HK / Luxembourg', 'No change', signalEmoji('good')],
  ],
)}
**D33 alignment (demo)**
${scoreBar(82)}
${agentTag(['Strategy AI', 'Policy AI'])}`,
      };
    }

    case 'meetings': {
      const qLower = query.toLowerCase();
      const mtg = state.meetings.find((mtg) => qLower.includes('mas') && mtg.title.toLowerCase().includes('mas')) ?? state.meetings[0];
      if (query.toLowerCase().includes('board pack') || query.toLowerCase().includes('executive summary')) {
        return {
          agents,
          confidence: 0.91,
          sourceDocIds: ['d1'],
          followUps: baseFollowUps(areaId),
          content: `## Board pack — executive summary

**Document:** Q2_Board_Pack_Draft_v3.pdf

### Decisions required (3)
1. Digital assets framework — board visibility Q2
2. Italy financial engagement — milestone achieved, note for minutes
3. Talent pipeline — HR attrition **${attrition}** — retention actions recommended

### Financial & strategic highlights
- Licence growth +12% YoY · FSRA pipeline robust
- D33 alignment score **82/100**
- Competitive pressure: DIFC fintech authorisations — proactive positioning advised

### Risks for board attention
- Regulatory divergence across jurisdictions
- One enterprise pipeline deal slipped (Sales) — CSO escalation option

*Ready for export to board portal · Communications AI can draft covering note*`,
        };
      }
      if (query.toLowerCase().includes('action item') || query.toLowerCase().includes('mubadala')) {
        return {
          agents,
          confidence: 0.9,
          sourceDocIds: ['d1'],
          followUps: baseFollowUps(areaId),
          content: `## Post-meeting — action extraction

**Meeting:** Mubadala leadership (14 Apr 2026)

| Action | Owner | Due | Status |
|--------|-------|-----|--------|
| Share ADGM digital assets policy update | ${EXECUTIVE_USER.firstName} | 31 May | **Overdue** |
| Introduce 2 GP prospects for ADGM fund regime | Mubadala | End Q2 | Open |
| Quarterly regulatory roundtable proposal | Joint | TBC | Suggested |

**Follow-up draft (excerpt):** Thank you for the productive session. ADGM will circulate the digital assets framework update by [date]. We welcome introductions to the GP prospects discussed.

*Add to action register · Chief of Staff AI*`,
        };
      }
      return {
        agents,
        confidence: 0.94,
        sourceDocIds: ['d2', 'd4'],
        followUps: baseFollowUps(areaId),
        content: `## Pre-meeting brief — ${mtg.title}

**${mtg.attendees}** · ${mtg.location}  
**Prep status:** ${mtg.prepStatus === 'ready' ? 'Ready' : 'In progress'}

### Context
- Last bilateral: regulatory harmonisation on tokenised products
- Open commitment: MAS policy comparison note — due 12 Jun

### Suggested questions
1. Institutional fund passporting with UAE?
2. Timeline for stablecoin consultation outcomes?

### Sensitivities
- Avoid over-committing FSRA publication dates on digital assets`,
      };
    }

    case 'regulatory':
      return {
        agents,
        confidence: 0.92,
        sourceDocIds: ['d2', 'd4'],
        followUps: baseFollowUps(areaId),
        content: `## Regulatory & policy intelligence

**Query:** ${query.slice(0, 120)}...

### ADGM (FSRA) position
Principle-based VASP taxonomy · institutional custody requirements · retail permitted with safeguards (source: FSRA Virtual Assets Framework 2026)

### International benchmark
**MAS:** Activity-based DPT rules; stablecoin CP closes Friday — stricter retail access than ADGM

### Recommended CSO actions
1. Brief FSRA on competitive scan by **12 Jun**
2. Draft consultation response — Policy AI template available
3. Board visibility on framework timeline

*Cross-reference complete against FCA, MAS, HKMA, IOSCO feeds · updated today*`,
      };

    case 'correspondence':
      return {
        agents,
        confidence: 0.91,
        sourceDocIds: ['d3', 'd1'],
        followUps: baseFollowUps(areaId),
        content: `## Correspondence & communications

### Priority inbound (last 48h — simulated)
1. **FSRA** — consultation timeline confirmation (action by 12 Jun)
2. **Board secretariat** — Q2 pack circulation draft approval
3. **External counsel** — data transfer policy gap memo

### Draft capability
- **Arabic / English** ministerial register with honorifics verified
- CSO voice learning applied from prior approved notes

### Sample (English excerpt — Q2 HH note)
Your Excellency, ADGM reports strong Q2 momentum across authorisations and D33 alignment (82/100). Key risks: competitive fintech positioning; talent retention in critical roles.

*Full bilingual draft in Documents library · Communications AI*`,
      };

    case 'stakeholders':
      return {
        agents,
        confidence: 0.93,
        sourceDocIds: ['d1'],
        followUps: baseFollowUps(areaId),
        content: `## Stakeholder & relationship intelligence

### CRM summary
| Stakeholder | Last interaction | Open commitments |
|-------------|------------------|------------------|
| **Mubadala** | 14 Apr 2026 | Policy update share (**overdue**); GP introductions |
| **MAS delegation** | 22 Mar 2026 | Technical workshop; policy note due 12 Jun |
| **Goldman** | Apr 2026 | Pipeline discussion — 1 deal at risk |

### Partnerships requiring follow-up
- ADGM–Abu Dhabi unified GP value proposition — in progress
- Italy financial engagement — milestone **complete**

### Before next engagement
Request a full stakeholder brief naming the organisation for attendee history, sensitivities, and talking points.`,
      };

    case 'knowledge':
      return {
        agents,
        confidence: 0.89,
        sourceDocIds: ['d5', 'd1', 'd2'],
        followUps: baseFollowUps(areaId),
        content: `## Knowledge management — institutional search

**Corpus:** ${state.metrics.documentsInKb}+ indexed documents · Knowledge Graph active

### Results for your query
- **D33_Strategic_Alignment_2024-26.xlsx** — alignment score 82; digital assets on track; Italy complete
- **Q2_Board_Pack_Draft_v3.pdf** — three board decisions; risk section on DIFC competition
- **FSRA_Virtual_Assets_Framework_2026.pdf** — licensing taxonomy; benchmark for MAS comparison

### Historical precedent
2024 strategic decision log shows digital assets acceleration and fund regime reforms linked to +12% licence growth narrative.

*Institutional knowledge preserved across tenures · cite sources in export*`,
      };

    default:
      return {
        agents: ['cos', 'strategy'],
        confidence: 0.87,
        sourceDocIds: ['d1'],
        followUps: ALL_FOCUS_PROMPTS_FALLBACK(),
        content: `**${EXECUTIVE_USER.firstName}** — ask within any of the six CSO focus areas: strategic intelligence, meetings, regulatory, communications, stakeholders, or knowledge.`,
      };
  }
}

function ALL_FOCUS_PROMPTS_FALLBACK(): string[] {
  return [
    'Give me my daily executive briefing for global financial markets and ADGM',
    'Brief me on my next meeting',
    'Search our knowledge base for D33 strategic decisions',
  ];
}
