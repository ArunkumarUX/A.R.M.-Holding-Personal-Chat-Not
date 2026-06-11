import type { ExecutiveState, Meeting } from '../data/executiveStore';
import { CANNED } from '../data/commandCentreData';

export type BriefingFormatId =
  | 'premeeting'
  | 'email'
  | 'boardpack'
  | 'stakeholder';

export type BriefingConfig = {
  id: BriefingFormatId;
  /** Used for scenario fallback + intelligent response routing */
  fallbackQuery: string;
  cannedKey: keyof typeof CANNED | null;
  agents: string[];
  buildUserMessage: (state: ExecutiveState, ar: boolean, userPaste: string) => string;
};

function userPasteBlock(userPaste: string, ar: boolean): string {
  const trimmed = userPaste.trim();
  if (!trimmed) return '';
  return ar
    ? `**المحتوى الذي لصقه المستخدم (حلّله أولاً):**\n---\n${trimmed}\n---\n\n`
    : `**User-pasted content (analyse this first):**\n---\n${trimmed}\n---\n\n`;
}

function kbRules(ar: boolean): string {
  return ar
    ? 'قاعدة المعرفة: استشهد بمقاطع قاعدة المعرفة المؤسسية والمستندات المرفوعة (أسماء المستندات والمقابض). لا تخترع أرقاماً أو اقتباسات.'
    : 'Knowledge base: cite institutional KB excerpts and uploaded documents (document names and handles). Do not invent figures or quotes.';
}

export function pickNextMeeting(state: ExecutiveState): Meeting {
  const now = Date.now();
  const upcoming = [...state.meetings].sort(
    (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
  );
  const next = upcoming.find((m) => new Date(m.time).getTime() >= now - 3_600_000);
  return next ?? upcoming[0] ?? state.meetings[0];
}

const DOC_LIST = (state: ExecutiveState, max = 8) =>
  state.documents
    .slice(0, max)
    .map((d) => `- ${d.name}: ${d.summary ?? 'no summary'}`)
    .join('\n');

const OPEN_ACTIONS = (state: ExecutiveState) =>
  state.actionRegister
    .filter((a) => a.status !== 'done')
    .map((a) => `- [${a.status}] ${a.title} (due ${a.due}, owner ${a.owner})`)
    .join('\n') || '- None listed';

export const BRIEFING_CONFIGS: Record<BriefingFormatId, BriefingConfig> = {
  premeeting: {
    id: 'premeeting',
    fallbackQuery: 'Brief me on my 3pm meeting tomorrow.',
    cannedKey: 'Brief me on my 3pm meeting tomorrow.',
    agents: ['cos', 'relationship', 'strategy'],
    buildUserMessage: (state, ar, userPaste) => {
      return ar
        ? `${userPasteBlock(userPaste, ar)}أنشئ **إحاطة ما قبل الاجتماع** من المحتوى الملصق أعلاه.

**سياق إضافي (إن وُجد في KB):**
${DOC_LIST(state)}

**إجراءات مفتوحة:** ${OPEN_ACTIONS(state)}

${kbRules(ar)}

اتبع قالب إحاطة ما قبل الاجتماع (الأقسام 1–9). اربط النقاط بالمحتوى الملصق وقاعدة المعرفة.`
        : `${userPasteBlock(userPaste, ar)}Generate an executive **pre-meeting brief** from the pasted content above.

**Supplementary context (KB / store):**
${DOC_LIST(state)}

**Open actions:** ${OPEN_ACTIONS(state)}

${kbRules(ar)}

Follow the mandatory pre-meeting brief template (sections 1–9: Meeting Snapshot → 30-Second Brief). Tie every section to the pasted material and KB sources.`;
    },
  },

  boardpack: {
    id: 'boardpack',
    fallbackQuery: 'What strategic decisions did ADGM make in 2024 and how do they track against Falcon Economy priorities?',
    cannedKey: 'What strategic decisions did ADGM make in 2024 and how do they track against Falcon Economy priorities?',
    agents: ['cos', 'strategy'],
    buildUserMessage: (state, ar, userPaste) => {
      const boardDocs = state.documents
        .filter((d) => /board|falcon|strategic/i.test(d.name))
        .map((d) => `- ${d.name}: ${d.summary}`)
        .join('\n');
      return ar
        ? `${userPasteBlock(userPaste, ar)}لخّص **حزمة مجلس الإدارة** من المحتوى الملصق إلى قرارات ومخاطر.

**مستندات KB ذات صلة:**
${boardDocs || DOC_LIST(state)}

${kbRules(ar)}

اتبع قالب ملخص حزمة مجلس الإدارة (الأقسام 1–8). اكتب "غير متوفر في المصادر" عند غياب البيانات.`
        : `${userPasteBlock(userPaste, ar)}Produce a **board pack summary** from the pasted materials — decisions and risks, not narrative.

**Relevant KB documents:**
${boardDocs || DOC_LIST(state)}

${kbRules(ar)}

Follow the board pack template (sections 1–8). Write "Not in available sources" where data is missing.`;
    },
  },

  stakeholder: {
    id: 'stakeholder',
    fallbackQuery:
      'Stakeholder profile for Singapore MAS delegation Deputy MD from CRM and meeting history.',
    cannedKey: null,
    agents: ['relationship', 'cos'],
    buildUserMessage: (state, ar, userPaste) => {
      return ar
        ? `${userPasteBlock(userPaste, ar)}أنشئ **ملف صاحب مصلحة** من الملاحظات/CRM الملصقة.

**KB ذات صلة:** ${DOC_LIST(state, 6)}
**إجراءات مفتوحة:** ${OPEN_ACTIONS(state)}

${kbRules(ar)}

اتبع قالب ملف صاحب المصلحة (الأقسام 1–10). صنّف الاستنتاجات كتفسير عند الحاجة.`
        : `${userPasteBlock(userPaste, ar)}Generate a **stakeholder profile** from the pasted notes / CRM context.

**Relevant KB:** ${DOC_LIST(state, 6)}
**Open actions:** ${OPEN_ACTIONS(state)}

${kbRules(ar)}

Follow the stakeholder template (sections 1–10). Label inferences as interpretation.`;
    },
  },

  email: {
    id: 'email',
    fallbackQuery: 'Draft an email for me',
    cannedKey: null,
    agents: ['comms'],
    buildUserMessage: (state, ar, userPaste) => {
      return ar
        ? `${userPasteBlock(userPaste, ar)}صِغ **مسودة رد بريد إلكتروني** جاهزة للإرسال على البريد الملصق أعلاه.

**KB للسياق المؤسسي:** ${DOC_LIST(state, 4)}

${kbRules(ar)}

اتبع قالب الرد البريدي (الأقسام 1–5). لا أسئلة متابعة — مسودة جاهزة للنسخ.`
        : `${userPasteBlock(userPaste, ar)}Draft a **ready-to-send email reply** to the pasted message above.

**KB for institutional context:** ${DOC_LIST(state, 4)}

${kbRules(ar)}

Follow the email reply template (sections 1–5). No follow-up questions — output a copy-ready draft.`;
    },
  },
};

export function getBriefingConfig(id: string): BriefingConfig {
  return BRIEFING_CONFIGS[id as BriefingFormatId] ?? BRIEFING_CONFIGS.premeeting;
}

export function getCannedBriefingText(config: BriefingConfig): string | null {
  if (!config.cannedKey) return null;
  return CANNED[config.cannedKey] ?? null;
}

/** Query string for KB retrieval — pasted text + format hints. */
export function buildBriefingKbQuery(userPaste: string, config: BriefingConfig): string {
  const paste = userPaste.trim().slice(0, 3000);
  return [paste, config.fallbackQuery].filter(Boolean).join('\n\n');
}
