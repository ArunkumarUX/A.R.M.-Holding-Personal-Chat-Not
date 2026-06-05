import { useState, useRef, useEffect } from 'react';
import { CcIcon } from '../../command-centre/CcIcon';
import { useApp } from '../../context/AppContext';
import { useSlideStore } from './useSlideStore';
import { checkSlideAiAvailable, runSlideAgent } from './claudeSlideAgent';
import { DESIGN_BOOST_PROMPT } from './prompts';
import {
  formatSlideAiExecutiveBrief,
  userRequestsSlideContext,
} from './buildSlideAiContext';
import { userRequestsNewDeck } from './parseDeckRequest';

const SUGGESTIONS_EN = [
  'Use Command Centre context — 10-slide ADGM board pack on digital assets and Falcon Economy',
  'Create a McKinsey-style investor deck on FSRA regulatory outlook for Q3',
  '8-slide CSO strategy update with Claude Design — navy hero, KPI slides',
];

const SUGGESTIONS_AR = [
  'أنشئ عرضاً من 10 شرائح لمجلس ADGM حول الأصول الرقمية والاقتصاد الصقور',
  'عرض للمستثمرين عن التوقعات التنظيمية لـ FSRA',
];

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
  const suggestions = ar ? SUGGESTIONS_AR : SUGGESTIONS_EN;
  const loadingSteps = ar ? LOADING_STEPS_AR : LOADING_STEPS_EN;
  const [apiLive, setApiLive] = useState<boolean | null>(null);

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

  async function send(text?: string) {
    const userMsg = (text ?? input).trim();
    if (!userMsg || isLoading) return;
    setInput('');
    addMessage({ role: 'user', content: userMsg });
    setLoading(true);
    setLoadingStep(0);

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
      };
      const result = await runSlideAgent(userMsg, state.chatHistory, deckForAgent, slideOptions);
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
      const detail = err instanceof Error ? err.message : '';
      addMessage({
        role: 'assistant',
        content: ar
          ? `حدث خطأ${detail ? `: ${detail}` : ''}. أعد تشغيل npm run dev وحاول مرة أخرى.`
          : `Something went wrong${detail ? `: ${detail}` : ''}. Restart npm run dev and try again.`,
      });
    } finally {
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
                ? 'صف عرضك — Claude Design + ADGM'
                : 'Describe your deck — Claude Design + ADGM Brand Book 2025.'}
            </p>
            <p className="cc-slideai__empty-sub">
              {ar
                ? 'قل "استخدم سياق مركز القيادة" للحقائق الداخلية'
                : 'Say "use Command Centre context" to ground slides in KB, calendar, and actions.'}
            </p>
            <p className="cc-slideai__empty-hint">
              {ar ? 'جرّب:' : 'Try:'}
            </p>
            <div className="cc-slideai__suggestions">
              {suggestions.map((s) => (
                <button key={s} type="button" className="cc-slideai__suggestion" onClick={() => send(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {chatHistory.map((m, i) => (
          <div key={i} className={`cc-slideai__msg cc-slideai__msg--${m.role}`}>
            <div className="cc-slideai__bubble">{m.content}</div>
          </div>
        ))}
        {isLoading && (
          <div className="cc-slideai__msg cc-slideai__msg--assistant">
            <div className="cc-slideai__bubble cc-slideai__bubble--loading">
              <span className="cc-slideai__typing" aria-hidden />
              <span className="cc-slideai__loading-text">{loadingSteps[loadingStep]}</span>
            </div>
          </div>
        )}
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
          className="btn-primary cc-slideai__send"
          onClick={() => send()}
          disabled={isLoading || !input.trim()}
          aria-label={ar ? 'إرسال' : 'Send'}
        >
          <CcIcon name="send" size={18} />
        </button>
      </div>
    </div>
  );
}
