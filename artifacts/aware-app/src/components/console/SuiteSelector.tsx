import React from "react";
import { ChevronDown, Check, Search, Layers } from "lucide-react";
import { getTestSuites } from "@/lib/data";
import { getSelectedSuiteIds, toggleSelectedSuiteId, setSelectedSuiteIds } from "@/lib/filters";

interface SuiteSelectorProps {
  currentSuiteIds: string[];
  onSuiteChange: (suiteIds: string[]) => void;
  variant?: "topbar" | "full";
}

function filterSuites(query: string) {
  const suites = getTestSuites();
  if (!query) return suites;
  const q = query.toLowerCase();
  return suites.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.tags.some((t) => t.toLowerCase().includes(q)),
  );
}

function triggerLabel(selectedIds: string[]): string {
  if (selectedIds.length === 0) return "All suites";
  const suites = getTestSuites();
  const selected = suites.filter((s) => selectedIds.includes(s.id));
  if (selected.length === 0) return "All suites";
  if (selected.length === 1) return selected[0].name;
  return `${selected[0].name} +${selected.length - 1}`;
}

export function SuiteSelector({
  currentSuiteIds,
  onSuiteChange,
  variant = "topbar",
}: SuiteSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [activeIdx, setActiveIdx] = React.useState(-1);
  const [triggerHovered, setTriggerHovered] = React.useState(false);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  const suites = getTestSuites();
  const filtered = filterSuites(query);

  const allSuiteIds = suites.map((s) => s.id);
  const allSelected =
    allSuiteIds.length > 0 && allSuiteIds.every((id) => currentSuiteIds.includes(id));

  const flatItems = React.useMemo(() => {
    const items: { suiteId: string; label: string }[] = [];
    items.push({ suiteId: "__all__", label: "All suites" });
    for (const suite of filtered) {
      items.push({ suiteId: suite.id, label: suite.name });
    }
    return items;
  }, [query, filtered]);

  React.useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function handleItemClick(suiteId: string): void {
    if (suiteId === "__all__") {
      onSuiteChange([]);
      return;
    }
    toggleSelectedSuiteId(suiteId);
    const updated = getSelectedSuiteIds();
    onSuiteChange(updated);
  }

  function isSelected(suiteId: string): boolean {
    if (suiteId === "__all__") return allSelected || currentSuiteIds.length === 0;
    return currentSuiteIds.includes(suiteId);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setOpen(false);
      triggerRef.current?.focus();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((prev) => (prev < flatItems.length - 1 ? prev + 1 : 0));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((prev) => (prev > 0 ? prev - 1 : flatItems.length - 1));
      return;
    }
    if (e.key === "Enter" && activeIdx >= 0 && activeIdx < flatItems.length) {
      e.preventDefault();
      const item = flatItems[activeIdx];
      handleItemClick(item.suiteId);
    }
  }

  React.useEffect(() => {
    if (activeIdx < 0 || !listRef.current) return;
    const items = listRef.current.querySelectorAll<HTMLElement>("[data-suite-item]");
    if (items[activeIdx]) {
      items[activeIdx].scrollIntoView({ block: "nearest" });
    }
  }, [activeIdx]);

  function handleToggle() {
    if (open) {
      setOpen(false);
    } else {
      setQuery("");
      setActiveIdx(-1);
      setOpen(true);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }

  const trigger = (
    <button
      ref={triggerRef}
      onClick={handleToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleToggle();
        }
      }}
      aria-haspopup="listbox"
      aria-expanded={open}
      onMouseEnter={() => setTriggerHovered(true)}
      onMouseLeave={() => setTriggerHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: variant === "full" ? "8px 14px" : "4px 8px",
        fontSize: variant === "full" ? 13 : 11,
        fontWeight: 600,
        cursor: "pointer",
        border: "1px solid var(--proof-border-strong)",
        borderRadius: 5,
        background: triggerHovered
          ? "var(--proof-hover)"
          : variant === "full"
            ? "var(--proof-surface-2)"
            : "var(--proof-hover-light)",
        color: triggerHovered ? "var(--proof-text)" : "var(--proof-text-secondary)",
        fontFamily: "var(--font-mono)",
        whiteSpace: "nowrap",
        transition: "all 0.15s",
        width: variant === "full" ? "100%" : undefined,
        justifyContent: variant === "full" ? "space-between" : undefined,
        maxWidth: variant === "full" ? undefined : 200,
      }}
    >
      {variant === "full" && (
        <Layers size={14} style={{ color: "var(--proof-text-muted)", flexShrink: 0 }} />
      )}
      <span style={{ flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis" }}>
        {triggerLabel(currentSuiteIds)}
      </span>
      <ChevronDown
        size={12}
        style={{
          flexShrink: 0,
          color: "var(--proof-text-muted)",
          transition: "transform 0.15s",
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
        }}
      />
    </button>
  );

  const panel = open && (
    <div
      ref={panelRef}
      role="listbox"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      style={{
        position: variant === "full" ? "relative" : "absolute",
        top: variant === "full" ? 4 : "calc(100% + 4px)",
        left: 0,
        right: variant === "full" ? undefined : 0,
        width: variant === "full" ? "100%" : 280,
        background: "var(--proof-surface-2)",
        border: "1px solid var(--proof-border)",
        borderRadius: 6,
        boxShadow: "var(--proof-shadow-lg)",
        zIndex: 200,
        overflow: "hidden",
        animation: "slide-down 0.15s ease-out",
      }}
    >
      {/* Search */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 8px",
          borderBottom: "1px solid var(--proof-border)",
        }}
      >
        <Search size={13} style={{ color: "var(--proof-text-muted)", flexShrink: 0 }} />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIdx(-1);
          }}
          placeholder="Find suites"
          role="searchbox"
          aria-label="Find suites"
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            background: "transparent",
            fontSize: 12,
            color: "var(--proof-text)",
            fontFamily: "var(--font-sans)",
            minWidth: 0,
          }}
        />
      </div>

      {/* List */}
      <div
        ref={listRef}
        style={{
          maxHeight: 320,
          overflowY: "auto",
          padding: "4px 0",
        }}
      >
        {filtered.length === 0 && (
          <div
            style={{
              padding: "16px 12px",
              textAlign: "center",
              fontSize: 12,
              color: "var(--proof-text-muted)",
            }}
          >
            No suites match "{query}"
          </div>
        )}

        {/* All suites option */}
        {(!query || "all suites".includes(query.toLowerCase())) && (
          <div
            data-suite-item
            role="option"
            aria-selected={currentSuiteIds.length === 0}
            onClick={() => handleItemClick("__all__")}
            onMouseEnter={() => setActiveIdx(0)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "7px 10px",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
              color: activeIdx === 0 ? "var(--proof-text)" : "var(--proof-text-secondary)",
              background: activeIdx === 0 ? "var(--proof-surface-hover)" : "transparent",
              transition: "background 0.1s",
              borderBottom: "1px solid var(--proof-border)",
            }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: 3,
                border: `2px solid ${currentSuiteIds.length === 0 ? "var(--proof-blue)" : "var(--proof-border-strong)"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                background: currentSuiteIds.length === 0 ? "var(--proof-blue)" : "transparent",
              }}
            >
              {currentSuiteIds.length === 0 && <Check size={11} style={{ color: "#fff" }} />}
            </div>
            <span>All suites</span>
          </div>
        )}

        {filtered.map((suite) => {
          const sel = isSelected(suite.id);
          const flatIdx = flatItems.findIndex((f) => f.suiteId === suite.id);
          const isActive = flatIdx === activeIdx;

          return (
            <div
              key={suite.id}
              data-suite-item
              role="option"
              aria-selected={sel}
              onClick={() => handleItemClick(suite.id)}
              onMouseEnter={() => setActiveIdx(flatIdx)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "7px 10px 7px 26px",
                cursor: "pointer",
                fontSize: 12,
                color: isActive ? "var(--proof-text)" : "var(--proof-text-secondary)",
                background: isActive ? "var(--proof-surface-hover)" : "transparent",
                transition: "background 0.1s",
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 3,
                  border: `2px solid ${sel ? "var(--proof-blue)" : "var(--proof-border-strong)"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  background: sel ? "var(--proof-blue)" : "transparent",
                }}
              >
                {sel && <Check size={11} style={{ color: "#fff" }} />}
              </div>
              <span style={{ flex: 1, minWidth: 0 }}>{suite.name}</span>
              {suite.runners.map((runner) => (
                <span
                  key={runner}
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.4px",
                    padding: "1px 5px",
                    borderRadius: 3,
                    fontFamily: "var(--font-mono)",
                    background:
                      runner === "playwright" ? "rgba(69,194,115,0.12)" : "rgba(99,102,241,0.12)",
                    color: runner === "playwright" ? "var(--proof-green)" : "var(--proof-indigo)",
                    border:
                      runner === "playwright"
                        ? "1px solid rgba(69,194,115,0.25)"
                        : "1px solid rgba(99,102,241,0.25)",
                  }}
                >
                  {runner === "playwright" ? "pw" : "py"}
                </span>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );

  if (variant === "full") {
    return (
      <div style={{ width: "100%", position: "relative" }}>
        {trigger}
        {panel}
      </div>
    );
  }

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      {trigger}
      {panel}
    </div>
  );
}
