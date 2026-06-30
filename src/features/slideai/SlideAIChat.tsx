import { useState, useRef, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { CcIcon } from '../../command-centre/CcIcon';
import { useApp } from '../../context/AppContext';
import { useSlideStore } from './useSlideStore';
import { usePerceptisDeckStore } from './perceptisDeckStore';
import { buildPerceptisPromptPayload, ALLOWED_SLIDE_COUNTS } from '../../api/perceptisDeckPayload';
import { checkSlideAiAvailable } from './claudeSlideAgent';
import { PORTFOLIO_QUICK_STARTS } from './mckinseyGuidanceContent';
import {
  formatSlideAiExecutiveBrief,
  userRequestsSlideContext,
} from './buildSlideAiContext';
import { userRequestsNewDeck } from './parseDeckRequest';

const QUICK_PROMPTS_EN = [
  {
    id: 'ceo-board',
    label: 'CEO board pack',
    prompt:
      'Use Command Centre context — 8-slide Apparel Group CEO board pack: portfolio performance, KSA expansion, UAE retail compliance, Images RetailME Awards',
  },
  {
    id: 'strategy-update',
    label: 'Leadership strategy update',
    prompt:
      '8-slide McKinsey-style strategy update for Apparel Group leadership — navy hero, KPI slides, R&B/6thStreet/Club Apparel benchmarks',
  },
  {
    id: 'nysaa-investor',
    label: 'Nysaa beauty expansion deck',
    prompt:
      'Create an investor deck for Nysaa: Nykaa GCC partnership, beauty retail expansion, omnichannel growth strategy',
  },
];

const QUICK_PROMPTS_AR = [
  {
    id: 'ceo-board',
    label: 'حزمة مجلس الرئيس التنفيذي',
    prompt:
      'أنشئ عرضاً من 10 شرائح لمجلس Apparel Group: أداء المحفظة، توسع السعودية، امتثال التجزئة في الإمارات، Images RetailME Awards',
  },
  {
    id: 'nysaa-investor',
    label: 'عرض توسع Nysaa',
    prompt: 'عرض لتوسع Nysaa وجمال التجزئة في الخليج وشراكة Nykaa',
  },
];

/**
 * Consulting-grade deck templates — full prompts adapted to Apparel Group context.
 * These populate the input field (not auto-sent) so the user can review before generating.
 */
export const DECK_TEMPLATES = [
  {
    id: 'ai-platform',
    icon: 'cpu',
    label: 'AI Decision Support Platform',
    description: '8-slide McKinsey-grade strategy deck — building the Personal AI for Apparel Group CEO',
    prompt: `Create an 8-slide consulting-grade, board-ready strategy presentation for Apparel Group CEO Neeraj Teckchandani.

Topic: Building an AI-powered Executive Decision Support Platform for Apparel Group
Audience: CEO and Apparel Group senior leadership team — commercially sharp, time-poor, decision-oriented
Context: Apparel Group (2,500+ stores, 85+ brands, R&B 100+ stores, 6thStreet omnichannel, Club Apparel 10M+ members, Nysaa beauty retail) needs a governed AI intelligence layer for CEO decision-making.

Required 8-slide structure:
1. Title slide — premium navy hero
2. Executive summary — recommendation first: pilot the AI platform starting with 3 high-value use cases
3. Strategic context and current pain points — information fragmentation, inconsistent briefing quality, fragmented portfolio signals across 14 countries
4. Strategic positioning — intelligence layer (not chatbot): GCC retail signals, store performance, KSA expansion, board briefings
5. Priority use cases 2×2 matrix — CEO meeting briefings, GCC market signals, R&B store tracker, board pack generation
6. Target platform model and governance — Executive Home + AI Strategy Agent + Briefings + Knowledge Base + Governance Layer; source control, permissioning, audit trail
7. Pilot roadmap — 3 phases: design → build → launch
8. Decisions required — what CEO must approve, pilot scope, success metrics, next milestone

Rules: Answer-first, action slide titles (full sentence insight), one message per slide, MECE structure, exhibit on every slide, no generic AI language, separate facts/assumptions/recommendations. Deep navy hero title and close, white content slides. Use Command Centre context.`,
  },
  {
    id: 'omnichannel-growth',
    icon: 'trending-up',
    label: 'Omnichannel Growth Strategy',
    description: '8-slide exhibit-led deck — 6thStreet, Club Apparel and KSA expansion for Apparel Group',
    prompt: `Create an 8-slide consulting-grade, chart-led, board-ready strategy presentation for Apparel Group CEO Neeraj Teckchandani.

Topic: Omnichannel Growth & KSA Expansion Strategy for Apparel Group
Audience: CEO Neeraj and Apparel Group senior leadership — institutional, evidence-focused
Context: Apparel Group (6thStreet omnichannel, Club Apparel 10M+ loyalty members, R&B 100+ stores, 2,500+ stores in 14 countries) is accelerating KSA expansion via Arabian Alesaar partnership and 90-minute fashion delivery.

Required 8-slide structure:
1. Title slide — "Omnichannel delivery and KSA expansion are Apparel Group's highest-growth vectors in 2026"
2. Executive summary — recommended posture: prioritise 6thStreet delivery scale, Club Apparel engagement, KSA store rollout
3. Market momentum — GCC retail sales growth chart (+8.2% YoY, e-commerce penetration 22%)
4. Omnichannel opportunity — 6thStreet 90-min delivery vs Namshi/Noon benchmark (bar chart)
5. GCC market entry benchmark — UAE/KSA/Qatar/Bahrain licensing, VAT, labour law maturity table + KSA expansion heatmap vs competitor mall openings
6. Opportunity prioritisation 2×2 matrix — strategic value vs feasibility: 6thStreet KSA, Club Apparel campaigns, R&B new stores, Nysaa beauty
7. Strategic options matrix and risk — 4 options scored with IRR and risk; labour attrition, mall lease terms, brand partner dependencies
8. Decisions required — approve KSA milestones, 6thStreet delivery expansion, Club Apparel campaign, next milestone

Rules: Chart-led (6+ exhibits), at least 4 quantitative charts, action titles, source notes on every chart. Deep navy executive theme.`,
  },
] as const;

const LOADING_STEPS_EN = [
  'Sending your brief to Perceptis…',
  'Queued — preparing your deck…',
  'Building slides with AI…',
  'Applying Apparel Group brand…',
];

const LOADING_STEPS_AR = [
  'إرسال الموجز إلى Perceptis…',
  'في قائمة الانتظار…',
  'بناء الشرائح بالذكاء الاصطناعي…',
  'تطبيق هوية Apparel Group…',
];

export default function SlideAIChat() {
  const { settings, executiveState } = useApp();
  const ar = settings.language === 'ar';
  const [input, setInput] = useState('');
  const { chatHistory, addMessage } = useSlideStore(
    useShallow((s) => ({
      chatHistory: s.chatHistory,
      addMessage: s.addMessage,
    })),
  );
  const { phase, progressStep, message, cancel } = usePerceptisDeckStore(
    useShallow((s) => ({
      phase: s.phase,
      progressStep: s.progressStep,
      message: s.message,
      cancel: s.cancel,
    })),
  );
  const isGenerating = phase === 'queued' || phase === 'generating';
  const bottomRef = useRef<HTMLDivElement>(null);
  const suggestions = ar ? QUICK_PROMPTS_AR : QUICK_PROMPTS_EN;
  const loadingSteps = ar ? LOADING_STEPS_AR : LOADING_STEPS_EN;
  const [apiLive, setApiLive] = useState<boolean | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [slideCount, setSlideCount] = useState<number>(8);

  useEffect(() => {
    checkSlideAiAvailable().then(setApiLive);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isGenerating, progressStep]);

  function stopGeneration() {
    cancel();
    addMessage({
      role: 'assistant',
      content: ar ? 'تم إيقاف الإنشاء. يمكنك إعادة المحاولة من المعاينة.' : 'Generation stopped. You can retry from the preview panel.',
    });
  }

  function send(text?: string) {
    const userMsg = (text ?? input).trim();
    if (!userMsg || isGenerating) return;
    setInput('');
    addMessage({ role: 'user', content: userMsg });

    if (userRequestsNewDeck(userMsg)) {
      usePerceptisDeckStore.getState().reset();
    }

    const executiveBrief = userRequestsSlideContext(userMsg)
      ? formatSlideAiExecutiveBrief(executiveState, userMsg)
      : undefined;

    const payload = buildPerceptisPromptPayload(userMsg, { executiveBrief, slideCount });
    const sourceKey = `${userMsg}::${executiveBrief ?? ''}::${slideCount}`;

    usePerceptisDeckStore.getState().startFromPrompt(payload, sourceKey, userMsg);

    addMessage({
      role: 'assistant',
      content: ar
        ? 'جاري إنشاء عرضك عبر Perceptis — ستظهر المعاينة والتقدم على اليمين.'
        : 'Building your deck with Perceptis — progress and preview are on the right.',
    });

    checkSlideAiAvailable().then(setApiLive);
  }

  return (
    <div className="cc-slideai__chat">
      {apiLive === false && (
        <div className="cc-slideai__api-banner" role="status">
          {ar
            ? 'الخادم غير متصل — تأكد من تشغيل npm run dev لإنشاء العروض عبر Perceptis.'
            : 'Server offline — start npm run dev to generate decks via Perceptis.'}
        </div>
      )}
      <div className="cc-slideai__messages" role="log" aria-live="polite">
        {chatHistory.length === 0 && (
          <div className="cc-slideai__empty">
            <p className="cc-slideai__empty-title">
              {ar
                ? 'صف عرضك — Perceptis · Apparel Group'
                : 'Describe your deck — Perceptis · Apparel Group'}
            </p>
            <p className="cc-slideai__empty-sub">
              {ar
                ? 'يُنشأ العرض مباشرة عبر Perceptis — قل "استخدم سياق مركز القيادة" للحقائق الداخلية'
                : 'Your deck is built directly by Perceptis — say "use Command Centre context" for internal facts.'}
            </p>

            <section className="cc-slideai__prompt-section" aria-label={ar ? 'قوالب العروض' : 'Deck templates'}>
              <h3 className="cc-slideai__prompt-section-title">
                {ar ? 'قوالب المحفظة' : 'Portfolio deck templates'}
              </h3>
              <ul className="cc-slideai__prompt-list">
                {PORTFOLIO_QUICK_STARTS.map((tpl) => (
                  <li key={tpl.id}>
                    <button
                      type="button"
                      className="cc-slideai__template-btn"
                      onClick={() => setInput(tpl.prompt)}
                      title={ar ? 'تحميل في حقل الإدخال' : 'Load into input — review then send'}
                    >
                      <span className="cc-slideai__template-btn-icon" aria-hidden>
                        <CcIcon name={tpl.icon as 'cpu'} size={14} />
                      </span>
                      <span className="cc-slideai__template-btn-body">
                        <span className="cc-slideai__template-btn-title">
                          {ar ? tpl.labelAr : tpl.labelEn}
                        </span>
                        <span className="cc-slideai__template-btn-desc">
                          {ar ? tpl.descriptionAr : tpl.descriptionEn}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            <section className="cc-slideai__prompt-section" aria-label={ar ? 'قوالب إضافية' : 'More templates'}>
              <div className="cc-slideai__prompt-section-head">
                <h3 className="cc-slideai__prompt-section-title">
                  {ar ? 'قوالب إضافية' : 'More templates'}
                </h3>
                <button
                  type="button"
                  className="cc-slideai__prompt-toggle"
                  onClick={() => setShowTemplates((v) => !v)}
                  aria-expanded={showTemplates}
                >
                  {showTemplates ? (ar ? 'إخفاء' : 'Hide') : (ar ? 'عرض' : 'Show')}
                </button>
              </div>
              {showTemplates && (
                <ul className="cc-slideai__prompt-list">
                  {DECK_TEMPLATES.map((tpl) => (
                    <li key={tpl.id}>
                      <button
                        type="button"
                        className="cc-slideai__template-btn"
                        onClick={() => setInput(tpl.prompt)}
                        title={ar ? 'تحميل في حقل الإدخال' : 'Load into input — review then send'}
                      >
                        <span className="cc-slideai__template-btn-icon" aria-hidden>
                          <CcIcon name={tpl.icon as 'cpu'} size={14} />
                        </span>
                        <span className="cc-slideai__template-btn-body">
                          <span className="cc-slideai__template-btn-title">{tpl.label}</span>
                          <span className="cc-slideai__template-btn-desc">{tpl.description}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="cc-slideai__prompt-section" aria-label={ar ? 'اقتراحات سريعة' : 'Quick prompts'}>
              <h3 className="cc-slideai__prompt-section-title">
                {ar ? 'اقتراحات سريعة' : 'Quick prompts'}
              </h3>
              <ul className="cc-slideai__prompt-list">
                {suggestions.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className="cc-slideai__quick-btn"
                      onClick={() => send(item.prompt)}
                      title={item.prompt}
                    >
                      <span className="cc-slideai__quick-btn-label">{item.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}
        {chatHistory.map((m, i) => (
          <div key={i} className={`cc-slideai__msg cc-slideai__msg--${m.role}`}>
            <div className="cc-slideai__bubble">{m.content}</div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {isGenerating && (
        <div className="cc-slideai__generation" aria-live="polite" aria-busy="true">
          <div className="cc-slideai__bubble cc-slideai__bubble--loading">
            <span className="cc-slideai__typing" aria-hidden />
            <span className="cc-slideai__loading-text">
              {message || loadingSteps[Math.min(progressStep, loadingSteps.length - 1)]}
            </span>
          </div>
          <button
            type="button"
            className="cc-slideai__stop"
            onClick={stopGeneration}
            aria-label={ar ? 'إيقاف الإنشاء' : 'Stop generation'}
          >
            <CcIcon name="square" size={14} />
            {ar ? 'إيقاف' : 'Stop'}
          </button>
        </div>
      )}

      <div className="cc-slideai__slidecount-row" role="radiogroup" aria-label={ar ? 'عدد الشرائح' : 'Slide count'}>
        <span className="cc-slideai__slidecount-label">{ar ? 'الشرائح' : 'Slides'}</span>
        {ALLOWED_SLIDE_COUNTS.map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={slideCount === n}
            className={`pill cc-slideai__slidecount-pill${slideCount === n ? ' cc-slideai__slidecount-pill--on' : ''}`}
            onClick={() => setSlideCount(n)}
          >
            {n}
          </button>
        ))}
        <span className="cc-slideai__slidecount-hint muted-3">
          {ar ? 'أقل = أسرع' : 'fewer = faster'}
        </span>
      </div>

      <div className="cc-slideai__composer">
        <textarea
          className="cc-slideai__input"
          placeholder={
            ar
              ? 'صف العرض التنفيذي الذي تريده…'
              : 'Describe the executive deck you need…'
          }
          value={input}
          rows={2}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />
        <button
          type="button"
          className={`btn-primary cc-slideai__send${isGenerating ? ' cc-slideai__send--stop' : ''}`}
          onClick={() => (isGenerating ? stopGeneration() : send())}
          disabled={!isGenerating && !input.trim()}
          aria-label={isGenerating ? (ar ? 'إيقاف الإنشاء' : 'Stop generation') : ar ? 'إرسال' : 'Send'}
        >
          <CcIcon name={isGenerating ? 'square' : 'send'} size={18} />
        </button>
      </div>
    </div>
  );
}
