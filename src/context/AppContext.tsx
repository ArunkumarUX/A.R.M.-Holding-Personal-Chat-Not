import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  loadExecutiveState,
  saveExecutiveState,
  buildIntelligentResponse,
  deriveMorningSignals,
  getSourcesForQuery,
  bumpQueryMetrics,
  completeAction,
  DEMO_PROMPTS,
  type ExecutiveState,
} from '../data/executiveStore';
import { FOCUS_AREA_MAP, resolveFocusAreaForQuery } from '../data/focusAreas';
import { EXECUTIVE_USER } from '../config/user';
import { guessKbCategory } from '../command-centre/kbCorpus';
import { buildChatContext, buildChatHistoryFromMessages } from '../api/buildChatContext';
import { checkClaudeAvailable, streamClaudeChat } from '../api/claudeChat';

const USE_CLAUDE = import.meta.env.VITE_USE_CLAUDE_API !== 'false';
import type {
  AgentType,
  ChatMessage,
  Conversation,
  DocumentFile,
  MorningSignal,
  Settings,
  Source,
  Toast,
  Workflow,
} from '../types';

interface AppContextValue {
  conversations: Conversation[];
  activeConversationId: string | null;
  activeConversation: Conversation | null;
  documents: DocumentFile[];
  settings: Settings;
  toasts: Toast[];
  sourcesPanelOpen: boolean;
  activeSources: Source[];
  isStreaming: boolean;
  mobileDrawerOpen: boolean;
  searchQuery: string;
  categoryFilter: string;
  setSearchQuery: (q: string) => void;
  setCategoryFilter: (c: string) => void;
  setMobileDrawerOpen: (o: boolean) => void;
  setSourcesPanelOpen: (o: boolean) => void;
  setActiveSources: (s: Source[]) => void;
  showToast: (message: string, type?: Toast['type']) => void;
  dismissToast: (id: string) => void;
  createConversation: (title?: string, category?: string) => string;
  selectConversation: (id: string) => void;
  sendMessage: (content: string) => void;
  recordChatTurn: (
    userContent: string,
    assistant: {
      content: string;
      agents?: AgentType[];
      confidence?: number;
      sources?: Source[];
      followUps?: string[];
    },
    conversationId?: string | null,
  ) => void;
  stopStreaming: () => void;
  regenerateLast: () => void;
  setInputDraft: (text: string) => void;
  inputDraft: string;
  renameConversation: (id: string, title: string) => void;
  pinConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  exportConversation: (id: string) => void;
  rateMessage: (convId: string, msgId: string, liked: boolean) => void;
  copyMessage: (content: string) => void;
  updateSettings: (partial: Partial<Settings>) => void;
  saveSettings: () => void;
  uploadDocument: (
    name: string,
    options?: { knowledgeBase?: boolean; category?: string; documentDate?: string },
  ) => string;
  removeDocument: (id: string) => void;
  removeKnowledgeBaseDocument: (id: string) => void;
  activeWorkflow: Workflow | null;
  workflowStep: number;
  workflowAnswers: Record<string, string>;
  startWorkflow: (workflow: Workflow) => void;
  setWorkflowAnswer: (stepId: string, value: string) => void;
  nextWorkflowStep: () => void;
  prevWorkflowStep: () => void;
  completeWorkflow: () => void;
  cancelWorkflow: () => void;
  executiveState: ExecutiveState;
  morningSignals: MorningSignal[];
  suggestedPrompts: string[];
  completeActionItem: (actionId: string) => void;
  selectedAgents: AgentType[];
  autoRouteAgents: boolean;
  toggleAgent: (id: AgentType) => void;
  setAutoRouteAgents: (on: boolean) => void;
  recordBriefingGenerated: () => void;
}

const defaultSettings: Settings = {
  name: EXECUTIVE_USER.fullName,
  email: EXECUTIVE_USER.email,
  title: `${EXECUTIVE_USER.title}, ${EXECUTIVE_USER.organisation}`,
  language: 'en',
  responseStyle: 'detailed',
  retainHistory: true,
  shareForImprovement: false,
  emailNotifications: true,
  pushNotifications: false,
  theme: 'light',
};

const AppContext = createContext<AppContextValue | null>(null);

let toastCounter = 0;
let msgCounter = 100;

export function AppProvider({ children }: { children: ReactNode }) {
  const [executiveState, setExecutiveState] = useState(loadExecutiveState);
  const conversations = executiveState.conversations;
  const documents = executiveState.documents;

  const persistExecutive = useCallback((updater: (s: ExecutiveState) => ExecutiveState) => {
    setExecutiveState((prev) => {
      const next = updater(prev);
      saveExecutiveState(next);
      return next;
    });
  }, []);

  const morningSignals = useMemo(
    () => deriveMorningSignals(executiveState),
    [executiveState],
  );

  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    () => executiveState.conversations[0]?.id ?? null,
  );
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [sourcesPanelOpen, setSourcesPanelOpen] = useState(false);
  const [activeSources, setActiveSources] = useState<Source[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [inputDraft, setInputDraft] = useState('');
  const [activeWorkflow, setActiveWorkflow] = useState<Workflow | null>(null);
  const [workflowStep, setWorkflowStep] = useState(0);
  const [workflowAnswers, setWorkflowAnswers] = useState<Record<string, string>>({});
  const [selectedAgents, setSelectedAgents] = useState<AgentType[]>(['cos', 'strategy', 'policy']);
  const [autoRouteAgents, setAutoRouteAgents] = useState(true);
  const streamingRef = { cancelled: false };

  const toggleAgent = useCallback((id: AgentType) => {
    setAutoRouteAgents(false);
    setSelectedAgents((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
    );
  }, []);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId) ?? null,
    [conversations, activeConversationId],
  );

  const showToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = `toast-${++toastCounter}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const createConversation = useCallback(
    (title = 'New conversation', category = 'General') => {
      const id = `c-${Date.now()}`;
      const conv: Conversation = {
        id,
        title,
        category,
        updatedAt: new Date().toISOString(),
        pinned: false,
        preview: '',
        messages: [],
      };
      persistExecutive((s) => ({ ...s, conversations: [conv, ...s.conversations] }));
      setActiveConversationId(id);
      return id;
    },
    [persistExecutive],
  );

  const selectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
    setMobileDrawerOpen(false);
  }, []);

  const appendAssistantFromIntel = useCallback(
    (convId: string, content: string, state: ExecutiveState) => {
      const intel = buildIntelligentResponse(content, state);
      const sources = getSourcesForQuery(state, intel.sourceDocIds);
      setActiveSources(sources);
      const msg: ChatMessage = {
        id: `m-${++msgCounter}`,
        role: 'assistant',
        content: intel.content,
        timestamp: new Date().toISOString(),
        agents: intel.agents,
        confidence: intel.confidence,
        sources,
        followUps: intel.followUps,
      };
      persistExecutive((current) => ({
        ...current,
        conversations: current.conversations.map((c) =>
          c.id === convId
            ? {
                ...c,
                messages: [...c.messages, msg],
                preview: intel.content.slice(0, 80),
                updatedAt: new Date().toISOString(),
              }
            : c,
        ),
      }));
    },
    [persistExecutive],
  );

  const recordChatTurn = useCallback(
    (
      userContent: string,
      assistant: {
        content: string;
        agents?: AgentType[];
        confidence?: number;
        sources?: Source[];
        followUps?: string[];
      },
      conversationId?: string | null,
    ) => {
      const trimmed = userContent.trim();
      if (!trimmed || !assistant.content.trim()) return;
      let convId = conversationId ?? activeConversationId;
      const focusId = resolveFocusAreaForQuery(trimmed);
      const focusCategory = focusId ? FOCUS_AREA_MAP[focusId].shortTitle : undefined;
      if (!convId) {
        convId = createConversation(trimmed.slice(0, 48), focusCategory ?? 'General');
      }
      const userMsg: ChatMessage = {
        id: `m-${++msgCounter}`,
        role: 'user',
        content: trimmed,
        timestamp: new Date().toISOString(),
      };
      const aiMsg: ChatMessage = {
        id: `m-${++msgCounter}`,
        role: 'assistant',
        content: assistant.content.trim(),
        timestamp: new Date().toISOString(),
        agents: assistant.agents,
        confidence: assistant.confidence,
        sources: assistant.sources,
        followUps: assistant.followUps,
      };
      if (assistant.sources?.length) setActiveSources(assistant.sources);
      persistExecutive((s) => {
        const bumped = bumpQueryMetrics(s);
        return {
          ...bumped,
          conversations: bumped.conversations.map((c) =>
            c.id === convId
              ? {
                  ...c,
                  title: c.messages.length === 0 ? trimmed.slice(0, 48) : c.title,
                  category:
                    focusCategory && (c.category === 'General' || c.messages.length === 0)
                      ? focusCategory
                      : c.category,
                  preview: assistant.content.slice(0, 80),
                  updatedAt: new Date().toISOString(),
                  messages: [...c.messages, userMsg, aiMsg],
                }
              : c,
          ),
        };
      });
    },
    [activeConversationId, createConversation, persistExecutive],
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming) return;
      let convId = activeConversationId;
      const focusId = resolveFocusAreaForQuery(content);
      const focusCategory = focusId ? FOCUS_AREA_MAP[focusId].shortTitle : undefined;

      if (!convId) {
        convId = createConversation(content.slice(0, 48), focusCategory ?? 'General');
      }
      const userMsg: ChatMessage = {
        id: `m-${++msgCounter}`,
        role: 'user',
        content: content.trim(),
        timestamp: new Date().toISOString(),
      };
      persistExecutive((s) => {
        const bumped = bumpQueryMetrics(s);
        return {
          ...bumped,
          conversations: bumped.conversations.map((c) =>
            c.id === convId
              ? {
                  ...c,
                  title: c.messages.length === 0 ? content.slice(0, 48) : c.title,
                  category:
                    focusCategory && (c.category === 'General' || c.messages.length === 0)
                      ? focusCategory
                      : c.category,
                  preview: content.slice(0, 80),
                  updatedAt: new Date().toISOString(),
                  messages: [...c.messages, userMsg],
                }
              : c,
          ),
        };
      });
      setInputDraft('');
      setIsStreaming(true);
      streamingRef.cancelled = false;

      const conv = conversations.find((c) => c.id === convId);
      const history = buildChatHistoryFromMessages(conv?.messages ?? []);
      const lang = settings.language === 'ar' ? 'ar' : 'en';

      if (USE_CLAUDE) {
        try {
          const live = await checkClaudeAvailable();
          if (live && !streamingRef.cancelled) {
            let streamed = '';
            const placeholderId = `m-${++msgCounter}`;
            persistExecutive((s) => ({
              ...s,
              conversations: s.conversations.map((c) =>
                c.id === convId
                  ? {
                      ...c,
                      messages: [
                        ...c.messages,
                        {
                          id: placeholderId,
                          role: 'assistant',
                          content: '',
                          timestamp: new Date().toISOString(),
                        },
                      ],
                      updatedAt: new Date().toISOString(),
                    }
                  : c,
              ),
            }));

            await streamClaudeChat({
              message: content.trim(),
              language: lang,
              history,
              context: buildChatContext(executiveState),
              onToken: (chunk) => {
                if (streamingRef.cancelled) return;
                streamed += chunk;
                persistExecutive((s) => ({
                  ...s,
                  conversations: s.conversations.map((c) =>
                    c.id === convId
                      ? {
                          ...c,
                          messages: c.messages.map((m) =>
                            m.id === placeholderId ? { ...m, content: streamed } : m,
                          ),
                          preview: streamed.slice(0, 80),
                        }
                      : c,
                  ),
                }));
              },
            });

            if (!streamingRef.cancelled && streamed.trim()) {
              const intel = buildIntelligentResponse(content, executiveState);
              const sources = getSourcesForQuery(executiveState, intel.sourceDocIds);
              setActiveSources(sources);
              persistExecutive((s) => ({
                ...s,
                conversations: s.conversations.map((c) =>
                  c.id === convId
                    ? {
                        ...c,
                        messages: c.messages.map((m) =>
                          m.id === placeholderId
                            ? {
                                ...m,
                                content: streamed,
                                agents: intel.agents,
                                confidence: intel.confidence,
                                sources,
                                followUps: intel.followUps,
                              }
                            : m,
                        ),
                      }
                    : c,
                ),
              }));
              setIsStreaming(false);
              return;
            }
          }
        } catch (err) {
          console.warn('[chat] Claude failed, using demo response', err);
          persistExecutive((s) => ({
            ...s,
            conversations: s.conversations.map((c) =>
              c.id === convId
                ? { ...c, messages: c.messages.filter((m) => m.role !== 'assistant' || m.content) }
                : c,
            ),
          }));
        }
      }

      if (streamingRef.cancelled) {
        setIsStreaming(false);
        return;
      }
      appendAssistantFromIntel(convId, content, executiveState);
      setIsStreaming(false);
    },
    [
      activeConversationId,
      appendAssistantFromIntel,
      conversations,
      createConversation,
      executiveState,
      isStreaming,
      persistExecutive,
      settings.language,
    ],
  );

  const stopStreaming = useCallback(() => {
    streamingRef.cancelled = true;
    setIsStreaming(false);
    showToast('Response stopped', 'info');
  }, [showToast]);

  const regenerateLast = useCallback(() => {
    if (!activeConversationId) return;
    const conv = conversations.find((c) => c.id === activeConversationId);
    const lastUser = [...(conv?.messages ?? [])].reverse().find((m) => m.role === 'user');
    if (!lastUser) return;
    setIsStreaming(true);
    setTimeout(() => {
      const intel = buildIntelligentResponse(lastUser.content, executiveState);
      const sources = getSourcesForQuery(executiveState, intel.sourceDocIds);
      persistExecutive((s) => ({
        ...s,
        conversations: s.conversations.map((c) => {
          if (c.id !== activeConversationId) return c;
          const msgs = [...c.messages];
          const lastIdx = msgs.map((m) => m.role).lastIndexOf('assistant');
          if (lastIdx >= 0) {
            msgs[lastIdx] = {
              ...msgs[lastIdx],
              content: intel.content + '\n\n*Regenerated from live store*',
              timestamp: new Date().toISOString(),
              agents: intel.agents,
              confidence: intel.confidence,
              sources,
              followUps: intel.followUps,
            };
          }
          return { ...c, messages: msgs };
        }),
      }));
      setActiveSources(sources);
      setIsStreaming(false);
      showToast('Answer regenerated from live data');
    }, 1200);
  }, [activeConversationId, conversations, executiveState, persistExecutive, showToast]);

  const renameConversation = useCallback(
    (id: string, title: string) => {
      persistExecutive((s) => ({
        ...s,
        conversations: s.conversations.map((c) => (c.id === id ? { ...c, title } : c)),
      }));
      showToast('Conversation renamed');
    },
    [persistExecutive, showToast],
  );

  const pinConversation = useCallback(
    (id: string) => {
      persistExecutive((s) => ({
        ...s,
        conversations: s.conversations.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c)),
      }));
      showToast('Pin updated');
    },
    [persistExecutive, showToast],
  );

  const deleteConversation = useCallback(
    (id: string) => {
      persistExecutive((s) => ({
        ...s,
        conversations: s.conversations.filter((c) => c.id !== id),
      }));
      if (activeConversationId === id) {
        setActiveConversationId(null);
      }
      showToast('Conversation deleted', 'info');
    },
    [activeConversationId, persistExecutive, showToast],
  );

  const completeActionItem = useCallback(
    (actionId: string) => {
      persistExecutive((s) => completeAction(s, actionId));
      showToast('Action marked complete');
    },
    [persistExecutive, showToast],
  );

  const exportConversation = useCallback(
    (id: string) => {
      const conv = conversations.find((c) => c.id === id);
      if (!conv) return;
      const text = conv.messages
        .map((m) => `[${m.role.toUpperCase()}] ${m.content}`)
        .join('\n\n---\n\n');
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${conv.title.replace(/\s+/g, '_')}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Conversation exported');
    },
    [conversations, showToast],
  );

  const rateMessage = useCallback(
    (convId: string, msgId: string, liked: boolean) => {
      persistExecutive((s) => ({
        ...s,
        conversations: s.conversations.map((c) =>
          c.id === convId
            ? {
                ...c,
                messages: c.messages.map((m) => (m.id === msgId ? { ...m, liked } : m)),
              }
            : c,
        ),
      }));
      showToast('Feedback recorded — thank you');
    },
    [persistExecutive, showToast],
  );

  const copyMessage = useCallback(
    (content: string) => {
      navigator.clipboard.writeText(content);
      showToast('Copied to clipboard');
    },
    [showToast],
  );

  const updateSettings = useCallback((partial: Partial<Settings>) => {
    setSettings((s) => ({ ...s, ...partial }));
  }, []);

  const saveSettings = useCallback(() => {
    showToast('Settings saved successfully');
  }, [showToast]);

  const uploadDocument = useCallback(
    (
      name: string,
      options?: { knowledgeBase?: boolean; category?: string; documentDate?: string },
    ): string => {
      const forKb = options?.knowledgeBase ?? false;
      const ext = name.split('.').pop()?.toLowerCase() ?? '';
      const type =
        ext === 'pdf' ? 'PDF' : ext === 'xlsx' || ext === 'xls' ? 'XLSX' : 'DOCX';
      const kbCategory = forKb
        ? options?.category ?? guessKbCategory(name)
        : undefined;
      const kbDocumentDate =
        options?.documentDate ?? new Date().toISOString().slice(0, 10);

      const doc: DocumentFile = {
        id: `d-${Date.now()}`,
        name,
        type,
        size: `${(1 + Math.random() * 3).toFixed(1)} MB`,
        uploadedAt: new Date().toISOString().slice(0, 10),
        status: forKb ? 'uploading' : 'processing',
        inKnowledgeBase: forKb,
        kbCategory,
        kbDocumentDate: forKb ? kbDocumentDate : undefined,
        focusAreaIds: forKb ? ['knowledge'] : undefined,
      };

      persistExecutive((s) => ({
        ...s,
        documents: [doc, ...s.documents],
        metrics: {
          ...s.metrics,
          documentsInKb: forKb ? s.metrics.documentsInKb + 1 : s.metrics.documentsInKb,
        },
      }));

      if (forKb) {
        showToast('Uploading document…', 'info');
        setTimeout(() => {
          persistExecutive((s) => ({
            ...s,
            documents: s.documents.map((d) =>
              d.id === doc.id ? { ...d, status: 'processing' as const } : d,
            ),
          }));
          showToast('Processing — indexing for knowledge base', 'info');
        }, 900);

        setTimeout(() => {
          persistExecutive((s) => ({
            ...s,
            documents: s.documents.map((d) =>
              d.id === doc.id
                ? {
                    ...d,
                    status: 'ready' as const,
                    summary:
                      'Ready in knowledge base · RAG indexing and source citations enabled.',
                    keyInsights: [
                      `Tagged under ${kbCategory ?? 'general'}`,
                      'Available to Chat and knowledge search with citations',
                    ],
                    clauses: [
                      {
                        title: 'Indexed excerpt',
                        text: 'Document chunked and embedded — query via Chat with source citations.',
                      },
                    ],
                  }
                : d,
            ),
          }));
          showToast('Document ready in knowledge base');
        }, 3800);
        return doc.id;
      }

      showToast('Document uploaded — processing', 'info');
      setTimeout(() => {
        persistExecutive((s) => ({
          ...s,
          documents: s.documents.map((d) =>
            d.id === doc.id
              ? {
                  ...d,
                  status: 'ready' as const,
                  summary:
                    'Ingested into knowledge base · RAG + Knowledge Graph indexing complete (demo: 15 min SLA).',
                  keyInsights: [
                    'Cross-linked with FSRA Virtual Assets Framework',
                    'Available to Policy and Strategy agents immediately',
                  ],
                  clauses: [
                    {
                      title: 'Indexed excerpt',
                      text: 'Document chunked and embedded — query via Chat with source citations.',
                    },
                  ],
                }
              : d,
          ),
        }));
        showToast('Document indexed in knowledge base');
      }, 2800);
      return doc.id;
    },
    [persistExecutive, showToast],
  );

  const removeDocument = useCallback(
    (id: string) => {
      persistExecutive((s) => {
        const removed = s.documents.find((d) => d.id === id);
        const wasKb = removed?.inKnowledgeBase || removed?.focusAreaIds?.includes('knowledge');
        return {
          ...s,
          documents: s.documents.filter((d) => d.id !== id),
          metrics: {
            ...s.metrics,
            documentsInKb: wasKb
              ? Math.max(0, s.metrics.documentsInKb - 1)
              : s.metrics.documentsInKb,
          },
        };
      });
      showToast('Document removed', 'info');
    },
    [persistExecutive, showToast],
  );

  const removeKnowledgeBaseDocument = useCallback(
    (id: string) => {
      removeDocument(id);
    },
    [removeDocument],
  );

  const startWorkflow = useCallback((workflow: Workflow) => {
    setActiveWorkflow(workflow);
    setWorkflowStep(0);
    setWorkflowAnswers({});
  }, []);

  const setWorkflowAnswer = useCallback((stepId: string, value: string) => {
    setWorkflowAnswers((prev) => ({ ...prev, [stepId]: value }));
  }, []);

  const nextWorkflowStep = useCallback(() => {
    setWorkflowStep((s) => s + 1);
  }, []);

  const prevWorkflowStep = useCallback(() => {
    setWorkflowStep((s) => Math.max(0, s - 1));
  }, []);

  const completeWorkflow = useCallback(() => {
    persistExecutive((s) => ({
      ...s,
      metrics: { ...s.metrics, briefingsGenerated: s.metrics.briefingsGenerated + 1 },
    }));
    showToast('Workflow complete — briefing added to library');
    setActiveWorkflow(null);
    setWorkflowStep(0);
  }, [persistExecutive, showToast]);

  const cancelWorkflow = useCallback(() => {
    setActiveWorkflow(null);
    setWorkflowStep(0);
    showToast('Workflow cancelled', 'info');
  }, [showToast]);

  const recordBriefingGenerated = useCallback(() => {
    persistExecutive((s) => ({
      ...s,
      metrics: { ...s.metrics, briefingsGenerated: s.metrics.briefingsGenerated + 1 },
    }));
  }, [persistExecutive]);

  const value: AppContextValue = {
    conversations,
    activeConversationId,
    activeConversation,
    documents,
    settings,
    toasts,
    sourcesPanelOpen,
    activeSources,
    isStreaming,
    mobileDrawerOpen,
    searchQuery,
    categoryFilter,
    setSearchQuery,
    setCategoryFilter,
    setMobileDrawerOpen,
    setSourcesPanelOpen,
    setActiveSources,
    showToast,
    dismissToast,
    createConversation,
    selectConversation,
    sendMessage,
    recordChatTurn,
    stopStreaming,
    regenerateLast,
    setInputDraft,
    inputDraft,
    renameConversation,
    pinConversation,
    deleteConversation,
    exportConversation,
    rateMessage,
    copyMessage,
    updateSettings,
    saveSettings,
    uploadDocument,
    removeDocument,
    removeKnowledgeBaseDocument,
    activeWorkflow,
    workflowStep,
    workflowAnswers,
    startWorkflow,
    setWorkflowAnswer,
    nextWorkflowStep,
    prevWorkflowStep,
    completeWorkflow,
    cancelWorkflow,
    executiveState,
    morningSignals,
    suggestedPrompts: DEMO_PROMPTS,
    completeActionItem,
    selectedAgents,
    autoRouteAgents,
    toggleAgent,
    setAutoRouteAgents,
    recordBriefingGenerated,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
