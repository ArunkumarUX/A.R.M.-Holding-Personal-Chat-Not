// @ts-nocheck
import { SourceCitationChip } from '../components/chat/SourceCitationChip';
import { CcIcon } from './CcIcon';
import { Emblem } from './CcPrimitives';
import { mdToNodes } from './CcMarkdown';
import { AGENTS } from '../data/commandCentreData';
import type { Source } from '../types';
import { panelSources } from '../utils/sourceLinks';

function AgentChips({ ids, active }: { ids: string[]; active: number | null }) {
  const map = Object.fromEntries(AGENTS.map((a) => [a.id, a]));
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 12 }}>
      {ids.map((id, i) => {
        const a = map[id];
        if (!a) return null;
        const on = active === null || active >= i;
        return (
          <div
            key={id}
            className="pill ghost"
            style={{
              height: 28,
              opacity: on ? 1 : 0.4,
              borderColor: on ? a.color : 'var(--line)',
            }}
          >
            <CcIcon name={a.icon} size={13} style={{ color: a.color }} />
            <span style={{ fontSize: 11.5 }}>{a.name.replace(' AI', '')}</span>
          </div>
        );
      })}
    </div>
  );
}

function GroundingBadge({ level, ar }: { level?: string; ar: boolean }) {
  if (!level) return null;
  const cls = level === 'full' ? 'full' : level === 'partial' ? 'partial' : 'inferred';
  const label =
    level === 'full'
      ? ar
        ? 'تطابق قوي'
        : 'Strong match'
      : ar
        ? 'تطابق جزئي'
        : 'Partial match';
  const title =
    level === 'full'
      ? ar
        ? 'تطابق مصادر قوي'
        : 'High source match'
      : ar
        ? 'تغطية مصادر محدودة'
        : 'Limited source coverage';
  return (
    <span
      className={`chat-ai-meta__grounding chat-ai-meta__grounding--${cls}`}
      title={title}
    >
      <CcIcon name={level === 'full' ? 'shield-check' : 'shield'} size={13} aria-hidden />
      <span className="chat-ai-meta__grounding-label">{label}</span>
    </span>
  );
}

export type CcChatAiMsg = {
  id: number;
  role: 'ai';
  text: string;
  agents?: string[];
  thinking?: boolean;
  activeAgent?: number | null;
  confidence?: number;
  grounding?: string;
  sources?: Source[];
};

export function CcChatAiMessage({
  message: m,
  ar,
  busy,
  copied,
  onCopy,
  onRetry,
  onOpenSources,
}: {
  message: CcChatAiMsg;
  ar: boolean;
  busy: boolean;
  copied: boolean;
  onCopy: () => void;
  onRetry: () => void;
  onOpenSources: (sources: Source[]) => void;
}) {
  const linkedSources = panelSources(m.sources ?? []);
  const hasResources = linkedSources.length > 0;
  const messageReady = !m.thinking && Boolean(m.text?.trim());
  const showSourceMeta = messageReady && hasResources;
  const showActions = messageReady;

  return (
    <div className="chat-ai-msg mi-chat-in">
      <div className="chat-ai-msg__avatar">
        <Emblem size={22} />
      </div>
      <div className="chat-ai-msg__body">
        <AgentChips ids={m.agents || []} active={m.activeAgent ?? null} />
        {m.thinking && !m.text ? (
          <div className="muted chat-ai-msg__thinking">
            <span className="dot pulse" style={{ color: 'var(--accent-bright)', background: 'var(--accent-bright)' }} />
            {ar ? 'الوكلاء يجمعون ويُركّبون الإجابة…' : 'Agents synthesising response…'}
          </div>
        ) : (
          <div className={`chat-ai-msg__content ${ar ? 'lang-ar' : ''}`}>{mdToNodes(m.text)}</div>
        )}

        {(showSourceMeta || showActions) && (
          <div className="chat-ai-meta">
            <div
              className={`chat-ai-meta__toolbar${showSourceMeta ? '' : ' chat-ai-meta__toolbar--actions-only'}`}
            >
              {showSourceMeta && (
                <div className="chat-ai-meta__primary">
                  <GroundingBadge level={m.grounding} ar={ar} />
                  <SourceCitationChip
                    sources={linkedSources}
                    ar={ar}
                    compact
                    onClick={() => onOpenSources(linkedSources)}
                  />
                </div>
              )}
              {showActions && (
              <div className="chat-ai-meta__actions" role="toolbar" aria-label={ar ? 'إجراءات الرسالة' : 'Message actions'}>
                <button
                  type="button"
                  className={`chat-ai-meta__action-btn chat-ai-meta__action-btn--icon${copied ? ' mi-copied' : ''}`}
                  onClick={onCopy}
                  aria-label={copied ? (ar ? 'تم النسخ' : 'Copied') : ar ? 'نسخ' : 'Copy'}
                  title={copied ? (ar ? 'تم النسخ' : 'Copied') : ar ? 'نسخ' : 'Copy'}
                >
                  <CcIcon name={copied ? 'check' : 'copy'} size={16} />
                </button>
                <button
                  type="button"
                  className="chat-ai-meta__action-btn chat-ai-meta__action-btn--icon"
                  onClick={onRetry}
                  disabled={busy}
                  aria-label={ar ? 'إعادة المحاولة' : 'Retry'}
                  title={ar ? 'إعادة المحاولة' : 'Retry'}
                >
                  <CcIcon name="rotate-ccw" size={16} />
                </button>
              </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
