import React from "react";
import { AppLayout } from "@/components/aware/AppLayout";
import { Link } from "wouter";
import {
  Zap, BarChart3, GitCompare, Bug, Activity, Shield, Globe, Book,
  ChevronDown, ChevronLeft, ChevronRight, CheckCircle2, Plus, Trash2,
  Maximize2, Download, Copy, Layout, GripHorizontal, Edit3, X, Save,
  Image, RotateCw, AlignLeft, Columns, PanelBottom, Eye
} from "lucide-react";
import { RUNS, DIFF_ROWS } from "@/lib/data";

function DocSection({ title, defaultOpen, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(defaultOpen ?? false);
  return (
    <div className="gcp-card" style={{ marginBottom: 12, overflow: "hidden" }}>
      <button onClick={() => setOpen(!open)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "var(--gcp-grey-bg)", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "var(--gcp-text)", textAlign: "left" }}>
        <ChevronDown size={14} style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.15s", flexShrink: 0 }} />
        {title}
      </button>
      {open && <div style={{ padding: "4px 16px 16px", fontSize: 12, lineHeight: 1.7, color: "var(--gcp-text-secondary)" }}>{children}</div>}
    </div>
  );
}

function DocTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <table className="gcp-table" style={{ margin: "8px 0", fontSize: 11 }}>
      <thead><tr>{headers.map(h => <th key={h}>{h}</th>)}</tr></thead>
      <tbody>
        {rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} style={{ fontFamily: j === 0 ? "var(--font-mono)" : undefined, fontSize: 11 }}>{c}</td>)}</tr>)}
      </tbody>
    </table>
  );
}

const ICON_MAP = { GitCompare, Shield, Globe, Bug, Activity, Zap, BarChart3 } as const;
type SlideIcon = keyof typeof ICON_MAP;

interface SlideData {
  id: string;
  icon: SlideIcon;
  title: string;
  color: string;
  detail: string;
  points: string[];
}

const DEFAULT_SLIDES: SlideData[] = [
  { id: "s1", icon: "GitCompare", title: "Regression Detection", color: "var(--gcp-red)", detail: "Catch regressions before they reach production with baseline-vs-candidate diff analysis.", points: ["Side-by-side test result comparison", "Column filters for status, duration, environment", "Permalink sharing for team review", "One-click GitHub issue filing"] },
  { id: "s2", icon: "Shield", title: "Promotion Gating", color: "var(--gcp-orange)", detail: "Block or approve deployments based on per-environment pass-rate thresholds and regression checks.", points: ["Pass-rate comparison across env tiers", "Version drift tracking between builds", "Alert triage with run history drill-down", "Automated promotion decision support"] },
  { id: "s3", icon: "Globe", title: "Cross-Environment Testing", color: "var(--gcp-blue)", detail: "Compare test behavior across Prod/Production, Prod/Staging, UAT/Production, and UAT/Staging.", points: ["Per-environment pass-rate charts", "Environment-specific config and IP mapping", "Multi-env run history with filtering", "Side-by-side env health dashboard"] },
  { id: "s4", icon: "Bug", title: "Test Case Lifecycle", color: "var(--gcp-green)", detail: "Create, organize, import/export, and AI-generate test cases and suites.", points: ["Tabbed CRUD form with docs & HTTP config", "Multi-format import (JSON, YAML, JUnit XML)", "Bulk actions: delete, status change, add to suite", "AI-powered test generation from prompts"] },
  { id: "s5", icon: "Activity", title: "CI/CD Observability", color: "var(--gcp-purple)", detail: "Monitor GitHub Actions run history, pass rates, failure trends, and run frequency.", points: ["Filterable run table with detail side panels", "Pass-rate charts by day and environment", "Run frequency tracking with gap detection", "Export and Slack sharing for team communication"] },
  { id: "s6", icon: "Zap", title: "AI-Powered Analysis", color: "var(--gcp-yellow)", detail: "Use LLM to analyze test failures, explain diffs, generate test scripts, and generate suites.", points: ["Multi-provider: Mock, OpenAI, WebLLM", "5 built-in skills for code gen & analysis", "Rolling chat history with skill context", "WebLLM support for fully offline operation"] },
];

const SLIDE_COLORS = ["var(--gcp-red)", "var(--gcp-orange)", "var(--gcp-blue)", "var(--gcp-green)", "var(--gcp-purple)", "var(--gcp-yellow)", "var(--gcp-cyan)", "var(--gcp-pink)", "var(--gcp-indigo)", "#5f6368"];
const SLIDE_ICONS: SlideIcon[] = ["GitCompare", "Shield", "Globe", "Bug", "Activity", "Zap", "BarChart3"];

function genId() { return `s${Date.now()}`; }

const TEMPLATE_KEY = "aware_carousel_templates";

function loadTemplates(): SlideData[][] {
  try { return JSON.parse(localStorage.getItem(TEMPLATE_KEY) || "[]"); }
  catch { return []; }
}

function saveTemplates(t: SlideData[][]) {
  localStorage.setItem(TEMPLATE_KEY, JSON.stringify(t));
}

const ASPECTS = [
  { label: "1:1", w: 1, h: 1 },
  { label: "4:5", w: 4, h: 5 },
  { label: "9:16", w: 9, h: 16 },
  { label: "16:9", w: 16, h: 9 },
  { label: "3:2", w: 3, h: 2 },
];

function CarouselSlides() {
  const [slides, setSlides] = React.useState<SlideData[]>(DEFAULT_SLIDES);
  const [idx, setIdx] = React.useState(0);
  const [fullscreen, setFullscreen] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [editingPointIdx, setEditingPointIdx] = React.useState<number | null>(null);
  const [aspect, setAspect] = React.useState(0);
  const [templates, setTemplates] = React.useState<SlideData[][]>(loadTemplates);
  const [showTemplatePicker, setShowTemplatePicker] = React.useState(false);
  const [dragOverIdx, setDragOverIdx] = React.useState<number | null>(null);
  const total = slides.length;
  const slide = slides[idx] || slides[0];
  const Icon = slide ? ICON_MAP[slide.icon] : Zap;
  const curAspect = ASPECTS[aspect];

  React.useEffect(() => {
    if (total < 2) return;
    const t = setInterval(() => setIdx(prev => (prev + 1) % total), 5000);
    return () => clearInterval(t);
  }, [total]);

  // ---- Slide CRUD ----
  function addSlide() {
    const newSlide: SlideData = {
      id: genId(),
      icon: SLIDE_ICONS[slides.length % SLIDE_ICONS.length],
      title: `New Use Case ${slides.length + 1}`,
      color: SLIDE_COLORS[slides.length % SLIDE_COLORS.length],
      detail: "Describe how PROOF solves this use case...",
      points: ["Key capability one", "Key capability two", "Key capability three"],
    };
    setSlides(prev => [...prev, newSlide]);
    setIdx(slides.length);
  }

  function deleteSlide(id: string) {
    if (slides.length <= 1) return;
    const newSlides = slides.filter(s => s.id !== id);
    setSlides(newSlides);
    if (idx >= newSlides.length) setIdx(newSlides.length - 1);
  }

  function updateSlide(id: string, patch: Partial<SlideData>) {
    setSlides(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
  }

  // ---- Drag-to-reorder ----
  function handleDragStart(e: React.DragEvent, i: number) {
    e.dataTransfer.setData("text/plain", String(i));
  }
  function handleDragOver(e: React.DragEvent, i: number) {
    e.preventDefault();
    setDragOverIdx(i);
  }
  function handleDragLeave() { setDragOverIdx(null); }
  function handleDrop(e: React.DragEvent, dropIdx: number) {
    e.preventDefault();
    setDragOverIdx(null);
    const srcIdx = Number(e.dataTransfer.getData("text/plain"));
    if (isNaN(srcIdx) || srcIdx === dropIdx) return;
    const arr = [...slides];
    const [removed] = arr.splice(srcIdx, 1);
    arr.splice(dropIdx, 0, removed);
    setSlides(arr);
    setIdx(dropIdx);
  }

  // ---- Templates ----
  function saveAsTemplate() {
    const updated = loadTemplates();
    updated.push(slides);
    saveTemplates(updated);
    setTemplates(updated);
  }

  function loadTemplate(t: SlideData[]) {
    setSlides(t.map(s => ({ ...s, id: genId() })));
    setIdx(0);
    setShowTemplatePicker(false);
  }

  function deleteTemplate(i: number) {
    const updated = loadTemplates();
    updated.splice(i, 1);
    saveTemplates(updated);
    setTemplates(updated);
  }

  // ---- Export ----
  function exportHtml() {
    const lines = slides.map((s, i) => {
      const pts = s.points.map(p => `      <li>${p}</li>`).join("\n");
      return `    <div class="slide">
      <h2>${s.title}</h2>
      <p class="detail">${s.detail}</p>
      <ul>${pts}</ul>
    </div>`;
    }).join("\n");
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>PROOF Use Cases</title><style>
body { font-family: system-ui, sans-serif; max-width: 800px; margin: auto; padding: 40px; background: #f8f9fa; }
.slide { background: #fff; border-radius: 12px; padding: 32px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,.1); break-inside: avoid; }
h2 { margin: 0 0 8px; font-size: 22px; }
.detail { color: #5f6368; line-height: 1.6; margin-bottom: 16px; }
ul { padding-left: 20px; }
li { margin-bottom: 4px; color: #3c4043; }
@media print { body { padding: 0; } .slide { box-shadow: none; border: 1px solid #ddd; } }
</style></head><body>${lines}</body></html>`;
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); }
  }

  function copyAsText() {
    const text = slides.map(s => `${s.title}\n${s.detail}\n${s.points.map(p => `  - ${p}`).join("\n")}`).join("\n\n---\n\n");
    navigator.clipboard.writeText(text).catch(() => {});
  }

  function exportPng() {
    const cur = slides[idx];
    if (!cur) return;
    const w = window.open("", "_blank");
    if (!w) return;
    const aspectLabel = curAspect.label.replace(":", "×");
    const bg = cur.color.replace("var(--gcp-", "").replace(")", "");
    const colorMap: Record<string, string> = { red: "#ea4335", orange: "#f9ab00", blue: "#1a73e8", green: "#1e8e3e", purple: "#9334e6", yellow: "#f9ab00", cyan: "#00bcd4", pink: "#e91e63", indigo: "#3f51b5" };
    const bgColor = colorMap[bg] || "#1a73e8";
    const pts = cur.points.map(p => `        <li style="margin-bottom:8px;display:flex;align-items:center;gap:8px"><span style="width:8px;height:8px;border-radius:50%;background:${bgColor};display:inline-block;flex-shrink:0"></span>${p}</li>`).join("\n");
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${cur.title}</title><style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Inter', system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f0f0f0; }
.card { width: 580px; background: #fff; border-radius: 20px; padding: 48px; box-shadow: 0 4px 24px rgba(0,0,0,.1); }
.icon { width: 48px; height: 48px; border-radius: 12px; background: ${bgColor}; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; }
h1 { font-size: 26px; font-weight: 800; margin-bottom: 10px; }
p { font-size: 14px; line-height: 1.7; color: #5f6368; margin-bottom: 24px; }
ul { list-style: none; display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; }
li { font-size: 13px; color: #3c4043; display: flex; align-items: center; gap: 8px; }
.footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #e8eaed; font-size: 11px; color: #9aa0a6; display: flex; justify-content: space-between; }
.badge { background: ${bgColor}15; color: ${bgColor}; font-weight: 600; font-size: 11px; padding: 3px 10px; border-radius: 12px; border: 1px solid ${bgColor}40; }
</style></head><body><div class="card"><div class="icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></div><h1>${cur.title}</h1><p>${cur.detail}</p><ul>${pts}</ul><div class="footer"><span class="badge">${aspectLabel}</span><span>PROOF · ${cur.title}</span></div></div></body></html>`;
    w.document.write(html);
    w.document.close();
    setTimeout(() => { w.print(); }, 500);
  }

  // ---- Inline editing helpers ----
  function updatePoint(sid: string, pidx: number, val: string) {
    setSlides(prev => prev.map(s => s.id === sid ? { ...s, points: s.points.map((p, i) => i === pidx ? val : p) } : s));
  }

  function addPoint(sid: string) {
    setSlides(prev => prev.map(s => s.id === sid ? { ...s, points: [...s.points, "New capability"] } : s));
  }

  function removePoint(sid: string, pidx: number) {
    setSlides(prev => prev.map(s => s.id === sid && s.points.length > 1 ? { ...s, points: s.points.filter((_, i) => i !== pidx) } : s));
  }

  // ---- Fullscreen ----
  if (fullscreen && slide) {
    const FsIcon = ICON_MAP[slide.icon];
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }} onClick={() => setFullscreen(false)}>
        <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 20, maxWidth: 700, width: "100%", padding: "48px 52px", position: "relative", boxShadow: "0 8px 40px rgba(0,0,0,.3)" }}>
          <button onClick={() => setFullscreen(false)} style={{ position: "absolute", top: 16, right: 16, width: 32, height: 32, border: "none", borderRadius: 8, background: "var(--gcp-grey-bg)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--gcp-text-secondary)" }}><X size={16} /></button>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 20 }}>
            <div style={{ width: 52, height: 52, background: slide.color, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <FsIcon size={26} color="white" />
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--gcp-text)", marginBottom: 8 }}>{slide.title}</h2>
              <p style={{ fontSize: 14, color: "var(--gcp-text-secondary)", lineHeight: 1.7, marginBottom: 20 }}>{slide.detail}</p>
              <ul style={{ padding: 0, margin: 0, listStyle: "none", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 20px" }}>
                {slide.points.map(p => (
                  <li key={p} style={{ fontSize: 13, color: "var(--gcp-text)", display: "flex", alignItems: "center", gap: 8 }}>
                    <CheckCircle2 size={14} color={slide.color} style={{ flexShrink: 0 }} />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--gcp-grey)", display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--gcp-text-secondary)" }}>
            <span style={{ background: slide.color + "20", color: slide.color, padding: "3px 10px", borderRadius: 12, fontWeight: 600 }}>{ASPECTS[aspect].label}</span>
            <span>PROOF · {slide.title}</span>
          </div>
        </div>
      </div>
    );
  }

  if (!slide) return null;

  return (
    <>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        <button onClick={addSlide} style={tbStyle} title="Add slide"><Plus size={14} /> Add</button>
        <div style={{ width: 1, height: 20, background: "var(--gcp-grey)", margin: "0 4px" }} />
        <button onClick={() => setEditing(!editing)} style={{ ...tbStyle, background: editing ? "var(--gcp-blue)" : "transparent", color: editing ? "#fff" : "var(--gcp-text-secondary)", borderColor: editing ? "var(--gcp-blue)" : "var(--gcp-grey)" }} title="Toggle edit"><Edit3 size={14} /> Edit</button>
        <div style={{ width: 1, height: 20, background: "var(--gcp-grey)", margin: "0 4px" }} />
        <button onClick={() => setFullscreen(true)} style={tbStyle} title="Fullscreen preview"><Maximize2 size={14} /></button>
        <select value={aspect} onChange={e => setAspect(Number(e.target.value))} style={{ fontSize: 11, padding: "4px 6px", border: "1px solid var(--gcp-grey)", borderRadius: 4, background: "transparent", color: "var(--gcp-text-secondary)", cursor: "pointer" }}>
          {ASPECTS.map((a, i) => <option key={i} value={i}>{a.label}</option>)}
        </select>
        <div style={{ width: 1, height: 20, background: "var(--gcp-grey)", margin: "0 4px" }} />
        <button onClick={exportHtml} style={tbStyle} title="Export as HTML (opens new tab)"><Download size={14} /> HTML</button>
        <button onClick={exportPng} style={tbStyle} title="Print slide as PNG (opens new tab → Ctrl+P / Cmd+P)"><Image size={14} /> PNG</button>
        <button onClick={copyAsText} style={tbStyle} title="Copy all slides as text"><Copy size={14} /></button>
        <div style={{ width: 1, height: 20, background: "var(--gcp-grey)", margin: "0 4px" }} />
        <button onClick={saveAsTemplate} style={tbStyle} title="Save current carousel as template"><Save size={14} /> Template</button>
        {templates.length > 0 && (
          <div style={{ position: "relative" }}>
            <button onClick={() => setShowTemplatePicker(!showTemplatePicker)} style={tbStyle} title="Load template"><RotateCw size={14} /> Load</button>
            {showTemplatePicker && (
              <div style={{ position: "absolute", top: "100%", left: 0, zIndex: 100, background: "#fff", border: "1px solid var(--gcp-grey)", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,.1)", minWidth: 200, padding: 8, marginTop: 4 }}>
                <div style={{ fontSize: 11, color: "var(--gcp-text-secondary)", padding: "4px 8px 8px", borderBottom: "1px solid var(--gcp-grey)", marginBottom: 4 }}>Saved Templates</div>
                {templates.map((t, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 8px", borderRadius: 4, cursor: "pointer", fontSize: 12, color: "var(--gcp-text)" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--gcp-grey-bg)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <span style={{ flex: 1 }} onClick={() => loadTemplate(t)}>{t.length} slides</span>
                    <button onClick={() => deleteTemplate(i)} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--gcp-red)", padding: 2 }}><Trash2 size={12} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main slide + filmstrip layout (three-panel style) */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Main preview */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 20, minHeight: 130 }}>
          <div style={{ width: 44, height: 44, background: slide.color, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: 0.9 }}>
            <Icon size={22} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            {editing ? (
              <input value={slide.title} onChange={e => updateSlide(slide.id, { title: e.target.value })}
                style={{ fontSize: 16, fontWeight: 700, color: "var(--gcp-text)", border: "1px solid var(--gcp-grey)", borderRadius: 4, padding: "4px 8px", width: "100%", marginBottom: 8, background: "transparent" }} />
            ) : (
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--gcp-text)", marginBottom: 4 }}>{slide.title}</h3>
            )}
            {editing ? (
              <textarea value={slide.detail} onChange={e => updateSlide(slide.id, { detail: e.target.value })}
                rows={2} style={{ fontSize: 13, color: "var(--gcp-text-secondary)", border: "1px solid var(--gcp-grey)", borderRadius: 4, padding: "4px 8px", width: "100%", marginBottom: 8, background: "transparent", resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }} />
            ) : (
              <p style={{ fontSize: 13, color: "var(--gcp-text-secondary)", lineHeight: 1.6, marginBottom: 12 }}>{slide.detail}</p>
            )}
            {editing ? (
              <div>
                {slide.points.map((p, pi) => (
                  <div key={pi} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <input value={p} onChange={e => updatePoint(slide.id, pi, e.target.value)}
                      style={{ flex: 1, fontSize: 12, color: "var(--gcp-text)", border: "1px solid var(--gcp-grey)", borderRadius: 4, padding: "3px 6px", background: "transparent" }} />
                    <button onClick={() => removePoint(slide.id, pi)} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--gcp-red)", padding: 2 }}><Trash2 size={12} /></button>
                  </div>
                ))}
                <button onClick={() => addPoint(slide.id)} style={{ fontSize: 11, border: "1px dashed var(--gcp-grey)", borderRadius: 4, padding: "3px 10px", background: "transparent", cursor: "pointer", color: "var(--gcp-text-secondary)", marginTop: 4 }}>+ Add point</button>
              </div>
            ) : (
              <ul style={{ padding: 0, margin: 0, listStyle: "none", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px 16px" }}>
                {slide.points.map(p => (
                  <li key={p} style={{ fontSize: 12, color: "var(--gcp-text-secondary)", display: "flex", alignItems: "center", gap: 6 }}>
                    <CheckCircle2 size={12} color={slide.color} style={{ flexShrink: 0 }} />
                    {p}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Filmstrip with drag-to-reorder */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, overflowX: "auto", padding: "4px 0" }}>
          {slides.map((s, i) => {
            const StripIcon = ICON_MAP[s.icon];
            const isActive = i === idx;
            const isDragOver = i === dragOverIdx;
            return (
              <div key={s.id}
                draggable
                onDragStart={e => handleDragStart(e, i)}
                onDragOver={e => handleDragOver(e, i)}
                onDragLeave={handleDragLeave}
                onDrop={e => handleDrop(e, i)}
                onClick={() => setIdx(i)}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 8, cursor: "grab",
                  border: isDragOver ? "2px dashed var(--gcp-blue)" : isActive ? `2px solid ${s.color}` : "2px solid transparent",
                  background: isActive ? s.color + "12" : "transparent", flexShrink: 0,
                  transition: "all 0.15s", userSelect: "none", fontSize: 11, color: "var(--gcp-text-secondary)"
                }}>
                <GripHorizontal size={12} style={{ opacity: 0.4, flexShrink: 0 }} />
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                <StripIcon size={12} style={{ flexShrink: 0 }} />
                <span style={{ whiteSpace: "nowrap", maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis" }}>{s.title}</span>
                {slides.length > 1 && (
                  <button onClick={e => { e.stopPropagation(); deleteSlide(s.id); }} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--gcp-red)", padding: 1, opacity: 0.5, flexShrink: 0, display: isActive ? "block" : "none" }}>
                    <X size={10} />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Nav controls */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <button onClick={() => setIdx(prev => (prev - 1 + total) % total)} style={navBtnStyle}>
            <ChevronLeft size={14} />
          </button>
          <div style={{ display: "flex", gap: 6 }}>
            {slides.map((s, i) => (
              <button key={s.id} onClick={() => setIdx(i)} style={{
                width: 8, height: 8, borderRadius: "50%", border: "none", cursor: "pointer",
                background: i === idx ? slide.color : "var(--gcp-grey)", padding: 0, transition: "background 0.2s"
              }} aria-label={`Slide ${i + 1}`} />
            ))}
          </div>
          <button onClick={() => setIdx(prev => (prev + 1) % total)} style={navBtnStyle}>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </>
  );
}

const tbStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: 4, padding: "4px 8px", fontSize: 11, border: "1px solid var(--gcp-grey)", borderRadius: 4, background: "transparent", cursor: "pointer", color: "var(--gcp-text-secondary)" };
const navBtnStyle: React.CSSProperties = { width: 28, height: 28, border: "1px solid var(--gcp-grey)", borderRadius: 6, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--gcp-text-secondary)" };

export default function About() {
  const features = [
    { icon: BarChart3, title: "Dashboard", desc: "Promotion readiness overview with per-environment pass rates, regression alerts, and version drift tracking." },
    { icon: Activity, title: "Run History", desc: "Full history of GitHub Actions test runs with filtering, side-panel detail, Slack sharing, and export." },
    { icon: GitCompare, title: "Regression Compare", desc: "Baseline vs candidate diff with per-test side panel, column filters, permalink sharing, and GitHub issue filing." },
    { icon: Bug, title: "Test Manager", desc: "CRUD for test cases with tabbed form (Basic Info, Docs, HTTP & Predicates), filmstrip visual comparison, bulk import/export, and AI generation." },
    { icon: Shield, title: "Security & DDoS", desc: "WAF validation, rate limiting, TLS negotiation, and DDoS mitigation test suites built into the test registry." },
    { icon: Globe, title: "Full Coverage", desc: "Geo-match, locale-split, caching, routing, and config test categories covering the full web application deployment surface." },
  ];

  const stack = [
    ["React 19 + Vite 7", "SPA with fast HMR"],
    ["Tailwind CSS 4 / GCP CSS vars", "Design tokens matching Google Cloud Console"],
    ["Google Charts", "Pass-rate and analytics charts"],
    ["Wouter", "Lightweight SPA routing"],
    ["localStorage", "Client-side persistence for test registry"],
    ["Lucide React", "Icon system"],
  ];

  const [showDocs, setShowDocs] = React.useState(false);

  return (
    <AppLayout>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* Hero */}
        <div className="gcp-card" style={{ padding: "32px 36px", marginBottom: 24, borderLeft: "4px solid var(--gcp-blue)", position: "relative", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 20 }}>
            <div style={{ width: 56, height: 56, background: "var(--gcp-blue)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Zap size={28} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--gcp-text)", marginBottom: 6, letterSpacing: "-0.5px" }}>PROOF</h1>
              <p style={{ fontSize: 14, color: "var(--gcp-text-secondary)", lineHeight: 1.6, maxWidth: 600 }}>
                <strong>Pipeline for Regression Observation and Output Framework</strong> — a web application regression testing platform
                for GitHub Actions. Observe pass rates, compare baseline vs candidate, manage test cases, and
                gate promotions with confidence.
              </p>
              <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["GHA Observability", "Regression Testing", "Promotion Gating", "Cross-Environment"].map(tag => (
                  <span key={tag} style={{ fontSize: 11, padding: "3px 10px", background: "var(--gcp-blue-bg)", color: "var(--gcp-blue)", borderRadius: 12, fontWeight: 600, border: "1px solid var(--gcp-blue)" }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Use Case Carousel */}
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: "var(--gcp-text)" }}>Use Cases</h2>
        <div className="gcp-card" style={{ padding: 24, marginBottom: 24, position: "relative", overflow: "hidden" }}>
          <CarouselSlides />
        </div>

        {/* Features grid */}
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: "var(--gcp-text)" }}>Platform Features</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16, marginBottom: 28 }}>
          {features.map(f => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="gcp-card" style={{ padding: 20, display: "flex", gap: 14 }}>
                <div style={{ width: 36, height: 36, background: "var(--gcp-blue-bg)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={18} color="var(--gcp-blue)" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, color: "var(--gcp-text)" }}>{f.title}</div>
                  <div style={{ fontSize: 12, color: "var(--gcp-text-secondary)", lineHeight: 1.5 }}>{f.desc}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tech stack */}
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: "var(--gcp-text)" }}>Tech Stack</h2>
        <div className="gcp-card" style={{ overflow: "hidden", marginBottom: 28 }}>
          <table className="gcp-table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>Technology</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {stack.map(([tech, role]) => (
                <tr key={tech}>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600 }}>{tech}</td>
                  <td style={{ color: "var(--gcp-text-secondary)", fontSize: 12 }}>{role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Project Documentation toggle */}
        <div style={{ marginBottom: 28 }}>
          <button onClick={() => setShowDocs(!showDocs)} className="gcp-card" style={{ width: "100%", padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, border: "none", cursor: "pointer", background: "var(--gcp-blue-bg)", fontSize: 14, fontWeight: 700, color: "var(--gcp-blue)" }}>
            <Book size={18} />
            <span style={{ flex: 1, textAlign: "left" }}>{showDocs ? "Hide Project Documentation" : "📖 View Project Documentation — how this app works"}</span>
            <ChevronDown size={16} style={{ transform: showDocs ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
          </button>

          {showDocs && (
            <div style={{ marginTop: 16 }}>

              {/* 1. Quick Start Guide */}
              <DocSection title="🚀 1. Quick Start — How to Use This App" defaultOpen>
                <p><strong>PROOF</strong> is a web-based observability dashboard for your GitHub Actions test pipeline. It runs entirely in your browser with pre-loaded seed data — no backend or API setup needed.</p>
                <ol style={{ paddingLeft: 18, margin: "8px 0" }}>
                  <li><strong>Open the Dashboard</strong> (<code>/</code>) — See pass-rate charts per environment, run frequency, recent alerts, and promotion status at a glance.</li>
                  <li><strong>Browse Runs</strong> (<code>/runs</code>) — Explore past test runs. Click any run to see individual test results and evidence.</li>
                  <li><strong>Compare a Promotion</strong> (<code>/compare</code>) — Pick a baseline vs candidate run. Review regressions, fixed tests, and approve or block the promotion.</li>
                  <li><strong>Manage Tests</strong> (<code>/tests</code>) — Create, edit, import, export, and organize test cases. Use bulk actions to update statuses or add to suites.</li>
                  <li><strong>Organize Suites</strong> (<code>/suites</code>) — Group test cases into suites with YAML export. Build a tree hierarchy for your test categories.</li>
                </ol>
              </DocSection>

              {/* 2. Page-by-Page Walkthrough */}
              <DocSection title="🗺️ 2. Page-by-Page Walkthrough — What Each Screen Does">
                <DocTable
                  headers={["Page", "Path", "What to do here"]}
                  rows={[
                    ["Dashboard", "/", "Monitor pass rates across environments. Check the Run Frequency chart to see test cadence. The Env Health card shows alerts. Use CTA stat cards to jump to runs, compare, or analytics."],
                    ["Runs", "/runs", "Filter runs by environment, network, or status via the FilterBar. Click a row for the side panel with full run details, test results, and evidence. Use the export/share buttons."],
                    ["Run Detail", "/runs/:id", "Drill into a specific run. See pass/fail breakdown per test. Click evidence rows to expand assertions. Use the panel to navigate to related analytics or compare views."],
                    ["Compare", "/compare", "Select baseline and candidate runs from the dropdowns. The diff table shows regressions, fixes, duration changes. Click a row for the side panel. Use column filters (status, env, duration). The green banner shows promotion readiness."],
                    ["Test Manager", "/tests", "Full CRUD for test cases. The table has search, column toggles, and bulk actions (delete, change status/priority, add to suite). Use the + button to add a case with the tabbed form. Import auto-detects JSON/YAML/JUnit XML. Use the Generate Wizard to AI-generate tests."],
                    ["Test Suites", "/suites", "Tree view of all suites. Click to edit suite metadata, manage test membership, and export as YAML. Use Add Tests modal to bulk-add from the full test list."],
                    ["Test Analytics", "/analytics", "Pass-rate trend chart and flakiness analysis for a specific test. Accepts <code>?testId=tc_N</code> or <code>?diffId=diff_N</code> params. CTA cards link to run history and comparisons."],
                    ["Test Doc", "/testdoc", "Three-column layout: top bar with test metadata, sidebar with related tests and changelog, main area for documentation. Good for reviewing test intent and history."],
                    ["Copilot", "/copilot", "AI chat with 5 built-in skills. Select a provider (Mock/OpenAI/WebLLM) in the config panel. Use skills to generate tests, write scripts, analyze results, explain diffs, or create suites. Chat history persists in localStorage."],
                    ["Status", "/status", "System health overview. See environment statuses, service uptime indicators, and recent incidents."],
                    ["Start Run", "/start", "Form to configure a new test run. Fill in target, environment, network, build info. Copy the command preview to trigger a run in your CI pipeline."],
                    ["Sharing", "/sharing", "Permalink viewer. Past a sharing link or ID to load a saved comparison or run view."],
                    ["CI Pipeline", "/ci-pipeline", "Architecture diagram of the GitHub Actions integration. Shows how test runs flow from PR → CI → Results → Dashboard."],
                  ]}
                />
              </DocSection>

              {/* 3. Daily Operator Workflows */}
              <DocSection title="🔄 3. Daily Operator Workflows — Common Tasks">
                <p><strong>Morning Check:</strong> Open Dashboard → check pass-rate trends. If an env is dipping, click the stat card to jump to Runs filtered by that env. Identify failing tests and investigate in Run Detail.</p>
                <p><strong>Promotion Review:</strong> Go to Compare → select the candidate run. Scan the diff table for regressions. Use column filters to isolate failed tests. If all clear, click "Approve Promotion". If blocked, file GitHub issues from the regression list.</p>
                <p><strong>Adding a Test Case:</strong> Go to Test Manager → click "+ New Test Case". Fill in the Basic Info tab (name, category, priority, severity). Switch to the HTTP tab to set URL, method, headers, and expected status. Add Predicates (response time, status code, header checks) in the Predicates tab. Review in Docs tab. Save.</p>
                <p><strong>Bulk Import:</strong> Go to Test Manager → click "Import". Drop a JSON, YAML, or JUnit XML file. The app auto-detects the format. Review the parsed tests and confirm. All imported cases appear in the table immediately.</p>
                <p><strong>Investigating a Regression:</strong> Find the regression in Compare → click the row to open the side panel. Click "View in Analytics" to see historical pass rate. Click "View in Run Detail" to see the specific failure evidence. File an issue from the side panel.</p>
                <p><strong>Using AI Copilot:</strong> Go to Copilot → select a skill (e.g. "Generate Tests"). Describe what you need. The AI returns structured test configs with a form. Fill in remaining fields and click "Confirm & Open in Test Manager" to save.</p>
              </DocSection>

              {/* 4. Understanding the Charts & Metrics */}
              <DocSection title="📈 4. Understanding the Charts & Metrics">
                <p><strong>Pass Rate by Environment</strong> (Dashboard) — Area chart showing daily pass rates for each env. A dip indicates regressions. Hover points to see exact values. Click a point to navigate to that run.</p>
                <p><strong>Aggregate by Day</strong> (Dashboard) — Grouped bar chart of pass/fail counts per day. Use this to spot volume trends — are more tests running? Are failure days clustered?</p>
                <p><strong>Run Frequency</strong> (Dashboard) — Shows runs per day with env-distributed bar segments. The "Totals by Env" column shows env-level run counts. Gaps (days without runs) are shown in red below the chart. Avg interval hours help you understand test cadence.</p>
                <p><strong>Test Analytics Charts</strong> — Per-test pass rate line chart + flakiness score (how often a test flips between pass/fail). A flaky test needs investigation even if its pass rate is high.</p>
                <p><strong>Stat Cards</strong> — Clickable cards that act as shortcuts. "Pass Rate" goes to Dashboard, "Runs This Week" goes to Runs, "Active Regressions" goes to Compare filtered, etc. Each card shows a sub-label with more context.</p>
              </DocSection>

              {/* 5. Working with Test Cases */}
              <DocSection title="🧪 5. Working with Test Cases — CRUD, Bulk, Import/Export">
                <p><strong>Test Case Fields:</strong></p>
                <ul style={{ paddingLeft: 18, margin: "8px 0" }}>
                  <li><strong>Basic Info</strong> — name, description, category (caching, routing, security, etc.), priority (P0-P3), severity, status (active/draft/archived), owner, tags, automated flag</li>
                  <li><strong>HTTP Config</strong> — URL, method (GET/POST/PUT/DELETE), headers, request body, expected status code</li>
                  <li><strong>Predicates</strong> — Validation rules: status code equals, response time less than, header contains, body matches regex, etc. Each has type, field, expected value, operator, and description</li>
                  <li><strong>Filmstrip</strong> — Visual comparison snapshots: enabled/disabled, similarity threshold (0-1)</li>
                  <li><strong>Docs</strong> — Free-text documentation, preconditions, expected behavior</li>
                  <li><strong>Changelog</strong> — Auto-generated version history with author, timestamp, and change summary</li>
                </ul>
                <p><strong>Bulk Actions:</strong> Select multiple tests via checkboxes → choose action from the toolbar: delete, set status (active/draft/archived), set priority (P0-P3), add to suite (opens suite picker modal).</p>
                <p><strong>Import Formats:</strong> JSON array of test case objects, YAML with test case definitions (auto-detected by extension or content inspection), JUnit XML (parses test case results as test case definitions).</p>
                <p><strong>Export Formats:</strong> JSON (full test case objects), CSV (flat table with key fields), JUnit XML (test suite structure).</p>
                <p><strong>Suites:</strong> Create a suite with a name, description, and optional parent (for tree nesting). Add tests to suites via the Add Tests modal. Export suites as YAML for CI integration.</p>
              </DocSection>

              {/* 6. Filtering & Navigation Tips */}
              <DocSection title="🔍 6. Filtering & Navigation Tips">
                <p><strong>Every table has:</strong> Search bar (filters by name/description), column visibility toggle (eye icon), sortable columns (click header to sort).</p>
                <p><strong>Compare page:</strong> "Regressions only" checkbox filters the table to show only regressions. Column dropdowns let you filter by specific status/environment/duration ranges.</p>
                <p><strong>Runs page:</strong> FilterBar at top lets you filter by environment, network (production/staging), and status. The date range picker filters runs by timeframe.</p>
                <p><strong>Side panels:</strong> Click any row in Compare or Runs to open a detail panel. The panel has tabs (details, evidence, related) and action buttons (view analytics, file issue, share).</p>
                <p><strong>Keyboard shortcuts:</strong> <kbd>Ctrl+K</kbd> / <kbd>Cmd+K</kbd> opens the Command Palette for quick navigation between pages.</p>
                <p><strong>SPA vs Full Nav:</strong> The app uses wouter for client-side routing. Links within the app use SPA navigation (instant, no page reload). The <code>navTo()</code> function triggers a full page reload — used for external navigation or reset operations.</p>
              </DocSection>

              {/* 7. Environment Configuration */}
              <DocSection title="🌐 7. Environments — What They Are & How to Configure">
                <p>The app ships with 4 environment targets: <strong>Prod/Production</strong>, <strong>Prod/Staging</strong>, <strong>UAT/Production</strong>, <strong>UAT/Staging</strong>. Each environment has:</p>
                <ul style={{ paddingLeft: 18, margin: "8px 0" }}>
                  <li><strong>Base URL</strong> — The endpoint used for test requests (e.g. <code>https://prod.example.com</code>)</li>
                  <li><strong>Target</strong> — Logical grouping (Prod, UAT)</li>
                  <li><strong>Network</strong> — Network tier (production, staging)</li>
                  <li><strong>IP Addresses</strong> — Optional list of IPs for network-level filtering</li>
                </ul>
                <p>Edit environments in the Dashboard via the <strong>Env Config</strong> panel (gear icon). Changes persist in localStorage. Reset to defaults with the "Reset" button in the panel.</p>
                <p>Each environment gets its own pass-rate tracking in charts. Compare behavior across envs to catch staging-only regressions before they reach production.</p>
              </DocSection>

              {/* 8. AI Copilot — Complete Usage Guide */}
              <DocSection title="🤖 8. AI Copilot — Complete Usage Guide">
                <p><strong>Providers:</strong></p>
                <ul style={{ paddingLeft: 18, margin: "8px 0" }}>
                  <li><strong>Mock</strong> — Built-in, works offline. Returns pre-programmed responses. Best for testing the UI flow without API keys. Set <code>provider: "mock"</code> in config.</li>
                  <li><strong>OpenAI</strong> — Connects to any OpenAI-compatible API (OpenAI, Azure, local LLMs). Requires <code>apiKey</code> and optional <code>apiUrl</code> (defaults to OpenAI). Configure model, temperature, max tokens.</li>
                  <li><strong>WebLLM</strong> — Runs a model in-browser via WebGPU. Requires Chrome with WebGPU support and the <code>@mlc-ai/web-llm</code> package. Shows "not available" message when unsupported.</li>
                </ul>
                <p><strong>5 Built-in Skills:</strong></p>
                <ul style={{ paddingLeft: 18, margin: "8px 0" }}>
                  <li><strong>Generate Tests</strong> — "Create a cache validation test for CDN edge." Returns a structured config with predicates, filmstrip, and changelog. Review the card and confirm to save in Test Manager.</li>
                  <li><strong>Generate Script</strong> — "Write a YAML test script for a geo-routing check." Returns a portable YAML test definition.</li>
                  <li><strong>Analyze Results</strong> — "My pass rate dropped in Prod/Staging." Returns regression analysis with root cause suggestions.</li>
                  <li><strong>Explain Diff</strong> — "Compare the last two production runs." Returns a structured comparison of regressions, fixes, and duration changes.</li>
                  <li><strong>Generate Suite</strong> — "Create a security test suite." Returns a suite configuration with integrations and test selection criteria.</li>
                </ul>
                <p><strong>Chat Tips:</strong> The AI remembers the last 50 messages in the conversation. Use clear, specific descriptions. You can include category, priority, status codes, and test names in your request — the AI extracts these automatically. Switch skills mid-conversation to change the AI's behavior.</p>
                <p><strong>Config Panel:</strong> Access via the gear icon on the Copilot page. Change provider, enter API key, set model/temperature/max tokens. Config persists in localStorage.</p>
              </DocSection>

              {/* 9. Data Lifecycle & Storage */}
              <DocSection title="💾 9. Data Lifecycle — What Gets Saved & How to Reset">
                <p><strong>All data lives in your browser's localStorage.</strong> There is no server backend. Data persists across page refreshes and browser restarts. Clearing browser storage or using incognito with a fresh session will reset all data to defaults.</p>
                <DocTable
                  headers={["Storage Key", "What it stores"]}
                  rows={[
                    ["aware_test_cases_v2", "All test cases (CRUD operations)"],
                    ["aware_test_suites_v2", "Test suites tree structure"],
                    ["aware_promotion_decisions", "Promotion approve/block records per run"],
                    ["proof_env_configs", "Environment targets and IP configs"],
                    ["aware_copilot_chat", "Copilot chat message history"],
                    ["aware_pending_test_config", "In-flight test config being confirmed in Copilot"],
                    ["aware_carousel_templates", "Saved carousel slide templates (About page)"],
                  ]}
                />
                <p><strong>Reset:</strong> Use the "Reset All Data" option in the Dashboard to clear test cases, suites, and promotion decisions and reload seed data. Individual resets are available for env configs and chat history.</p>
                <p><strong>Seed Data:</strong> The app ships with {RUNS.length} runs, {DIFF_ROWS.length} diff rows, 25 test cases, and 8 suites. These are defined in <code>lib/runs.ts</code>, <code>lib/testCases.ts</code>, and <code>lib/testSuites.ts</code>. Modify these files to customize the seed set.</p>
              </DocSection>

              {/* 10. Troubleshooting & FAQ */}
              <DocSection title="❓ 10. Troubleshooting & FAQ">
                <p><strong>Q: My changes disappeared after refresh.</strong><br />A: localStorage only persists on the same browser/device. If you cleared site data or switched browsers, data resets. Export your test cases before clearing storage.</p>
                <p><strong>Q: The Copilot says "API Error 401".</strong><br />A: Your OpenAI API key is invalid or missing. Go to the Copilot config panel and set a valid key. Or switch to Mock provider for offline use.</p>
                <p><strong>Q: Charts show no data.</strong><br />A: The seed data includes runs from specific dates. If you're viewing outside that date range, use the time frame selector on the chart. If all data was cleared, perform a reset from the Dashboard.</p>
                <p><strong>Q: I accidentally deleted a test case.</strong><br />A: There's no undo. Export your test cases regularly via the Export button in Test Manager as a backup.</p>
                <p><strong>Q: How do I add real GitHub Actions data?</strong><br />A: The app is designed to work with mock data out of the box. To connect real data, replace the <code>RUNS</code>, <code>DIFF_ROWS</code>, and store functions in <code>lib/</code> with API calls to your CI system. The data layer is fully abstracted behind the <code>@/lib/data</code> barrel.</p>
                <p><strong>Q: The Compare page shows no runs in the dropdown.</strong><br />A: You need at least 2 runs to compare. The seed data has {RUNS.length} runs. If empty, reset data from the Dashboard.</p>
                <p><strong>Q: WebLLM shows "Not Available".</strong><br />A: WebLLM requires Chrome with WebGPU support. Check <code>chrome://gpu</code> for WebGPU availability. The <code>@mlc-ai/web-llm</code> package must be installed. Use OpenAI or Mock as alternatives.</p>
              </DocSection>

              {/* 11. Architecture */}
              <DocSection title="🏗️ 11. Architecture — How Files Are Organized">
                <p>The app lives in <code style={{ fontSize: 11, background: "var(--gcp-grey-bg)", padding: "1px 5px", borderRadius: 3 }}>artifacts/aware-app/src/</code>. Everything is split into three folders:</p>
                <ul style={{ paddingLeft: 18, margin: "8px 0" }}>
                  <li><strong><code>lib/</code></strong> — data layer: types, store, seed data, helpers</li>
                  <li><strong><code>pages/</code></strong> — one file per route (Dashboard, Runs, Compare, etc.)</li>
                  <li><strong><code>components/</code></strong> — reusable UI pieces: <code>aware/</code> for app-specific, <code>ui/</code> for shadcn</li>
                </ul>
                <p><strong>Core rule:</strong> Pages import from <code>@/lib/data</code> (a barrel file). Never import directly from <code>lib/</code> sub-modules.</p>
              </DocSection>

              {/* 12. Data Flow */}
              <DocSection title="🔄 12. Data Flow — How Changes Propagate">
                <p><strong>Page → lib/data → store → localStorage</strong></p>
                <p>Every page calls functions from <code>@/lib/data</code> to read or write data. For example:</p>
                <ul style={{ paddingLeft: 18, margin: "8px 0" }}>
                  <li><code>getTestCases()</code> — returns all test cases from the store</li>
                  <li><code>createTestCase(data)</code> — adds a new test case, saves to localStorage</li>
                  <li><code>getTestResultsForRun(runId)</code> — generates mock test results for a run</li>
                  <li><code>getRunById(id)</code> — looks up a single run</li>
                </ul>
                <p>When data changes, the store calls <code>_notify()</code> which triggers listeners, so any component using <code>useTestData()</code> re-renders automatically.</p>
              </DocSection>

              {/* 13. Development */}
              <DocSection title="🧑‍💻 13. Development — How to Contribute">
                <p><strong>Commands:</strong></p>
                <ul style={{ paddingLeft: 18, margin: "8px 0" }}>
                  <li><code>cd artifacts/aware-app</code></li>
                  <li><code>pnpm install</code> — install dependencies</li>
                  <li><code>pnpm dev</code> — start dev server at <code>:5173</code></li>
                  <li><code>pnpm build</code> — production build to <code>dist/public/</code></li>
                  <li><code>pnpm run typecheck</code> — TypeScript check (must pass before committing)</li>
                </ul>
                <p><strong>How to add a new page:</strong></p>
                <ol style={{ paddingLeft: 18, margin: "8px 0" }}>
                  <li>Create a file in <code>pages/</code> (e.g. <code>MyNewPage.tsx</code>)</li>
                  <li>Import <code>AppLayout</code> from <code>@/components/aware/AppLayout</code></li>
                  <li>Wrap your content in <code>{'<AppLayout activeHref="/my-path">'}</code></li>
                  <li>Add a route in <code>App.tsx</code>: <code>{'<Route path="/my-path" component={MyNewPage} />'}</code></li>
                  <li>Add a nav item in <code>AppLayout.tsx</code> (the <code>NAV_ITEMS</code> array)</li>
                </ol>
                <p><strong>Design Rules:</strong></p>
                <ul style={{ paddingLeft: 18, margin: "8px 0" }}>
                  <li>All pages use inline <code>{'style={{}}'}</code> — NOT Tailwind classes</li>
                  <li>CSS variables like <code>var(--gcp-blue)</code> are defined in <code>_group.css</code></li>
                  <li>No Playwright test scripts — all <code>scriptPath</code> fields use <code>.yaml</code></li>
                  <li>Use wouter's <code>useLocation()</code> for SPA navigation</li>
                  <li>Charts use Google Charts (wrappers in <code>GoogleCharts.tsx</code>)</li>
                  <li>Typecheck must pass before committing: <code>pnpm run typecheck</code></li>
                </ul>
              </DocSection>

            </div>
          )}
        </div>

        {/* CTA */}
        <div className="gcp-card" style={{ padding: 24, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Ready to explore?</div>
            <div style={{ fontSize: 12, color: "var(--gcp-text-secondary)" }}>Start with the Dashboard for a pass-rate summary, or dive into the Test Manager to manage your suite.</div>
          </div>
          <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", background: "var(--gcp-blue)", color: "white", borderRadius: 4, fontWeight: 600, fontSize: 13, textDecoration: "none" }}>
              <BarChart3 size={14} /> Dashboard
            </Link>
            <Link href="/tests" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", border: "1px solid var(--gcp-blue)", color: "var(--gcp-blue)", borderRadius: 4, fontWeight: 600, fontSize: 13, textDecoration: "none", background: "var(--gcp-blue-bg)" }}>
              <Bug size={14} /> Test Manager
            </Link>
          </div>
        </div>

        <div style={{ marginTop: 20, fontSize: 11, color: "var(--gcp-text-secondary)", textAlign: "center" }}>
          PROOF — Pipeline for Regression Observation and Output Framework · v2.0.0 · GHA Observability Platform
        </div>
      </div>
    </AppLayout>
  );
}
