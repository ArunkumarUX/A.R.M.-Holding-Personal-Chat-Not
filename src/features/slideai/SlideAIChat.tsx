import { useState, useRef, useEffect } from 'react';
import { CcIcon } from '../../command-centre/CcIcon';
import { useApp } from '../../context/AppContext';
import { useSlideStore } from './useSlideStore';
import { checkSlideAiAvailable, runSlideAgent } from './claudeSlideAgent';
import { DESIGN_BOOST_PROMPT } from './prompts';
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
      'Use Command Centre context — 10-slide A.R.M. Holding CEO board pack: portfolio performance, Jebel Ali progress, RERA compliance, We Emerge Stronger',
  },
  {
    id: 'strategy-update',
    label: 'Leadership strategy update',
    prompt:
      '8-slide McKinsey-style strategy update for A.R.M. Holding leadership — navy hero, KPI slides, DREC/HUNA/HIVE benchmarks',
  },
  {
    id: 'capri-investor',
    label: 'Capri LLC investor deck',
    prompt:
      'Create an investor deck for Capri LLC: UAE & international investment pipeline, D33 alignment, deal pipeline strategy',
  },
];

const QUICK_PROMPTS_AR = [
  {
    id: 'ceo-board',
    label: 'حزمة مجلس الرئيس التنفيذي',
    prompt:
      'أنشئ عرضاً من 10 شرائح لمجلس A.R.M. Holding: أداء المحفظة، جبل علي، امتثال RERA، We Emerge Stronger',
  },
  {
    id: 'capri-investor',
    label: 'عرض مستثمرين Capri LLC',
    prompt: 'عرض للمستثمرين حول خط صفقات Capri LLC وتوافق أجندة D33',
  },
];

/**
 * Consulting-grade deck templates — full prompts adapted to A.R.M. Holding context.
 * These populate the input field (not auto-sent) so the user can review before generating.
 */
export const DECK_TEMPLATES = [
  {
    id: 'ai-platform',
    icon: 'cpu',
    label: 'AI Decision Support Platform',
    description: '10-slide McKinsey-grade strategy deck — building the Personal AI for A.R.M. Holding CEO',
    prompt: `Create a 10-slide consulting-grade, board-ready strategy presentation for A.R.M. Holding CEO H.E. Mohammad Saeed Al Shehhi.

Topic: Building an AI-powered Executive Decision Support Platform for A.R.M. Holding
Audience: CEO and A.R.M. Holding senior leadership team — commercially sharp, time-poor, decision-oriented
Context: A.R.M. Holding (DREC 3,200+ units, HUNA design-led residential + We Emerge Stronger, HIVE coliving 91% occupancy, Capri LLC investment arm, Jebel Ali Racecourse 5km² BIG+WSP) needs a governed AI intelligence layer for CEO decision-making.

Required 10-slide structure:
1. Title slide — premium navy hero
2. Executive summary — recommendation first: pilot the AI platform starting with 3 high-value use cases
3. Strategic context — information fragmentation and decision speed pressure facing A.R.M. Holding leadership
4. Current pain points — manual synthesis, inconsistent briefing quality, fragmented portfolio signals
5. Strategic positioning — intelligence layer (not chatbot): market signals, RERA compliance, Jebel Ali milestones, board briefings
6. Priority use cases 2×2 matrix — CEO meeting briefings, Dubai market signals, DREC compliance tracker, board pack generation
7. Target platform model — Executive Home + AI Strategy Agent + Briefings + Knowledge Base + Governance Layer
8. Governance and trust model — source control, permissioning, audit trail, human review
9. Pilot roadmap — 3 phases: design → build → launch
10. Decisions required — what CEO must approve, pilot scope, success metrics, next milestone

Rules: Answer-first, action slide titles (full sentence insight), one message per slide, MECE structure, exhibit on every slide, no generic AI language, separate facts/assumptions/recommendations. Deep navy hero title and close, white content slides. Use Command Centre context.`,
  },
  {
    id: 'tokenised-finance',
    icon: 'trending-up',
    label: 'Tokenised Finance Strategy',
    description: '10-slide exhibit-led deck — tokenised real estate & digital asset opportunity for Capri LLC and HUNA',
    prompt: `Create a 10-slide consulting-grade, chart-led, board-ready strategy presentation for A.R.M. Holding CEO.

Topic: Tokenised Real Estate Finance & Digital Asset Strategy for A.R.M. Holding
Audience: CEO H.E. Mohammad Saeed Al Shehhi and Capri LLC investment leadership — institutional, evidence-focused
Context: A.R.M. Holding (HUNA design-led residential, Capri LLC UAE & international investment arm, DREC 3,200+ units) is evaluating tokenised real estate finance as a strategic growth lane aligned with Dubai D33 economic agenda.

Required 10-slide structure:
1. Title slide — "Tokenised real estate finance is moving from experimentation toward regulated institutional adoption in Dubai"
2. Executive summary — recommended strategic posture: prioritise tokenised HUNA units, Capri LLC digital deals, DREC coliving REITs before speculative crypto
3. Market momentum — stablecoin & tokenised RWA growth chart (line chart with inflection points, institutional adoption callout)
4. Settlement opportunity — cross-border payment value pool for Capri LLC (bar chart: corporate treasury, UAE-international, trade finance)
5. Jurisdiction benchmark table — Dubai/DIFC, Abu Dhabi/ADGM, Singapore, Hong Kong, Switzerland: regulatory clarity, tokenised fund activity, custody maturity
6. Regulatory maturity heatmap — RERA/DLD/CBUAE/DFSA rows vs jurisdictions: green/amber/red maturity scoring
7. Opportunity prioritisation 2×2 matrix — strategic value vs feasibility: tokenised HUNA units, Capri LLC digital deals, DREC REITs, stablecoin settlement, retail crypto (do not prioritise)
8. Strategic options matrix — 4 options scored: Tokenised HUNA launch, Capri LLC digital fund, DREC coliving REIT, broad crypto exchange (not recommended)
9. Risk and governance model — AML, custody, stablecoin reserve, regulatory arbitrage, reputational risk — risk heatmap with controls
10. Decisions required — approve 3 priority lanes, regulatory review scope, target institution segments, pilot partnership themes, next milestone

Rules: Chart-led (8+ exhibits), at least 5 quantitative charts, action titles, source notes on every chart, no crypto hype language. All placeholder data clearly marked [insert verified metric]. Deep navy executive theme.`,
  },
] as const;

const LOADING_STEPS_EN = [
  'Understanding your request…',
  'Designing slide changes…',
  'Applying to preview…',
];

const LOADING_STEPS_AR = [
  'جاري فهم طلبك…',
  'جاري تصميم التعديلات…',
  'جاري تطبيق المعاينة…',
];

export default function SlideAIChat() {
  const { settings, executiveState } = useApp();
  const ar = settings.language === 'ar';
  const [input, setInput] = useState('');
  const {
    chatHistory,
    isLoading,
    loadingStep,
    deck,
    addMessage,
    applyAgentResult,
    setLoading,
    setLoadingStep,
  } = useSlideStore();
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const abortedRef = useRef(false);
  const suggestions = ar ? QUICK_PROMPTS_AR : QUICK_PROMPTS_EN;
  const loadingSteps = ar ? LOADING_STEPS_AR : LOADING_STEPS_EN;
  const [apiLive, setApiLive] = useState<boolean | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    checkSlideAiAvailable().then(setApiLive);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isLoading, loadingStep]);

  useEffect(() => {
    if (!isLoading) return;
    const timer = window.setInterval(() => {
      setLoadingStep((loadingStep + 1) % loadingSteps.length);
    }, 1800);
    return () => window.clearInterval(timer);
  }, [isLoading, loadingStep, loadingSteps.length, setLoadingStep]);

  function stopGeneration() {
    if (!abortRef.current) return;
    abortedRef.current = true;
    abortRef.current.abort();
    abortRef.current = null;
    setLoading(false);
    addMessage({
      role: 'assistant',
      content: ar ? 'تم إيقاف التوليد.' : 'Generation stopped.',
    });
  }

  async function send(text?: string) {
    const userMsg = (text ?? input).trim();
    if (!userMsg || isLoading) return;
    setInput('');
    addMessage({ role: 'user', content: userMsg });
    setLoading(true);
    setLoadingStep(0);
    abortedRef.current = false;

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const state = useSlideStore.getState();
      const wantsNewDeck = userRequestsNewDeck(userMsg);
      const deckForAgent = wantsNewDeck ? null : state.deck;
      const executiveBrief = userRequestsSlideContext(userMsg)
        ? formatSlideAiExecutiveBrief(executiveState, userMsg)
        : undefined;
      const slideOptions = {
        executiveBrief,
        forceNewDeck: wantsNewDeck && Boolean(state.deck),
        signal: controller.signal,
      };
      const result = await runSlideAgent(userMsg, state.chatHistory, deckForAgent, slideOptions);
      if (abortedRef.current) return;
      const applied = applyAgentResult(result);
      if (result.message) {
        addMessage({
          role: 'assistant',
          content: applied ? result.message : `${result.message} (Preview unchanged — try naming the slide number.)`,
        });
      } else if (!applied && state.deck) {
        addMessage({
          role: 'assistant',
          content: ar
            ? 'لم أتمكن من تطبيق التغييرات على المعاينة. حاول: "عدّل الشريحة 2 — …"'
            : 'Could not apply changes to preview. Try: "Update slide 2 — …"',
        });
      }
      checkSlideAiAvailable().then(setApiLive);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      const detail = err instanceof Error ? err.message : '';
      addMessage({
        role: 'assistant',
        content: ar
          ? `حدث خطأ${detail ? `: ${detail}` : ''}. أعد تشغيل npm run dev وحاول مرة أخرى.`
          : `Something went wrong${detail ? `: ${detail}` : ''}. Restart npm run dev and try again.`,
      });
    } finally {
      abortRef.current = null;
      setLoading(false);
    }
  }

  return (
    <div className="cc-slideai__chat">
      {apiLive === false && (
        <div className="cc-slideai__api-banner" role="status">
          {ar
            ? 'الخادم غير متصل — معاينة محلية من موضوعك حتى يعود التوليف بالذكاء الاصطناعي.'
            : 'Server offline — local preview from your topic until AI synthesis is available.'}
        </div>
      )}
      <div className="cc-slideai__messages" role="log" aria-live="polite">
        {chatHistory.length === 0 && (
          <div className="cc-slideai__empty">
            <p className="cc-slideai__empty-title">
              {ar
                ? 'صف عرضك — A.R.M. Holding · Opus 4.8'
                : 'Describe your deck — A.R.M. Holding · Powered by Claude Opus 4.8'}
            </p>
            <p className="cc-slideai__empty-sub">
              {ar
                ? 'قل "استخدم سياق مركز القيادة" للحقائق الداخلية'
                : 'Say "use Command Centre context" to ground slides in portfolio KB, calendar, and market data.'}
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

      {deck && (
        <div className="cc-slideai__boost-bar">
          <button
            type="button"
            className="cc-slideai__boost-btn"
            onClick={() => send(DESIGN_BOOST_PROMPT)}
            disabled={isLoading}
          >
            ✨ {ar ? 'تحسين التصميم' : 'Boost Design'}
          </button>
        </div>
      )}

      {isLoading && (
        <div className="cc-slideai__generation" aria-live="polite" aria-busy="true">
          <div className="cc-slideai__bubble cc-slideai__bubble--loading">
            <span className="cc-slideai__typing" aria-hidden />
            <span className="cc-slideai__loading-text">{loadingSteps[loadingStep]}</span>
          </div>
          <button
            type="button"
            className="cc-slideai__stop"
            onClick={stopGeneration}
            aria-label={ar ? 'إيقاف التوليد' : 'Stop generation'}
          >
            <CcIcon name="square" size={14} />
            {ar ? 'إيقاف' : 'Stop'}
          </button>
        </div>
      )}

      <div className="cc-slideai__composer">
        <textarea
          className="cc-slideai__input"
          placeholder={
            ar
              ? 'صف العرض أو اطلب تعديل أي شريحة…'
              : 'Describe your presentation or ask to change anything…'
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
          className={`btn-primary cc-slideai__send${isLoading ? ' cc-slideai__send--stop' : ''}`}
          onClick={() => (isLoading ? stopGeneration() : send())}
          disabled={!isLoading && !input.trim()}
          aria-label={isLoading ? (ar ? 'إيقاف التوليد' : 'Stop generation') : ar ? 'إرسال' : 'Send'}
        >
          <CcIcon name={isLoading ? 'square' : 'send'} size={18} />
        </button>
      </div>
    </div>
  );
}
