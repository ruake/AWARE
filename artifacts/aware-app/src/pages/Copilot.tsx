import React from "react";
import {
  Bot,
  Settings,
  Plus,
  Square,
  Loader2,
  Search,
  Download,
  Keyboard,
  BarChart3,
  Sliders,
} from "lucide-react";
import { TOOLS } from "@/lib/copilot/tools";
import { runAgent } from "@/lib/copilot/agent";
import { createProvider } from "@/lib/copilot/providers";
import { QUICK_ACTIONS } from "@/lib/copilot/quickActions";
import {
  loadThreads,
  saveThreads,
  loadSession,
  clearSession,
  createThread,
  updateThreadInList,
  getActiveThreadId,
  setActiveThreadId,
  loadCopilotSettings,
  saveCopilotSettings,
  loadBookmarks,
} from "@/lib/copilot/storage";
import type {
  Message,
  ProviderType,
  ProviderStatus,
  AgentEvent,
  Thread,
  Attachment,
  Bookmark,
  CopilotSettings,
  ToneOption,
} from "@/lib/copilot/types";
import { conversationReducer, INITIAL_CONVERSATION_STATE } from "@/lib/copilot/copilotReducer";
import LangGraphPanel from "@/components/copilot/LangGraphPanel";
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
import { CopilotSidebar } from "@/components/aware/CopilotSidebar";
import ProviderSelector from "@/components/copilot/ProviderSelector";
import { useSyncedUrlState } from "@/lib/urlState";
import { motion, AnimatePresence } from "framer-motion";

const uid = () => crypto.randomUUID().replace(/-/g, "");
const ESTIMATED_CHARS_PER_TOKEN = 4;

function estimateTokens(messages: Message[]): number {
  return messages.reduce(
    (sum, m) => sum + Math.ceil(m.content.length / ESTIMATED_CHARS_PER_TOKEN),
    0,
  );
}

export default function CopilotPage() {
  const [convState, dispatch] = React.useReducer(
    conversationReducer,
    INITIAL_CONVERSATION_STATE,
    () => {
      const session = loadSession();
      return {
        ...INITIAL_CONVERSATION_STATE,
        messages: session?.messages?.length ? session.messages : [],
      };
    },
  );

  const { messages, busy, agentSteps } = convState;

  // Ref mirror of messages to avoid stale closures in handleSend/handleRetry
  const messagesRef = React.useRef<Message[]>(messages);
  React.useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const providerType = "chrome";
  const [providerStatus, setProviderStatus] = React.useState<Record<"chrome", ProviderStatus>>({
    chrome: "unavailable",
  });
  const [downloadProgress, setDownloadProgress] = React.useState<{
    progress: number;
    text: string;
  } | null>(null);
  const [showSettings, setShowSettings] = React.useState(false);
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
  const [_bookmarks, setBookmarks] = React.useState<Bookmark[]>(() => loadBookmarks());
  const [copilotSettings, setCopilotSettings] = React.useState<CopilotSettings>(() =>
    loadCopilotSettings(),
  );

  const [threadUrl, setThreadUrl] = useSyncedUrlState<string | null>("copilotThread", null);

  const abortRef = React.useRef<AbortController | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  const editingMessage = React.useMemo(() => {
    if (!editingMessageId) return null;
    return messages.find((m) => m.id === editingMessageId) ?? null;
  }, [messages, editingMessageId]);

  const provider = React.useMemo(() => createProvider("chrome"), []);

  React.useEffect(() => {
    (async () => {
      const chromeStatus = await provider.checkAvailability();
      setProviderStatus({ chrome: chromeStatus });
    })();
  }, [provider]);

  React.useEffect(() => {
    if (threads.length > 0) saveThreads(threads);
  }, [threads]);

  React.useEffect(() => {
    if (threadUrl) {
      const t = threads.find((th) => th.id === threadUrl);
      if (t) {
        dispatch({ type: "SET_MESSAGES", payload: t.messages });
        setActiveThreadId(t.id);
        setThreadUrl(t.id);
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
  }, [threadUrl, threads, setThreadUrl]);

  const ensureActiveThread = React.useCallback(
    (msgs: Message[]) => {
      setThreads((prev) => {
        const activeId = getActiveThreadId();
        if (activeId) {
          const updated = updateThreadInList(prev, activeId, {
            messages: msgs,
            messageCount: msgs.length,
          });
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
    },
    [providerType, setThreadUrl],
  );

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
        id: uid(),
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        streaming: true,
        graphNodes: [],
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
        provider,
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
    [busy, input, provider, providerType, handleEvent, ensureActiveThread],
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

      const userMsg: Message = {
        id: uid(),
        role: "user",
        content: userContent,
        timestamp: Date.now(),
      };
      const assistantMsg: Message = {
        id: uid(),
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        streaming: true,
        graphNodes: [],
      };
      const updated = [...slicedHistory, userMsg, assistantMsg];
      dispatch({ type: "SET_MESSAGES", payload: updated });
      dispatch({ type: "SET_BUSY", payload: true });

      const abort = new AbortController();
      abortRef.current = abort;
      runAgent({
        userContent,
        history: slicedHistory,
        provider,
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
    [busy, provider, providerType, handleEvent],
  );

  const handleStop = React.useCallback(() => {
    abortRef.current?.abort();
    handleEvent({ type: "done" });
  }, [handleEvent]);

  const handleNewChat = React.useCallback(() => {
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
  }, [providerType, setThreadUrl]);

  const handleSaveSettings = () => {
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
          id: `att_$\{crypto.randomUUID().slice(0, 8)\}`,
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
      payload: messagesRef.current.map((m) =>
        m.id === messageId ? { ...m, content: newContent } : m,
      ),
    });
    setEditingMessageId(null);
  };

  const handleEditCancel = () => setEditingMessageId(null);

  const handleEditBranch = (messageId: string) => {
    const idx = messages.findIndex((m) => m.id === messageId);
    if (idx < 0) return;
    const branchMsgs = messages.slice(0, idx + 1);
    const t = createThread(
      `Branch: $\{branchMsgs[0]?.content.slice(0, 40) || "Chat"\}`,
      branchMsgs,
      providerType,
    );
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
      payload: messagesRef.current.map((m) =>
        m.id === messageId ? { ...m, error: undefined } : m,
      ),
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

  const _handleBookmarkChange = () => setBookmarks([...loadBookmarks()]);

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

  const erroredMessages = messages.filter((m) => m.role === "assistant" && m.error && !m.streaming);
  const showingOnboarding = messages.length === 0 && !busy && !dismissedOnboarding;

  const ariaStatus = busy
    ? "AI is thinking\u2026"
    : messages.some((m) => m.role === "assistant")
      ? "Response ready."
      : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        display: "flex",
        flexDirection: "column",
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background: "var(--proof-editor-bg)",
        zIndex: 10,
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
          gap: 12,
          padding: "10px 20px",
          borderBottom: "1px solid var(--proof-border)",
          background: "rgba(10, 20, 40, 0.7)",
          backdropFilter: "blur(20px)",
          flexShrink: 0,
          zIndex: 100,
          minHeight: 56,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: "linear-gradient(135deg, var(--proof-blue), var(--proof-purple))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 0 15px rgba(59,130,246,0.3)",
          }}
        >
          <Bot size={18} style={{ color: "white" }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: "-0.3px",
              color: "var(--proof-text)",
              lineHeight: 1.2,
            }}
          >
            AWARE Copilot
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--proof-text-muted)",
              lineHeight: 1.2,
              fontWeight: 500,
            }}
          >
            Chrome AI · Gemini Nano
            {messages.length > 0 && ` · $\{messages.length\} messages`}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <ContextIndicator
            usedTokens={estimateTokens(messages)}
            maxTokens={copilotSettings.contextWindow}
            messageCount={messages.length}
          />

          <div style={{ width: 1, height: 24, background: "var(--proof-border)" }} />

          <ToneSelector currentTone={copilotSettings.tone} onToneChange={handleToneChange} />

          <ProviderSelector
            providerStatus={providerStatus}
            downloadProgress={downloadProgress}
          />

          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <IconBtn
              icon={<Search size={16} />}
              title="Search (Cmd+F)"
              active={showSearch}
              onClick={() => setShowSearch((p) => !p)}
            />
            <IconBtn
              icon={<Download size={16} />}
              title="Export (Cmd+Shift+S)"
              onClick={() => setShowExport(true)}
            />
            <IconBtn
              icon={<BarChart3 size={16} />}
              title="Stats"
              active={showStats}
              onClick={() => setShowStats((p) => !p)}
            />
            <IconBtn
              icon={<Sliders size={16} />}
              title="Model Config"
              active={showModelConfig}
              onClick={() => setShowModelConfig((p) => !p)}
            />
            <IconBtn
              icon={<Settings size={16} />}
              title="Settings"
              active={showSettings}
              onClick={() => setShowSettings((p) => !p)}
            />

            <button
              onClick={handleNewChat}
              className="proof-button-primary"
              title="New Chat (Cmd+N)"
              style={{
                height: 32,
                fontSize: 12,
                padding: "0 12px",
                marginLeft: 8,
              }}
            >
              <Plus size={16} /> New Chat
            </button>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>
        <CopilotSidebar
          onNewChat={handleNewChat}
          onSend={handleSend}
          style={{ width: 250, borderRight: "1px solid var(--proof-border)" }}
        />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <MessageFeed
            messages={messages}
            onRetry={handleRetry}
            onSend={handleSend}
          />
          <div style={{ borderTop: "1px solid var(--proof-border)", background: "rgba(10, 20, 40, 0.4)" }}>
            {busy && (
              <div style={{ padding: "8px 16px 0" }}>
                <LangGraphPanel
                  nodes={messages[messages.length - 1]?.graphNodes ?? []}
                  streaming={busy}
                  providerType={providerType}
                />
              </div>
            )}
            <div
              style={{
                display: "flex",
                gap: 8,
                padding: "10px 16px",
                overflowX: "auto",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleSend(action.message)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 12px",
                    borderRadius: 20,
                    background: "var(--proof-surface-2)",
                    border: "1px solid var(--proof-border)",
                    color: "var(--proof-text-secondary)",
                    fontSize: 11,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = action.color;
                    e.currentTarget.style.color = "var(--proof-text)";
                    e.currentTarget.style.background = "var(--proof-surface-hover)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--proof-border)";
                    e.currentTarget.style.color = "var(--proof-text-secondary)";
                    e.currentTarget.style.background = "var(--proof-surface-2)";
                  }}
                >
                  <action.icon size={12} style={{ color: action.color }} />
                  {action.label}
                </button>
              ))}
            </div>
            <RichInputBar
              input={input}
              busy={busy}
              textareaRef={textareaRef}
              onSend={() => handleSend()}
              onInput={setInput}
              onStop={handleStop}
              attachments={attachments}
              onAttach={handleAttach}
              onRemoveAttachment={handleRemoveAttachment}
              onPaste={handlePaste}
              onTemplateSelect={() => setShowTemplateLibrary(true)}
            />
          </div>
        </div>

        {/* Overlay panels */}
        <AnimatePresence>
          {showStats && (
            <motion.div
              initial={{ x: 320 }}
              animate={{ x: 0 }}
              exit={{ x: 320 }}
              style={{
                position: "absolute",
                right: 0,
                top: 0,
                bottom: 0,
                width: 320,
                zIndex: 110,
                background: "var(--proof-surface)",
                borderLeft: "1px solid var(--proof-border)",
                boxShadow: "-8px 0 24px rgba(0,0,0,0.2)",
              }}
            >
              <StatsPanel thread={null} onClose={() => setShowStats(false)} />
            </motion.div>
          )}

          {showSearch && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                position: "absolute",
                top: 70,
                right: 20,
                width: 400,
                maxHeight: "80%",
                zIndex: 120,
              }}
            >
              <MessageSearchComp
                threads={threads}
                onResultSelect={handleResultSelect}
                onClose={() => setShowSearch(false)}
              />
            </motion.div>
          )}

          {showSettings && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
                backdropFilter: "blur(4px)",
              }}
              onClick={() => setShowSettings(false)}
            >
              <div onClick={(e) => e.stopPropagation()}>
                <CopilotSettingsPanel
                  onClose={() => setShowSettings(false)}
                />
              </div>
            </div>
          )}

          {showExport && (
            <ExportDialog
              thread={null}
              onClose={() => setShowExport(false)}
            />
          )}

          {showModelConfig && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                position: "absolute",
                top: 70,
                right: 180,
                zIndex: 115,
              }}
            >
              <ModelConfigPanel
                settings={copilotSettings}
                onSettingsChange={handleSettingsChange}
                onClose={() => setShowModelConfig(false)}
              />
            </motion.div>
          )}

          {showKeyboardShortcuts && (
            <KeyboardShortcutsComp onClose={() => setShowKeyboardShortcuts(false)} />
          )}

          {editingMessageId && editingMessage && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
                backdropFilter: "blur(4px)",
              }}
            >
              <div style={{ width: 600 }}>
                <EditBranch
                  message={editingMessage}
                  onSave={handleEditSave}
                  onCancel={handleEditCancel}
                  onBranch={handleEditBranch}
                />
              </div>
            </div>
          )}

          {showTemplateLibrary && (
            <TemplateLibrary
              onSelect={handleTemplateSelect}
              onClose={() => setShowTemplateLibrary(false)}
            />
          )}
        </AnimatePresence>

        {showingOnboarding && (
          <OnboardingWizard
            onStartChat={() => setDismissedOnboarding(true)}
            onDismiss={() => setDismissedOnboarding(true)}
          />
        )}

        {erroredMessages.map((m) => (
          <ErrorRecovery
            key={m.id}
            message={m}
            onRetry={(id) => handleRetry(id)}
            onDismiss={(id) => handleDismissError(id)}
          />
        ))}
      </div>
    </motion.div>
  );
}

function IconBtn({
  icon,
  title,
  active,
  onClick,
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
