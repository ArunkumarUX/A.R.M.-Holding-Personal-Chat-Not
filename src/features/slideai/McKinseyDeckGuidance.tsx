import { useState } from 'react';
import { CcIcon } from '../../command-centre/CcIcon';
import {
  MCKINSEY_BOARD_TEMPLATE,
  MCKINSEY_MODELS,
  PORTFOLIO_QUICK_STARTS,
  SCQA_FORMULA,
  TITLE_EXAMPLES,
} from './mckinseyGuidanceContent';

type Props = {
  lang: 'en' | 'ar';
  onApplyPrompt: (text: string) => void;
  className?: string;
};

export function McKinseyDeckGuidance({ lang, onApplyPrompt, className = '' }: Props) {
  const ar = lang === 'ar';
  const [copied, setCopied] = useState(false);
  const scqa = SCQA_FORMULA[lang];
  const titles = TITLE_EXAMPLES[lang];

  const copyTemplate = async () => {
    try {
      await navigator.clipboard.writeText(MCKINSEY_BOARD_TEMPLATE);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      onApplyPrompt(MCKINSEY_BOARD_TEMPLATE);
    }
  };

  return (
    <div className={`mck-guidance${className ? ` ${className}` : ''}`}>
      <div className="mck-guidance__head">
        <CcIcon name="presentation" size={18} />
        <div>
          <h3 className="mck-guidance__title">
            {ar ? 'جودة عرض McKinsey' : 'McKinsey-level deck quality'}
          </h3>
          <p className="mck-guidance__sub">
            {ar
              ? 'SCQA · عناوين إجرائية · insightPanel · soWhat · sourceNote'
              : 'SCQA · action titles · insightPanel · soWhat · sourceNote'}
          </p>
        </div>
      </div>

      <section className="mck-guidance__section">
        <h4 className="mck-guidance__label">{ar ? 'اختيار النموذج' : 'Model selection'}</h4>
        <div className="mck-guidance__models">
          {MCKINSEY_MODELS.map((m) => (
            <div
              key={m.id}
              className={`mck-guidance__model${m.default ? ' mck-guidance__model--rec' : ''}`}
            >
              <div className="mck-guidance__model-top">
                <span className="mck-guidance__model-name">{m.label}</span>
                {m.default ? (
                  <span className="pill good" style={{ height: 22, fontSize: 10.5 }}>
                    {ar ? 'مفعّل في التطبيق' : 'Already set in your app'}
                  </span>
                ) : null}
              </div>
              <p className="mck-guidance__model-desc">{ar ? m.descriptionAr : m.descriptionEn}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mck-guidance__section">
        <h4 className="mck-guidance__label">
          {ar ? 'صيغة McKinsey (SCQA)' : 'The McKinsey Prompt Formula (SCQA)'}
        </h4>
        <div className="mck-guidance__scqa">
          {scqa.map((item) => (
            <div key={item.key} className="mck-guidance__scqa-item">
              <span className="mck-guidance__scqa-key">{item.key}</span>
              <div>
                <strong>{item.label}</strong>
                <p>{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mck-guidance__section">
        <div className="mck-guidance__template-head">
          <h4 className="mck-guidance__label" style={{ margin: 0 }}>
            {ar ? 'قالب جاهز للنسخ' : 'Copy-paste template'}
          </h4>
          <button type="button" className="btn btn-ghost" style={{ height: 32 }} onClick={copyTemplate}>
            <CcIcon name={copied ? 'check' : 'copy'} size={14} />
            {copied ? (ar ? 'تم النسخ' : 'Copied') : ar ? 'نسخ' : 'Copy'}
          </button>
        </div>
        <pre className="mck-guidance__template">{MCKINSEY_BOARD_TEMPLATE}</pre>
        <button
          type="button"
          className="btn btn-primary mck-guidance__apply"
          onClick={() => onApplyPrompt(MCKINSEY_BOARD_TEMPLATE)}
        >
          {ar ? 'تحميل في حقل الطلب' : 'Load into prompt'}
        </button>
      </section>

      <section className="mck-guidance__section">
        <h4 className="mck-guidance__label">
          {ar ? 'عناوين بجودة McKinsey' : 'What makes titles McKinsey-quality'}
        </h4>
        <div className="mck-guidance__titles-grid">
          <div className="mck-guidance__titles-col mck-guidance__titles-col--bad">
            <span className="mck-guidance__titles-tag">{ar ? 'ضعيف' : 'Bad (generic)'}</span>
            <ul>
              {titles.bad.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
          <div className="mck-guidance__titles-col mck-guidance__titles-col--good">
            <span className="mck-guidance__titles-tag">{ar ? 'قوي' : 'Good (action + insight)'}</span>
            <ul>
              {titles.good.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mck-guidance__section">
        <h4 className="mck-guidance__label">{ar ? 'بداية سريعة — محفظة A.R.M.' : 'Quick-start prompts'}</h4>
        <div className="mck-guidance__quick">
          {PORTFOLIO_QUICK_STARTS.map((q) => (
            <button
              key={q.id}
              type="button"
              className="mck-guidance__quick-btn"
              onClick={() => onApplyPrompt(q.prompt)}
            >
              <CcIcon name={q.icon as 'building-2'} size={15} />
              <span>{ar ? q.labelAr : q.labelEn}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
