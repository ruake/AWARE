import yaml from "js-yaml";
import type { TestCase, TestAssertion, TestConfig, TransactionStep } from "./types";

export type ExportFormat = "json" | "yaml" | "xml";

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

// ── Export ──────────────────────────────────────────────────────────────────

export function exportAsJSON(tests: TestCase[]): string {
  return JSON.stringify(tests, null, 2);
}

export function exportAsYAML(tests: TestCase[]): string {
  return yaml.dump(tests, { lineWidth: 120, noRefs: true });
}

function escapeXML(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function objToXML(obj: unknown, indent: string): string {
  if (obj === null || obj === undefined) return "";
  if (Array.isArray(obj)) {
    return obj.map(item => {
      if (typeof item === "object" && item !== null) {
        return `${indent}<item>\n${objToXML(item, indent + "  ")}${indent}</item>\n`;
      }
      return `${indent}<item>${escapeXML(String(item))}</item>\n`;
    }).join("");
  }
  if (typeof obj === "object") {
    return Object.entries(obj as Record<string, unknown>).map(([k, v]) => {
      if (v === null || v === undefined) return "";
      if (Array.isArray(v)) {
        return `${indent}<${k}>\n${objToXML(v, indent + "  ")}${indent}</${k}>\n`;
      }
      if (typeof v === "object") {
        return `${indent}<${k}>\n${objToXML(v, indent + "  ")}${indent}</${k}>\n`;
      }
      return `${indent}<${k}>${escapeXML(String(v))}</${k}>\n`;
    }).join("");
  }
  return escapeXML(String(obj));
}

export function exportAsXML(tests: TestCase[]): string {
  const body = tests.map(t =>
    `  <testCase>\n${objToXML(t, "    ")}  </testCase>\n`
  ).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<testCases>\n${body}</testCases>`;
}

export function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportAndDownload(tests: TestCase[], format: ExportFormat) {
  const ts = new Date().toISOString().slice(0, 10);
  if (format === "json") {
    downloadFile(exportAsJSON(tests), `aware-tests-${ts}.json`, "application/json");
  } else if (format === "yaml") {
    downloadFile(exportAsYAML(tests), `aware-tests-${ts}.yaml`, "text/yaml");
  } else {
    downloadFile(exportAsXML(tests), `aware-tests-${ts}.xml`, "application/xml");
  }
}

// ── Import / Parse ──────────────────────────────────────────────────────────

function coerceTestCase(raw: Record<string, unknown>): TestCase {
  const now = new Date().toISOString();
  return {
    id: String(raw.id ?? generateId()),
    name: String(raw.name ?? "Imported Test"),
    description: String(raw.description ?? ""),
    testType: (raw.testType as TestCase["testType"]) ?? "web",
    category: String(raw.category ?? "url-health"),
    priority: (raw.priority as TestCase["priority"]) ?? "P2",
    severity: (raw.severity as TestCase["severity"]) ?? "minor",
    status: (raw.status as TestCase["status"]) ?? "active",
    tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
    owner: String(raw.owner ?? ""),
    suiteIds: Array.isArray(raw.suiteIds) ? raw.suiteIds.map(String) : [],
    automated: Boolean(raw.automated ?? true),
    scriptPath: String(raw.scriptPath ?? ""),
    preconditions: String(raw.preconditions ?? ""),
    expectedBehavior: String(raw.expectedBehavior ?? ""),
    documentation: String(raw.documentation ?? ""),
    relatedTestIds: Array.isArray(raw.relatedTestIds) ? raw.relatedTestIds.map(String) : [],
    config: (raw.config as TestConfig) ?? {},
    assertions: Array.isArray(raw.assertions)
      ? (raw.assertions as TestAssertion[])
      : [],
    version: Number(raw.version ?? 1),
    changelog: Array.isArray(raw.changelog) ? raw.changelog as TestCase["changelog"] : [],
    createdAt: String(raw.createdAt ?? now),
    updatedAt: now,
  };
}

export interface ImportResult {
  tests: TestCase[];
  errors: string[];
  format: ExportFormat;
}

export function importFromJSON(text: string): ImportResult {
  const errors: string[] = [];
  try {
    const parsed = JSON.parse(text);
    const arr: unknown[] = Array.isArray(parsed) ? parsed : [parsed];
    const tests: TestCase[] = [];
    arr.forEach((item, i) => {
      try {
        if (typeof item === "object" && item !== null) {
          tests.push(coerceTestCase(item as Record<string, unknown>));
        } else {
          errors.push(`Item ${i}: not an object`);
        }
      } catch (e) {
        errors.push(`Item ${i}: ${String(e)}`);
      }
    });
    return { tests, errors, format: "json" };
  } catch (e) {
    return { tests: [], errors: [`JSON parse error: ${String(e)}`], format: "json" };
  }
}

export function importFromYAML(text: string): ImportResult {
  const errors: string[] = [];
  try {
    const parsed = yaml.load(text);
    const arr: unknown[] = Array.isArray(parsed) ? parsed : [parsed];
    const tests: TestCase[] = [];
    arr.forEach((item, i) => {
      try {
        if (typeof item === "object" && item !== null) {
          tests.push(coerceTestCase(item as Record<string, unknown>));
        } else {
          errors.push(`Item ${i}: not an object`);
        }
      } catch (e) {
        errors.push(`Item ${i}: ${String(e)}`);
      }
    });
    return { tests, errors, format: "yaml" };
  } catch (e) {
    return { tests: [], errors: [`YAML parse error: ${String(e)}`], format: "yaml" };
  }
}

function xmlNodeToObj(node: Element): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const child of Array.from(node.children)) {
    const key = child.tagName;
    const grandChildren = Array.from(child.children);
    if (child.tagName === "item") continue;
    if (grandChildren.length === 0) {
      const txt = child.textContent ?? "";
      const num = Number(txt);
      result[key] = txt === "true" ? true : txt === "false" ? false : !isNaN(num) && txt !== "" ? num : txt;
    } else if (grandChildren.every(c => c.tagName === "item")) {
      result[key] = grandChildren.map(c => {
        const grandGrand = Array.from(c.children);
        if (grandGrand.length === 0) {
          const txt = c.textContent ?? "";
          const num = Number(txt);
          return txt === "true" ? true : txt === "false" ? false : !isNaN(num) && txt !== "" ? num : txt;
        }
        return xmlNodeToObj(c);
      });
    } else {
      result[key] = xmlNodeToObj(child);
    }
  }
  return result;
}

export function importFromXML(text: string): ImportResult {
  const errors: string[] = [];
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "application/xml");
    const parseErr = doc.querySelector("parsererror");
    if (parseErr) {
      return { tests: [], errors: [`XML parse error: ${parseErr.textContent}`], format: "xml" };
    }
    const nodes = Array.from(doc.querySelectorAll("testCase"));
    if (nodes.length === 0) {
      return { tests: [], errors: ["No <testCase> elements found in XML"], format: "xml" };
    }
    const tests: TestCase[] = [];
    nodes.forEach((node, i) => {
      try {
        tests.push(coerceTestCase(xmlNodeToObj(node)));
      } catch (e) {
        errors.push(`Item ${i}: ${String(e)}`);
      }
    });
    return { tests, errors, format: "xml" };
  } catch (e) {
    return { tests: [], errors: [`XML error: ${String(e)}`], format: "xml" };
  }
}

export function detectFormat(text: string): ExportFormat {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return "json";
  if (trimmed.startsWith("<?xml") || trimmed.startsWith("<testCase")) return "xml";
  return "yaml";
}

export function importAuto(text: string): ImportResult {
  const fmt = detectFormat(text);
  if (fmt === "json") return importFromJSON(text);
  if (fmt === "xml") return importFromXML(text);
  return importFromYAML(text);
}
