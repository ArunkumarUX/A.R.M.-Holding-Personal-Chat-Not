// @ts-nocheck
import { useMemo } from 'react';
import { SourceCitationChip } from '../components/chat/SourceCitationChip';
import { CcIcon } from './CcIcon';
import { Emblem } from './CcPrimitives';
import { mdToNodes } from './CcMarkdown';
import type { Source } from '../types';
import { panelSources } from '../utils/sourceLinks';
import type { AgentType } from '../types';
import { ChatThinkingLoader } from './ChatThinkingLoader';
import { ChatAgentRoster } from './ChatAgentRoster';
import { ChatApiNotice } from '../components/chat/ChatApiNotice';
import type { OfflineNoticeKind } from '../types';
import { stripOfflineFallbackBanner } from '../utils/claudeErrors';
import { stripAnswerSourceFooter } from '../utils/sourceHandles';

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
  offlineNotice?: OfflineNoticeKind;
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

  const isThinking = m.thinking && !m.text?.trim();
  const showRoster = (m.agents?.length ?? 0) > 0;
  const rendered = useMemo(() => {
    if (m.offlineNotice) {
      return { notice: m.offlineNotice, text: stripAnswerSourceFooter(m.text) };
    }
    const legacy = stripOfflineFallbackBanner(m.text);
    return { ...legacy, text: stripAnswerSourceFooter(legacy.text) };
  }, [m.offlineNotice, m.text]);

  return (
    <div className="chat-ai-msg mi-chat-in">
      <div className="chat-ai-msg__avatar">
        <Emblem size={22} />
      </div>
      <div className="chat-ai-msg__body">
        {showRoster ? (
          <ChatAgentRoster
            agentIds={(m.agents ?? []) as AgentType[]}
            activeAgent={isThinking ? m.activeAgent : null}
            ar={ar}
          />
        ) : null}
        {isThinking ? (
          <ChatThinkingLoader
            agentIds={(m.agents ?? []) as AgentType[]}
            activeAgent={m.activeAgent}
            ar={ar}
          />
        ) : (
          <div className={`chat-ai-msg__content ${ar ? 'lang-ar' : ''}`}>
            {rendered.notice ? <ChatApiNotice kind={rendered.notice} ar={ar} /> : null}
            {mdToNodes(rendered.text)}
          </div>
        )}

        {(showSourceMeta || showActions) && (
          <div className="chat-ai-meta">
            <div
              className={`chat-ai-meta__toolbar${showSourceMeta ? '' : ' chat-ai-meta__toolbar--actions-only'}`}
            >
              {showSourceMeta && (
                <div className="chat-ai-meta__primary">
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
