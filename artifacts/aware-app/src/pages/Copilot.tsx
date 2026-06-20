import React from "react";
import {
  Bot, Settings, Plus, Square, Loader2, Search, Download, Keyboard,
  BarChart3, Sliders, MessageSquare,
} from "lucide-react";
import { TOOLS } from "@/lib/copilot/tools";
import { runAgent } from "@/lib/copilot/agent";
import { createProvider, WebLLMProvider } from "@/lib/copilot/providers";
import {
  loadThreads, saveThreads, loadSession, clearSession,
  loadProviderType, saveProviderType, loadOpenAIConfig, saveOpenAIConfig,
  createThread, updateThreadInList,
  getActiveThreadId, setActiveThreadId,
  loadCopilotSettings, saveCopilotSettings,
  loadBookmarks,
} from "@/lib/copilot/storage";
import type {
  Message, ProviderType, ProviderStatus, AgentEvent, SubAgentStep,
  Thread, Attachment, Bookmark, CopilotSettings, ToneOption,
} from "@/lib/copilot/types";
import {
  conversationReducer,
  INITIAL_CONVERSATION_STATE,
} from "@/lib/copilot/copilotReducer";
import MessageFeed from "@/components/copilot/MessageFeed";
import MessageSearchComp from "@/components/copilot/MessageSearch";
import EditBranch from "@/components/copilot/EditBranch";
import RichInputBar from "@/components/copilot/RichInputBar";
import ExportDialog from "@/components/copilot/ExportDialog";
import ToneSelector from "@/components/copilot/ToneSelector";
import TemplateLibrary from "@/components/copilot/TemplateLibrary";
import ModelConfigPanel from "@/components/copilot/ModelConfigPanel";
import ContextIndicator from "@/components/copilot/ContextIndicator";
import KeyboardShortcutsComp from "@/components/copilot/KeyboardShortcuts";
import ErrorRecovery from "@/components/copilot/ErrorRecovery";
import OnboardingWizard from "@/components/copilot/OnboardingWizard";
import StatsPanel from "@/components/copilot/StatsPanel";
import { CopilotSettings as CopilotSettingsPanel } from "@/components/aware/CopilotSettings";
import ProviderSelector from "@/components/copilot/ProviderSelector";
import { useSyncedUrlState } from "@/lib/urlState";

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const ESTIMATED_CHARS_PER_TOKEN = 4;

function estimateTokens(messages: Message[]): number {
  return messages.reduce((sum, m) => sum + Math.ceil(m.content.length / ESTIMATED_CHARS_PER_TOKEN), 0);
}

export default function CopilotPage() {
  const [convState, dispatch] = React.useReducer(conversationReducer, INITIAL_CONVERSATION_STATE, () => {
    const session = loadSession();
    return {
      ...INITIAL_CONVERSATION_STATE,
      messages: session?.messages?.length ? session.messages : [],
    };
  });

  const { messages, busy, agentSteps } = convState;

  // Ref mirror of messages to avoid stale closures in handleSend/handleRetry
  const messagesRef = React.useRef<Message[]>(messages);
  React.useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const [providerType, setProviderType] = React.useState<ProviderType>(() => {
    const session = loadSession();
    return session?.providerType ?? loadProviderType();
  });
  const [providerStatus, setProviderStatus] = React.useState<Record<ProviderType, ProviderStatus>>({
    webllm: "unavailable",
    openai: "available",
    chrome: "unavailable",
  });
  const [downloadProgress, setDownloadProgress] = React.useState<{
    progress: number; text: string;
  } | null>(null);
  const [showSettings, setShowSettings] = React.useState(false);
  const [openaiConfig, setOpenaiConfig] = React.useState(loadOpenAIConfig);
  const [input, setInput] = React.useState("");

  const [threads, setThreads] = React.useState<Thread[]>(() => loadThreads());
  const [showSearch, setShowSearch] = React.useState(false);
  const [showExport, setShowExport] = React.useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = React.useState(false);
  const [showModelConfig, setShowModelConfig] = React.useState(false);
  const [showStats, setShowStats] = React.useState(false);
  const [showTemplateLibrary, setShowTemplateLibrary] = React.useState(false);
  const [dismissedOnboarding, setDismissedOnboarding] = React.useState(false);
  const [editingMessageId, setEditingMessageId] = React.useState<string | null>(null);
  const [attachments, setAttachments] = React.useState<Attachment[]>([]);
  const [bookmarks, setBookmarks] = React.useState<Bookmark[]>(() => loadBookmarks());
  const [copilotSettings, setCopilotSettings] = React.useState<CopilotSettings>(() => loadCopilotSettings());

  const [threadUrl, setThreadUrl] = useSyncedUrlState<string | null>("copilotThread", null);

  const abortRef = React.useRef<AbortController | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  const editingMessage = React.useMemo(() => {
    if (!editingMessageId) return null;
    return messages.find((m) => m.id === editingMessageId) ?? null;
  }, [messages, editingMessageId]);

  const providers = React.useMemo(() => {
    const wllm = createProvider("webllm") as WebLLMProvider;
    wllm.onLoadProgress = (progress: number, text: string) => {
      setDownloadProgress({ progress, text });
      if (progress >= 1) setTimeout(() => setDownloadProgress(null), 2000);
    };
    return { webllm: wllm, openai: createProvider("openai"), chrome: createProvider("chrome") };
  }, []);

  React.useEffect(() => {
    (async () => {
      const [webllmStatus, chromeStatus] = await Promise.all([
        providers.webllm.checkAvailability(),
        providers.chrome.checkAvailability(),
      ]);
      setProviderStatus((prev) => ({ ...prev, webllm: webllmStatus, chrome: chromeStatus }));
    })();
  }, [providers]);

  React.useEffect(() => {
    if (threads.length > 0) saveThreads(threads);
  }, [threads]);

  React.useEffect(() => {
    if (threadUrl) {
      const t = threads.find((th) => th.id === threadUrl);
      if (t) {
        dispatch({ type: "SET_MESSAGES", payload: t.messages });
        setActiveThreadId(t.id);
        return;
      }
    }
    const session = loadSession();
    if (session?.messages?.length) return;
    const activeId = getActiveThreadId();
    if (activeId) {
      const t = threads.find((th) => th.id === activeId);
      if (t) {
        dispatch({ type: "SET_MESSAGES", payload: t.messages });
        return;
      }
    }
  }, [threadUrl]);

  const ensureActiveThread = React.useCallback((msgs: Message[]) => {
    setThreads((prev) => {
      const activeId = getActiveThreadId();
      if (activeId) {
        const updated = updateThreadInList(prev, activeId, { messages: msgs, messageCount: msgs.length });
        saveThreads(updated);
        return updated;
      }
      if (msgs.length === 0) return prev;
      const title = msgs[0].content.slice(0, 60) || "New Chat";
      const t = createThread(title, msgs, providerType);
      setActiveThreadId(t.id);
      setThreadUrl(t.id);
      const next = [t, ...prev];
      saveThreads(next);
      return next;
    });
  }, [providerType, setThreadUrl]);

  const handleEvent = React.useCallback((event: AgentEvent) => {
    dispatch({ type: "AGENT_EVENT", payload: event });
    if (event.type === "done" || event.type === "error") {
      abortRef.current = null;
    }
  }, []);

  const handleSend = React.useCallback(
    (text?: string) => {
      const content = (text ?? input).trim();
      if (!content || busy) return;
      if (!text) setInput("");

      // Use ref to read current messages without stale closure
      const history = messagesRef.current;
      const userMsg: Message = { id: uid(), role: "user", content, timestamp: Date.now() };
      const assistantMsg: Message = {
        id: uid(), role: "assistant", content: "", timestamp: Date.now(),
        streaming: true, graphNodes: [],
      };

      const updatedMessages = [...history, userMsg, assistantMsg];
      dispatch({ type: "SET_MESSAGES", payload: updatedMessages });
      dispatch({ type: "SET_BUSY", payload: true });
      ensureActiveThread(updatedMessages);
      setAttachments([]);

      const abort = new AbortController();
      abortRef.current = abort;

      runAgent({
        userContent: content,
        history,
        provider: providers[providerType],
        tools: TOOLS,
        signal: abort.signal,
        onEvent: handleEvent,
      }).catch((err: unknown) => {
        if (!abort.signal.aborted)
          handleEvent({
            type: "error",
            error: err instanceof Error ? err.message : "Unknown error",
          });
      });
    },
    [busy, input, providers, providerType, handleEvent, ensureActiveThread],
  );

  const handleRetry = React.useCallback(
    (messageId: string) => {
      // Read from ref to avoid stale closure; this keeps onRetry identity stable across streaming
      const current = messagesRef.current;
      const idx = current.findIndex((m) => m.id === messageId);
      if (idx < 0) return;
      let userIdx = idx - 1;
      while (userIdx >= 0 && current[userIdx].role !== "user") userIdx--;
      if (userIdx < 0) return;
      const userContent = current[userIdx].content;
      const slicedHistory = current.slice(0, userIdx);
      if (!userContent.trim() || busy) return;

      const userMsg: Message = { id: uid(), role: "user", content: userContent, timestamp: Date.now() };
      const assistantMsg: Message = {
        id: uid(), role: "assistant", content: "", timestamp: Date.now(),
        streaming: true, graphNodes: [],
      };
      const updated = [...slicedHistory, userMsg, assistantMsg];
      dispatch({ type: "SET_MESSAGES", payload: updated });
      dispatch({ type: "SET_BUSY", payload: true });

      const abort = new AbortController();
      abortRef.current = abort;
      runAgent({
        userContent,
        history: slicedHistory,
        provider: providers[providerType],
        tools: TOOLS,
        signal: abort.signal,
        onEvent: handleEvent,
      }).catch((err: unknown) => {
        if (!abort.signal.aborted)
          handleEvent({
            type: "error",
            error: err instanceof Error ? err.message : "Unknown error",
          });
      });
    },
    [busy, providers, providerType, handleEvent],
  );

  const handleStop = React.useCallback(() => {
    abortRef.current?.abort();
    handleEvent({ type: "done" });
  }, [handleEvent]);

  const handleProviderSwitch = React.useCallback((type: ProviderType) => {
    setProviderType(type);
    saveProviderType(type);
    setShowSettings(false);
  }, []);

  const handleNewChat = () => {
    abortRef.current?.abort();
    const t = createThread("New Chat", [], providerType);
    setThreads((prev) => {
      const next = [t, ...prev];
      saveThreads(next);
      return next;
    });
    setActiveThreadId(t.id);
    setThreadUrl(t.id);
    dispatch({ type: "SET_MESSAGES", payload: [] });
    dispatch({ type: "SET_BUSY", payload: false });
    setShowSettings(false);
    clearSession();
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const handleSaveSettings = (cfg: { apiKey: string; apiUrl: string; model: string }) => {
    setOpenaiConfig(cfg);
    saveOpenAIConfig(cfg);
    setShowSettings(false);
  };

  const handleSettingsChange = (settings: CopilotSettings) => {
    setCopilotSettings(settings);
    saveCopilotSettings(settings);
  };

  const handleToneChange = (tone: ToneOption) => {
    const next = { ...copilotSettings, tone };
    setCopilotSettings(next);
    saveCopilotSettings(next);
  };

  const handleAttach = (files: FileList | null) => {
    if (!files) return;
    const pending: Attachment[] = [];
    for (const file of Array.from(files)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target?.result as string;
        const isImage = file.type.startsWith("image/");
        pending.push({
          id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name: file.name,
          type: isImage ? "image" : "file",
          data,
          mimeType: file.type,
          size: file.size,
        });
        if (pending.length === files.length) {
          setAttachments((prev) => [...prev, ...pending]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const imageFiles: File[] = [];
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/") && item.kind === "file") {
        const file = item.getAsFile();
        if (file) imageFiles.push(file);
      }
    }
    if (imageFiles.length > 0) {
      e.preventDefault();
      const dt = new DataTransfer();
      for (const f of imageFiles) dt.items.add(f);
      handleAttach(dt.files);
    }
  };

  const handleEditSave = (messageId: string, newContent: string) => {
    dispatch({
      type: "SET_MESSAGES",
      payload: messagesRef.current.map((m) => (m.id === messageId ? { ...m, content: newContent } : m)),
    });
    setEditingMessageId(null);
  };

  const handleEditCancel = () => setEditingMessageId(null);

  const handleEditBranch = (messageId: string) => {
    const idx = messages.findIndex((m) => m.id === messageId);
    if (idx < 0) return;
    const branchMsgs = messages.slice(0, idx + 1);
    const t = createThread(`Branch: ${branchMsgs[0]?.content.slice(0, 40) || "Chat"}`, branchMsgs, providerType);
    setThreads((prev) => {
      const next = [t, ...prev];
      saveThreads(next);
      return next;
    });
    setActiveThreadId(t.id);
    setThreadUrl(t.id);
    dispatch({ type: "SET_MESSAGES", payload: branchMsgs });
    setEditingMessageId(null);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const handleDismissError = (messageId: string) => {
    dispatch({
      type: "SET_MESSAGES",
      payload: messagesRef.current.map((m) => (m.id === messageId ? { ...m, error: undefined } : m)),
    });
  };

  const handleResultSelect = (threadId: string) => {
    const t = threads.find((th) => th.id === threadId);
    if (t) {
      dispatch({ type: "SET_MESSAGES", payload: t.messages });
      setActiveThreadId(t.id);
      setThreadUrl(t.id);
    }
    setShowSearch(false);
  };

  const handleTemplateSelect = (content: string) => {
    setInput(content);
    setShowTemplateLibrary(false);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const handleBookmarkChange = () => setBookmarks([...loadBookmarks()]);

  const [copilotAction, setCopilotAction] = useSyncedUrlState<string | null>("copilotAction", null);
  const [copilotNew, setCopilotNew] = useSyncedUrlState<number | null>("copilotNew", null);

  React.useEffect(() => {
    if (copilotAction) {
      queueMicrotask(() => {
        handleSend(copilotAction);
        setCopilotAction(null);
      });
    }
  }, [copilotAction, handleSend, setCopilotAction]);

  React.useEffect(() => {
    if (copilotNew) {
      queueMicrotask(() => {
        handleNewChat();
        setCopilotNew(null);
      });
    }
  }, [copilotNew, handleNewChat, setCopilotNew]);

  React.useEffect(() => {
    const handler = () => setShowSettings(true);
    document.addEventListener("open-settings", handler);
    return () => document.removeEventListener("open-settings", handler);
  }, []);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key === "f") {
        e.preventDefault();
        setShowSearch(true);
      }
      if (meta && e.key === "n") {
        e.preventDefault();
        handleNewChat();
      }
      if (meta && e.key === "s" && e.shiftKey) {
        e.preventDefault();
        setShowExport(true);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [handleNewChat]);

  const showingOnboarding = messages.length === 0 && !busy && !dismissedOnboarding;
  const erroredMessages = messages.filter((m) => m.role === "assistant" && m.error && !m.streaming);

  const ariaStatus = busy ? "AI is thinking\u2026" : messages.some((m) => m.role === "assistant") ? "Response ready." : "";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        background: "var(--proof-editor-bg)",
        animation: "page-enter 0.22s ease-out both",
      }}
    >
      {/* ARIA live region — announces busy start/end to screen readers */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0,0,0,0)",
          whiteSpace: "nowrap",
          borderWidth: 0,
        }}
      >
        {ariaStatus}
      </div>
      {/* ── Top bar ───────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 16px",
          borderBottom: "1px solid var(--proof-border)",
          background: "var(--proof-overlay)",
          backdropFilter: "blur(20px)",
          flexShrink: 0,
          zIndex: 10,
          minHeight: 44,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(59,130,246,0.1))",
            border: "1px solid rgba(59,130,246,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Bot size={14} style={{ color: "var(--proof-blue)" }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 12.5,
              fontWeight: 700,
              letterSpacing: "-0.2px",
              color: "var(--proof-text)",
              lineHeight: 1.2,
            }}
          >
            Copilot
          </div>
          <div style={{ fontSize: 11, color: "var(--proof-text-muted)", lineHeight: 1.2 }}>
            {providerType === "openai"
              ? openaiConfig.model || "gpt-4o-mini"
              : providerType === "webllm"
                ? "WebLLM · Llama-3.2"
                : "Chrome AI · Gemini Nano"}
            {messages.length > 0 && ` · ${messages.length} messages`}
          </div>
        </div>

        <ContextIndicator
          usedTokens={estimateTokens(messages)}
          maxTokens={copilotSettings.contextWindow}
          messageCount={messages.length}
        />

        <ToneSelector currentTone={copilotSettings.tone} onToneChange={handleToneChange} />

        <ProviderSelector
          providerType={providerType}
          providerStatus={providerStatus}
          downloadProgress={downloadProgress}
          onSwitch={handleProviderSwitch}
        />

        <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
          <IconBtn icon={<Search size={13} />} title="Search (Cmd+F)" active={showSearch} onClick={() => setShowSearch((p) => !p)} />
          <IconBtn icon={<Download size={13} />} title="Export (Cmd+Shift+S)" onClick={() => setShowExport(true)} />
          <IconBtn icon={<BarChart3 size={13} />} title="Stats" active={showStats} onClick={() => setShowStats((p) => !p)} />
          <IconBtn icon={<Sliders size={13} />} title="Model Config" active={showModelConfig} onClick={() => setShowModelConfig((p) => !p)} />
          <IconBtn icon={<Keyboard size={13} />} title="Shortcuts" onClick={() => setShowKeyboardShortcuts(true)} />
          <IconBtn icon={<Settings size={13} />} title="Settings" active={showSettings} onClick={() => setShowSettings((p) => !p)} />

          <button
            onClick={handleNewChat}
            title="New Chat (Cmd+N)"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 9px",
              borderRadius: 6,
              fontSize: 10.5,
              fontWeight: 600,
              cursor: "pointer",
              border: "1px solid var(--proof-border)",
              background: "rgba(255,255,255,0.03)",
              color: "var(--proof-text-secondary)",
              transition: "all 0.15s",
              marginLeft: 4,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)";
              (e.currentTarget as HTMLElement).style.color = "var(--proof-text)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
              (e.currentTarget as HTMLElement).style.color = "var(--proof-text-secondary)";
            }}
          >
            <Plus size={11} /> New
          </button>

          {busy && (
            <button
              onClick={handleStop}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "4px 9px",
                borderRadius: 6,
                fontSize: 10.5,
                fontWeight: 600,
                cursor: "pointer",
                border: "1px solid var(--proof-red-border)",
                background: "var(--proof-red-bg)",
                color: "var(--proof-red)",
                transition: "all 0.15s",
                marginLeft: 4,
              }}
            >
              <Square size={9} fill="currentColor" /> Stop
            </button>
          )}
        </div>
      </div>

      {/* ── Settings panel ─────────────────────────────────────── */}
      {showSettings && (
        <CopilotSettingsPanel
          openaiConfig={openaiConfig}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* ── Agent step strip ────────────────────────────────────── */}
      {agentSteps.length > 0 && busy && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "4px 16px",
            borderBottom: "1px solid var(--proof-border)",
            background: "rgba(59,130,246,0.04)",
            fontSize: 10,
            color: "var(--proof-text-muted)",
            flexShrink: 0,
          }}
        >
          <Loader2
            size={8}
            style={{ animation: "spin 0.8s linear infinite", color: "var(--proof-blue)", flexShrink: 0 }}
          />
          {agentSteps.slice(-4).map((s, i) => (
            <React.Fragment key={s.id}>
              {i > 0 && <span style={{ color: "rgba(255,255,255,0.12)" }}>·</span>}
              <span
                style={{
                  color:
                    s.status === "completed"
                      ? "var(--proof-green)"
                      : s.status === "running"
                        ? "var(--proof-blue)"
                        : "var(--proof-text-muted)",
                  fontWeight: s.status === "running" ? 600 : 400,
                  fontFamily: "var(--font-mono)",
                }}
              >
                {s.label}
                {s.detail ? ` (${s.detail})` : ""}
              </span>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* ── Messages area ───────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
          minHeight: 0,
          flexDirection: "column",
          position: "relative",
        }}
      >
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", position: "relative" }}>
          {showSearch ? (
            <MessageSearchComp
              threads={threads}
              onResultSelect={handleResultSelect}
              onClose={() => setShowSearch(false)}
            />
          ) : showingOnboarding ? (
            <OnboardingWizard
              onStartChat={handleSend}
              onDismiss={() => setDismissedOnboarding(true)}
            />
          ) : (
            <MessageFeed messages={messages} onRetry={handleRetry} onSend={handleSend} />
          )}
        </div>

        {erroredMessages.map((msg) => (
          <div key={msg.id} style={{ padding: "0 16px", flexShrink: 0 }}>
            <ErrorRecovery
              message={msg}
              onRetry={handleRetry}
              onDismiss={handleDismissError}
            />
          </div>
        ))}
      </div>

      {/* ── Edit branch ─────────────────────────────────────────── */}
      {editingMessage && (
        <EditBranch
          message={editingMessage}
          onSave={handleEditSave}
          onCancel={handleEditCancel}
          onBranch={handleEditBranch}
        />
      )}

      {/* ── Download progress ────────────────────────────────────── */}
      {downloadProgress && (
        <div
          style={{
            padding: "6px 18px",
            borderTop: "1px solid var(--proof-border)",
            background: "rgba(59,130,246,0.05)",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            gap: 5,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 10.5,
              color: "var(--proof-blue-bright)",
            }}
          >
            <span style={{ fontWeight: 600 }}>Loading WebLLM model\u2026</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 9 }}>
              {Math.round((downloadProgress.progress ?? 0) * 100)}%
            </span>
          </div>
          <div
            style={{
              height: 2,
              background: "rgba(255,255,255,0.05)",
              borderRadius: 99,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${Math.round((downloadProgress.progress ?? 0) * 100)}%`,
                background: "linear-gradient(90deg, var(--proof-blue-hover), var(--proof-blue))",
                borderRadius: 99,
                transition: "width 0.3s",
              }}
            />
          </div>
          <div style={{ fontSize: 9, color: "var(--proof-text-muted)" }}>
            {downloadProgress.text}
          </div>
        </div>
      )}

      {/* ── Input bar ──────────────────────────────────────────── */}
      <div
        style={{
          maxWidth: 860,
          width: "100%",
          alignSelf: "center",
          flexShrink: 0,
        }}
      >
        <RichInputBar
          input={input}
          busy={busy}
          textareaRef={textareaRef}
          attachments={attachments}
          onSend={() => handleSend()}
          onStop={handleStop}
          onInput={setInput}
          onAttach={handleAttach}
          onRemoveAttachment={handleRemoveAttachment}
          onPaste={handlePaste}
          onTemplateSelect={() => setShowTemplateLibrary(true)}
        />
      </div>

      {/* ── Overlays ───────────────────────────────────────────── */}
      {showExport && (() => {
        const activeId = getActiveThreadId();
        const exportThread = activeId ? threads.find((th) => th.id === activeId) : null;
        return exportThread ? (
          <ExportDialog thread={exportThread} onClose={() => setShowExport(false)} />
        ) : null;
      })()}

      {showTemplateLibrary && (
        <TemplateLibrary onSelect={handleTemplateSelect} onClose={() => setShowTemplateLibrary(false)} />
      )}

      {showModelConfig && (
        <ModelConfigPanel
          settings={copilotSettings}
          onSettingsChange={handleSettingsChange}
          onClose={() => setShowModelConfig(false)}
        />
      )}

      {showKeyboardShortcuts && (
        <KeyboardShortcutsComp onClose={() => setShowKeyboardShortcuts(false)} />
      )}

      {showStats && (() => {
        const activeId = getActiveThreadId();
        const statsThread = activeId ? threads.find((th) => th.id === activeId) : null;
        return statsThread ? (
          <StatsPanel thread={statsThread} onClose={() => setShowStats(false)} />
        ) : null;
      })()}
    </div>
  );
}

function IconBtn({
  icon, title, active, onClick,
}: {
  icon: React.ReactNode;
  title: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-pressed={active}
      style={{
        padding: "5px 6px",
        borderRadius: 6,
        cursor: "pointer",
        border: "1px solid transparent",
        background: active ? "rgba(59,130,246,0.1)" : "transparent",
        color: active ? "var(--proof-blue-bright)" : "var(--proof-text-muted)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.12s",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
          (e.currentTarget as HTMLElement).style.color = "var(--proof-text-secondary)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.background = "transparent";
          (e.currentTarget as HTMLElement).style.color = "var(--proof-text-muted)";
        }
      }}
    >
      {icon}
    </button>
  );
}
