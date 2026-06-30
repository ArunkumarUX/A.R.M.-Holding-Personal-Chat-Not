// @ts-nocheck
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CcIcon } from '../../command-centre/CcIcon';
import { Emblem } from '../../command-centre/CcPrimitives';
import { CcChatAiMessage } from '../../command-centre/CcChatAiMessage';
import { CANNED } from '../../data/commandCentreData';
import { useGstLive } from '../../utils/gstGreeting';
import { useApp } from '../../context/AppContext';
import { buildIntelligentResponse, resolveChatSources } from '../../data/executiveStore';
import { prepareChatTurn } from '../../api/prepareChatTurn';
import { buildChatHistory } from '../../api/buildChatContext';
import { streamClaudeChat } from '../../api/claudeChat';
import { detectChatIntent } from '../../utils/chatIntent';
import {
  formatClaudeErrorForUser,
  offlineNoticeKind,
  shouldFallbackToOfflineKb,
} from '../../utils/claudeErrors';
import { AgentContextChips } from '../../components/agents/AgentContextChips';
import { PRODUCT_AGENT_NAME, PRODUCT_AGENT_NAME_AR } from '../../config/user';
import { ChatHistorySheet } from '../../components/chat/ChatHistorySheet';
import {
  conversationToUiMessages,
  hydrateAssistantMessage,
  nextUiMessageId,
} from '../../utils/chatMessages';
import type { GroundingLevel, Source } from '../../types';
import { stripAnswerSourceFooter } from '../../utils/sourceHandles';

// Always use Claude — the VITE_USE_CLAUDE_API env var is ignored.
// (Previously it defaulted to false if unset on Vercel, silently blocking all AI responses.)
const USE_CLAUDE = true;

type ChatMsg =
  | { id: number; role: 'user'; text: string }
  | {
      id: number;
      role: 'ai';
      text: string;
      agents?: string[];
      thinking?: boolean;
      activeAgent?: number | null;
      confidence?: number;
      grounding?: GroundingLevel;
      sources?: Source[];
      offlineNotice?: import('../../types').OfflineNoticeKind;
    };

function buildAiPayload(
  q: string,
  executiveState: import('../../data/executiveStore').ExecutiveState,
  routedAgents: string[],
) {
  const intel = buildIntelligentResponse(q, executiveState);
  const canned = CANNED[q as keyof typeof CANNED];
  const text = canned ?? intel.content;
  const resolved = resolveChatSources(q, text, executiveState, intel.sourceDocIds);
  return {
    text,
    agents: routedAgents.length ? routedAgents : intel.agents,
    grounding: resolved.grounding,
    sources: resolved.sources,
  };
}

export function CommandCentreChatPage() {
  const {
    settings,
    executiveState,
    recordChatTurn,
    patchAssistantReply,
    createConversation,
    startNewChat,
    activeConversationId,
    activeConversation,
    copyMessage,
    setActiveSources,
    setSourcesPanelOpen,
    selectedAgents,
    autoRouteAgents,
    contextAgent,
    setContextAgent,
  } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const seed = searchParams.get('seed');
  const lang = settings.language === 'ar' ? 'ar' : 'en';
  const ar = lang === 'ar';
  const gst = useGstLive(lang);

  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const msgsRef = useRef(msgs);
  const idRef = useRef(0);
  const seedHandledRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  msgsRef.current = msgs;

  useEffect(() => {
    if (!busy) inputRef.current?.focus();
  }, [busy, activeConversationId]);

  useEffect(() => {
    // Do not wipe in-flight UI when a new conversation is created mid-send
    if (busy) return;

    if (!activeConversationId || !activeConversation) {
      setMsgs([]);
      idRef.current = 0;
      setSourcesPanelOpen(false);
      return;
    }

    const loaded = conversationToUiMessages(activeConversation.messages, executiveState);
    if (loaded.length === 0 && msgsRef.current.length > 0) return;

    setMsgs(loaded);
    idRef.current = nextUiMessageId(loaded);
    const lastAi = [...activeConversation.messages].reverse().find((m) => m.role === 'assistant');
    if (lastAi) {
      const lastAiIdx = activeConversation.messages.lastIndexOf(lastAi);
      const prevUser = activeConversation.messages
        .slice(0, lastAiIdx)
        .reverse()
        .find((m) => m.role === 'user');
      const { sources } = hydrateAssistantMessage(lastAi, executiveState, prevUser?.content ?? '');
      if (sources.length) setActiveSources(sources);
    }
    setSourcesPanelOpen(false);
  }, [
    busy,
    activeConversationId,
    activeConversation?.updatedAt,
    activeConversation?.messages?.length,
    executiveState,
    setActiveSources,
    setSourcesPanelOpen,
  ]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs, busy]);

  const runAgentAnimation = useCallback(async (aid: number, agents: string[]) => {
    for (let i = 0; i < agents.length; i++) {
      await new Promise((r) => setTimeout(r, 360));
      setMsgs((m) =>
        m.map((x) => (x.id === aid && x.role === 'ai' ? { ...x, activeAgent: i } : x)),
      );
    }
    await new Promise((r) => setTimeout(r, 280));
  }, []);

  const fillAiMessage = useCallback(
    async (
      aid: number,
      q: string,
      agents: string[],
    ): Promise<{
      text: string;
      agents: string[];
      sources: Source[];
      grounding?: GroundingLevel;
      offlineNotice?: import('../../types').OfflineNoticeKind;
    } | null> => {
      // Previous AI message — for conversation-aware routing (follow-up context)
      const prevAiMsg = [...msgsRef.current].reverse().find((m) => m.role === 'ai' && m.id !== aid);
      const previousAgents = (prevAiMsg?.role === 'ai' ? (prevAiMsg.agents ?? []) : []) as import('../../types').AgentType[];
      const prevAiText = prevAiMsg?.role === 'ai' ? (prevAiMsg.text ?? '') : '';
      // Detect clarifying questions: short response ending with "?" or short with "?" anywhere.
      // When true, maintain the previous agent — the user is answering the clarification.
      const prevResponseWasQuestion =
        prevAiText.trim().endsWith('?') ||
        (prevAiText.length < 700 && prevAiText.includes('?'));

      const turn = prepareChatTurn(q, executiveState, {
        manualAgents: selectedAgents,
        autoRoute: autoRouteAgents,
        previousAgents,
        prevResponseWasQuestion,
        contextAgent,
      }, msgsRef.current.filter((m) => m.id !== aid && m.role === 'user').length);
      const routedAgents = turn.routedAgents;
      const intel = buildIntelligentResponse(q, executiveState);
      const meta = {
        agents: routedAgents.length ? routedAgents : agents,
      };

      if (USE_CLAUDE) {
        // Always attempt Claude directly — no health-check gate.
        // The /api/health gate caused silent fallback to offline mode whenever
        // Vercel cold-started or the health endpoint was slow. Now we try
        // streamClaudeChat directly and only fall back if it actually errors.
        try {
          abortRef.current?.abort();
          const ac = new AbortController();
          abortRef.current = ac;
          let streamed = '';
          // Use aid-1 (= uid) as beforeId so history contains only PREVIOUS turns.
          // The current user question is already sent as `message`; including it in
          // history too would produce consecutive user messages → Anthropic API glitch.
          const history = buildChatHistory(
            msgsRef.current as { id: number; role: string; text: string }[],
            aid - 1,
          );

          const animTask = runAgentAnimation(aid, meta.agents);

          await streamClaudeChat({
            message: turn.userMessage,
            language: ar ? 'ar' : 'en',
            history,
            context: turn.context,
            signal: ac.signal,
            onToken: (chunk) => {
              streamed += chunk;
              setMsgs((m) =>
                m.map((x) =>
                  x.id === aid && x.role === 'ai'
                    ? {
                        ...x,
                        text: streamed,
                        thinking: false,
                        agents: meta.agents,
                      }
                    : x,
                ),
              );
            },
          });

          await animTask;

          if (ac.signal.aborted) return null;

          if (!streamed.trim()) {
            throw new Error('Empty response from Claude');
          }

          // Skip grounding only for lightweight conversational turns
          const intent = detectChatIntent(q);
          const isConversational =
            intent === 'greeting' || intent === 'catchup' || intent === 'thanks' || intent === 'irrelevant';
          const grounded = isConversational
            ? { sources: [] as Source[], grounding: undefined as GroundingLevel | undefined }
            : resolveChatSources(q, streamed, executiveState, intel.sourceDocIds);
          const cleaned = stripAnswerSourceFooter(streamed);

          setMsgs((m) =>
            m.map((x) =>
              x.id === aid && x.role === 'ai'
                ? {
                    ...x,
                    text: cleaned,
                    agents: isConversational ? [] : meta.agents,
                    grounding: grounded.grounding,
                    sources: grounded.sources,
                    activeAgent: null,
                    thinking: false,
                  }
                : x,
            ),
          );
          return {
            text: cleaned,
            agents: isConversational ? [] : meta.agents,
            sources: grounded.sources,
            grounding: grounded.grounding,
          };
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          console.warn('[chat] Claude error:', errMsg);

          if (shouldFallbackToOfflineKb(errMsg)) {
            await runAgentAnimation(aid, meta.agents);
            const { text, grounding, sources, agents: demoAgents } = buildAiPayload(
              q,
              executiveState,
              meta.agents,
            );
            const notice = offlineNoticeKind(errMsg);
            setMsgs((m) =>
              m.map((x) =>
                x.id === aid && x.role === 'ai'
                  ? {
                      ...x,
                      text,
                      agents: demoAgents,
                      grounding,
                      sources,
                      offlineNotice: notice,
                      activeAgent: null,
                      thinking: false,
                    }
                  : x,
              ),
            );
            return { text, agents: demoAgents, sources, grounding, offlineNotice: notice };
          }

          const userErr = formatClaudeErrorForUser(errMsg, ar);
          setMsgs((m) =>
            m.map((x) =>
              x.id === aid && x.role === 'ai'
                ? { ...x, text: `⚠️ ${userErr}`, thinking: false, activeAgent: null, agents: meta.agents }
                : x,
            ),
          );
          return { text: userErr, agents: meta.agents, sources: [] };
        }
      }

      await runAgentAnimation(aid, meta.agents);
      const { text, grounding, sources, agents: demoAgents } = buildAiPayload(
        q,
        executiveState,
        meta.agents,
      );
      setMsgs((m) =>
        m.map((x) =>
          x.id === aid && x.role === 'ai'
            ? {
                ...x,
                text,
                agents: demoAgents,
                grounding,
                sources,
                activeAgent: null,
                thinking: false,
              }
            : x,
        ),
      );
      return { text, agents: demoAgents, sources, grounding };
    },
    [executiveState, runAgentAnimation, ar, selectedAgents, autoRouteAgents, contextAgent],
  );

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setMsgs((m) =>
      m.map((x) =>
        x.role === 'ai' && x.thinking
          ? { ...x, thinking: false, activeAgent: null, text: x.text || (ar ? 'تم إيقاف التوليد.' : 'Generation stopped.') }
          : x,
      ),
    );
    setBusy(false);
  }, [ar]);

  const send = useCallback(
    async (text: string) => {
      const q = (text || '').trim();
      if (!q || busy) return;
      setInput('');
      setBusy(true);
      let convId = activeConversationId;
      try {
        if (!convId) convId = createConversation(q.slice(0, 40));

        const uid = ++idRef.current;
        setMsgs((m) => [...m, { id: uid, role: 'user', text: q }]);

        const prevAiForSend = [...msgsRef.current].reverse().find((m) => m.role === 'ai');
        const prevAgentsForSend = (prevAiForSend?.role === 'ai' ? (prevAiForSend.agents ?? []) : []) as import('../../types').AgentType[];
        const prevAiTextForSend = prevAiForSend?.role === 'ai' ? (prevAiForSend.text ?? '') : '';
        const prevResponseWasQuestionForSend =
          prevAiTextForSend.trim().endsWith('?') ||
          (prevAiTextForSend.length < 700 && prevAiTextForSend.includes('?'));
        const turn = prepareChatTurn(q, executiveState, {
          manualAgents: selectedAgents,
          autoRoute: autoRouteAgents,
          previousAgents: prevAgentsForSend,
          prevResponseWasQuestion: prevResponseWasQuestionForSend,
          contextAgent,
        });
        const agents = turn.routedAgents;
        const aid = ++idRef.current;
        setMsgs((m) => [
          ...m,
          { id: aid, role: 'ai', agents, text: '', activeAgent: 0, thinking: true },
        ]);

        const result = await fillAiMessage(aid, q, agents);

        if (result?.text.trim()) {
          recordChatTurn(
            q,
            {
              content: result.text,
              agents: result.agents,
              sources: result.sources,
              grounding: result.grounding,
              offlineNotice: result.offlineNotice,
            },
            convId,
          );
        }
      } finally {
        setBusy(false);
        inputRef.current?.focus();
      }
    },
    [
      busy,
      activeConversationId,
      createConversation,
      recordChatTurn,
      fillAiMessage,
      executiveState,
      selectedAgents,
      autoRouteAgents,
    ],
  );

  const handleNewChat = useCallback(() => {
    if (busy) return;
    startNewChat();
    setMsgs([]);
    idRef.current = 0;
    setInput('');
  }, [busy, startNewChat]);

  const retryAiMessage = useCallback(
    async (aiId: number) => {
      if (busy) return;
      const idx = msgs.findIndex((m) => m.id === aiId);
      if (idx < 0) return;
      let userText = '';
      for (let i = idx - 1; i >= 0; i--) {
        if (msgs[i].role === 'user') {
          userText = msgs[i].text;
          break;
        }
      }
      if (!userText) return;

      setBusy(true);
      const turn = prepareChatTurn(userText, executiveState, {
        manualAgents: selectedAgents,
        autoRoute: autoRouteAgents,
        contextAgent,
      });
      setMsgs((m) =>
        m.map((x) =>
          x.id === aiId && x.role === 'ai'
            ? { ...x, text: '', thinking: true, activeAgent: 0, agents: turn.routedAgents, confidence: undefined, sources: undefined }
            : x,
        ),
      );
      const result = await fillAiMessage(aiId, userText, turn.routedAgents);
      setBusy(false);
      if (result?.text.trim() && activeConversationId) {
        patchAssistantReply(activeConversationId, result);
      }
    },
    [
      busy,
      msgs,
      fillAiMessage,
      executiveState,
      selectedAgents,
      autoRouteAgents,
      contextAgent,
      activeConversationId,
      patchAssistantReply,
    ],
  );

  const handleCopy = useCallback(
    (id: number, text: string) => {
      copyMessage(text);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 2000);
    },
    [copyMessage],
  );

  const openSourcesPanel = useCallback(
    (sources: Source[]) => {
      setActiveSources(sources);
      setSourcesPanelOpen(true);
    },
    [setActiveSources, setSourcesPanelOpen],
  );

  useEffect(() => {
    if (!activeConversationId) seedHandledRef.current = null;
  }, [activeConversationId]);

  useEffect(() => {
    const q = seed?.trim();
    if (!q || seedHandledRef.current === q) return;
    seedHandledRef.current = q;
    setSearchParams({}, { replace: true });
    void send(q);
  }, [seed, send, setSearchParams]);

  const empty = msgs.length === 0;
  const corePrompts = gst.suggestions.slice(0, 3);
  const corePromptIcons = ['presentation', 'mail', 'file-text'] as const;

  const historyTitle = activeConversation?.title ?? (ar ? 'محادثة جديدة' : 'New chat');

  return (
    <div className="cc-chat-page">
      <ChatHistorySheet ar={ar} open={historyOpen} onClose={() => setHistoryOpen(false)} />

      <header className="cc-chat-toolbar">
        <div className="cc-chat-toolbar__title-wrap">
          <span className="cc-chat-toolbar__label muted-3">{ar ? 'المحادثة' : 'Conversation'}</span>
          <span className="cc-chat-toolbar__title">{historyTitle}</span>
        </div>
        <div className="cc-chat-toolbar__actions">
          <button
            type="button"
            className="pill ghost cc-chat-toolbar__history-btn"
            onClick={() => setHistoryOpen(true)}
            aria-label={ar ? 'المحادثات السابقة' : 'Past conversations'}
          >
            <CcIcon name="history" size={16} />
            {ar ? 'السجل' : 'History'}
          </button>
          <button type="button" className="btn btn-primary cc-chat-toolbar__new" onClick={handleNewChat} disabled={busy}>
            <CcIcon name="plus" size={16} />
            {ar ? 'محادثة جديدة' : 'New chat'}
          </button>
        </div>
      </header>

      <div ref={scrollRef} className="content content--chat" style={{ padding: '8px 0', flex: 1, overflow: 'auto' }}>
        <div
          className={`cc-chat-inner${empty ? ' cc-chat-inner--centered' : ''}`}
          style={{ maxWidth: 860, margin: '0 auto', padding: '14px 24px 24px' }}
        >
          {empty ? (
            <div className="rise cc-chat-empty cc-chat-empty--centered">
              <header className="cc-chat-empty__hero">
                <Emblem size={36} />
                <h2 className="cc-chat-empty__title">
                  {ar ? `اسأل ${PRODUCT_AGENT_NAME_AR}` : `Ask ${PRODUCT_AGENT_NAME}`}
                </h2>
                <p className="cc-chat-empty__subtitle">
                  {ar
                    ? 'مساعدك الشخصي للاتصالات التنفيذية والإحاطات والمستندات — بالعربية أو الإنجليزية.'
                    : 'Your personal AI assistant for executive comms, briefings and documents — in English or Arabic.'}
                </p>
              </header>

              <div className="cc-chat-empty__context">
                <AgentContextChips
                  value={contextAgent}
                  onChange={setContextAgent}
                  ar={ar}
                  variant="light"
                />
              </div>

              <div className="cc-chat-empty__prompts" data-tour="chat-suggestions">
                <div className="cc-chat-empty__section-label">{ar ? 'إجراءات سريعة' : 'Quick actions'}</div>
                <div className="cc-chat-prompt-list">
                  {corePrompts.map((s, i) => (
                    <button
                      key={s.q}
                      type="button"
                      className="cc-chat-prompt-row"
                      onClick={() => send(s.q)}
                    >
                      <span className={`cc-chat-prompt-row__icon cc-chat-prompt-row__icon--${i + 1}`} aria-hidden>
                        <CcIcon name={corePromptIcons[i] ?? 'sparkles'} size={18} />
                      </span>
                      <span className="cc-chat-prompt-row__text">{s.q}</span>
                      <CcIcon name="chevron-right" size={18} className="cc-chat-prompt-row__arrow" aria-hidden />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid mi-stagger" style={{ gap: 22 }}>
              {msgs.map((m, idx) => {
                const userQuery =
                  m.role === 'ai'
                    ? [...msgs.slice(0, idx)].reverse().find((x) => x.role === 'user')?.text ?? ''
                    : '';
                return m.role === 'user' ? (
                  <div key={m.id} className="mi-user-bubble" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <div
                      style={{
                        background: 'var(--petrol-700)',
                        color: '#fff',
                        padding: '12px 17px',
                        borderRadius: '16px 16px 4px 16px',
                        maxWidth: '78%',
                        fontSize: 15,
                        lineHeight: 1.45,
                      }}
                    >
                      {m.text}
                    </div>
                  </div>
                ) : (
                  <CcChatAiMessage
                    key={m.id}
                    message={m}
                    userQuery={userQuery}
                    ar={ar}
                    busy={busy}
                    copied={copiedId === m.id}
                    onCopy={() => handleCopy(m.id, m.text)}
                    onRetry={() => retryAiMessage(m.id)}
                    onOpenSources={openSourcesPanel}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      <footer className="chat-composer">
        <div className="chat-composer__inner chat-composer__row">
          <div className="chat-composer__input-wrap" data-tour="chat-input">
            <button type="button" className="chat-composer__attach" aria-label={ar ? 'إرفاق ملف' : 'Attach file'} title={ar ? 'أرفق مستنداً أو بريداً' : 'Attach a document or email'}>
              <CcIcon name="paperclip" size={18} />
            </button>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (!busy) send(input);
                }
              }}
              placeholder={ar ? 'الصق بريداً، ارفع مستنداً، أو اكتب طلبك…' : 'Paste an email, drop a document, or type your request…'}
              disabled={false}
              autoFocus
              aria-busy={busy}
            />
            {busy ? (
              <button
                type="button"
                className="btn btn-ghost chat-composer__stop"
                onClick={stopGeneration}
                aria-label={ar ? 'إيقاف التوليد' : 'Stop generating'}
                title={ar ? 'إيقاف' : 'Stop'}
              >
                <CcIcon name="square" size={16} />
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                style={{ height: 38, width: 44, padding: 0 }}
                onClick={() => send(input)}
                disabled={!input.trim()}
              >
                <CcIcon name="arrow-up" size={18} />
              </button>
            )}
          </div>
        </div>
        <p className="chat-composer__note">
          {ar
            ? 'الردود جاهزة للنسخ — الصق في البريد أو الواتساب أو العروض.'
            : 'Responses are copy-paste ready — use in email, WhatsApp, or presentations.'}
        </p>
      </footer>
    </div>
  );
}
