// @ts-nocheck
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CcIcon } from '../../command-centre/CcIcon';
import { Emblem } from '../../command-centre/CcPrimitives';
import { CcChatAiMessage } from '../../command-centre/CcChatAiMessage';
import { AGENTS, CANNED } from '../../data/commandCentreData';
import { useGstLive } from '../../utils/gstGreeting';
import { useApp } from '../../context/AppContext';
import { buildIntelligentResponse, resolveAnswerGrounding } from '../../data/executiveStore';
import { prepareChatTurn } from '../../api/prepareChatTurn';
import { buildChatHistory } from '../../api/buildChatContext';
import { checkClaudeAvailable, streamClaudeChat } from '../../api/claudeChat';
import { detectChatIntent } from '../../utils/chatIntent';
import { PRODUCT_AGENT_NAME, PRODUCT_AGENT_NAME_AR } from '../../config/user';
import { IntelCard, IntelCardBody } from '../../command-centre/CcCard';
import { ChatHistorySheet } from '../../components/chat/ChatHistorySheet';
import {
  conversationToUiMessages,
  hydrateAssistantMessage,
  nextUiMessageId,
} from '../../utils/chatMessages';
import type { GroundingLevel, Source } from '../../types';

const USE_CLAUDE = import.meta.env.VITE_USE_CLAUDE_API !== 'false';

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
    };

function buildAiPayload(
  q: string,
  executiveState: import('../../data/executiveStore').ExecutiveState,
  routedAgents: string[],
) {
  const intel = buildIntelligentResponse(q, executiveState);
  const canned = CANNED[q as keyof typeof CANNED];
  const text = canned ?? intel.content;
  const resolved = resolveAnswerGrounding(text, executiveState, intel.sourceDocIds);
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
  const [claudeLive, setClaudeLive] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const msgsRef = useRef(msgs);
  const idRef = useRef(0);
  const seedHandledRef = useRef<string | null>(null);
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
      const { sources } = hydrateAssistantMessage(lastAi, executiveState);
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
    if (!USE_CLAUDE) return;
    checkClaudeAvailable().then(setClaudeLive);
  }, []);

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
    } | null> => {
      const turn = prepareChatTurn(q, executiveState, {
        manualAgents: selectedAgents,
        autoRoute: autoRouteAgents,
      }, msgsRef.current.filter((m) => m.id !== aid && m.role === 'user').length);
      const routedAgents = turn.routedAgents;
      const intel = buildIntelligentResponse(q, executiveState);
      const meta = {
        agents: routedAgents.length ? routedAgents : agents,
      };

      if (USE_CLAUDE) {
        const live = claudeLive || (await checkClaudeAvailable());
        if (live) {
          setClaudeLive(true);
          try {
          const anim = runAgentAnimation(aid, meta.agents);
          let streamed = '';
          const history = buildChatHistory(
            msgsRef.current.filter((m) => m.id !== aid) as { id: number; role: string; text: string }[],
            aid,
          );

          await Promise.all([
            anim,
            streamClaudeChat({
              message: turn.userMessage,
              language: ar ? 'ar' : 'en',
              history,
              context: turn.context,
              onToken: (chunk) => {
                streamed += chunk;
                setMsgs((m) =>
                  m.map((x) =>
                    x.id === aid && x.role === 'ai'
                      ? {
                          ...x,
                          text: streamed,
                          thinking: false,
                          activeAgent: null,
                          agents: meta.agents,
                        }
                      : x,
                  ),
                );
              },
            }),
          ]);

          if (!streamed.trim()) {
            throw new Error('Empty response from Claude');
          }

          // Skip sources/grounding for: conversational turns, Explorer AI (general knowledge / web search)
          const intent = detectChatIntent(q);
          const isConversational = intent === 'greeting' || intent === 'thanks' || intent === 'irrelevant';
          const isExplorer = meta.agents.includes('explorer');
          const grounded = (isConversational || isExplorer)
            ? { sources: [] as Source[], grounding: undefined as GroundingLevel | undefined }
            : resolveAnswerGrounding(streamed, executiveState, intel.sourceDocIds);

          setMsgs((m) =>
            m.map((x) =>
              x.id === aid && x.role === 'ai'
                ? {
                    ...x,
                    text: streamed,
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
            text: streamed,
            agents: isConversational ? [] : meta.agents,
            sources: grounded.sources,
            grounding: grounded.grounding,
          };
          } catch (err) {
            console.warn('[chat] Claude failed, using institutional fallback', err);
          }
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
    [executiveState, runAgentAnimation, ar, claudeLive, selectedAgents, autoRouteAgents],
  );

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

        const turn = prepareChatTurn(q, executiveState, {
          manualAgents: selectedAgents,
          autoRoute: autoRouteAgents,
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
            <CcIcon name="plus" size={15} />
            {ar ? 'محادثة جديدة' : 'New chat'}
          </button>
        </div>
      </header>

      <div ref={scrollRef} className="content content--chat" style={{ padding: '8px 0', flex: 1, overflow: 'auto' }}>
        <div className="cc-chat-inner" style={{ maxWidth: 860, margin: '0 auto', padding: '14px 24px 24px' }}>
          {empty ? (
            <div className="rise" style={{ paddingTop: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
                <Emblem size={40} />
                <div>
                  <h2 style={{ fontSize: 24 }}>
                    {ar ? `اسأل ${PRODUCT_AGENT_NAME_AR}` : `Ask ${PRODUCT_AGENT_NAME}`}
                  </h2>
                  <div className="muted" style={{ fontSize: 14 }}>
                    {ar
                      ? 'خمسة وكلاء متخصصين ينسّقون عبر LangGraph — بالعربية والإنجليزية.'
                      : 'Five specialised agents, orchestrated by LangGraph — in English or Arabic.'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '18px 0 26px' }}>
                {AGENTS.map((a) => (
                  <div key={a.id} className="pill ghost" style={{ height: 30 }}>
                    <CcIcon name={a.icon} size={13} style={{ color: a.color }} />
                    {a.name.replace(' AI', '')}
                  </div>
                ))}
              </div>
              <div className="eyebrow" style={{ marginBottom: 12 }}>
                {ar ? 'جرّب أحد هذه' : 'Try one of these'}
              </div>
              <div className="grid mi-stagger" style={{ gap: 10 }} data-tour="chat-suggestions">
                {gst.suggestions.map((s) => (
                  <IntelCard key={s.q} interactive onClick={() => send(s.q)}>
                    <IntelCardBody style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                      <CcIcon name="sparkles" size={18} style={{ color: 'var(--accent-bright)', flex: 'none' }} />
                      <span className="cc-chat-suggest-text">{s.q}</span>
                      <CcIcon name={ar ? 'arrow-left' : 'arrow-right'} size={16} className="muted-3" />
                    </IntelCardBody>
                  </IntelCard>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid mi-stagger" style={{ gap: 22 }}>
              {msgs.map((m) =>
                m.role === 'user' ? (
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
                    ar={ar}
                    busy={busy}
                    copied={copiedId === m.id}
                    onCopy={() => handleCopy(m.id, m.text)}
                    onRetry={() => retryAiMessage(m.id)}
                    onOpenSources={openSourcesPanel}
                  />
                ),
              )}
            </div>
          )}
        </div>
      </div>

      <footer className="chat-composer">
        <div className="chat-composer__inner chat-composer__row">
          <div className="chat-composer__input-wrap" data-tour="chat-input">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder={ar ? 'اكتب سؤالك التنفيذي…' : 'Type an executive question…'}
              disabled={busy}
              autoFocus
              aria-busy={busy}
            />
            <button
              type="button"
              className="btn btn-primary"
              style={{ height: 38, width: 44, padding: 0 }}
              onClick={() => send(input)}
              disabled={busy || !input.trim()}
            >
              <CcIcon name={busy ? 'loader' : 'arrow-up'} size={18} className={busy ? 'spin' : ''} />
            </button>
          </div>
        </div>
        <p className="chat-composer__note">
          {claudeLive
            ? ar
              ? 'مدعوم بـ Claude Sonnet 4.6 — إجابات حية من بيانات الإنتاج.'
              : 'Powered by Claude Sonnet 4.6 — live answers from production data.'
            : ar
              ? 'ذكاء مؤسسي — قاعدة المعرفة والتقويم وسجل الإجراءات.'
              : 'Institutional intelligence — knowledge base, calendar, and action register.'}
        </p>
      </footer>
    </div>
  );
}
