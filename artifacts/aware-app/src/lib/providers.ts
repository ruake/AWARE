import type { TestResult } from "./types";

export interface ProviderTestResult {
  name: string;
  status: "PASS" | "FAIL";
  duration: number;
  category: string;
  suite: string;
  error?: string;
}

export interface ProviderRunSummary {
  passed: number;
  failed: number;
  total: number;
  passPct: number;
  durationMs: number;
  durationStr: string;
  status: string;
}

export interface TestRunProvider {
  name: string;
  parseSummary(raw: unknown): ProviderRunSummary;
  parseResults(raw: unknown): ProviderTestResult[];
  /** Extract filmstrip screenshots from a test result's attachments. Returns data URIs. */
  extractFilmstrip?(result: ProviderTestResult, raw: unknown, attachmentsDir?: string): { id: string; label: string; dataUri: string }[];
}

export function getTestRunProvider(name: string): TestRunProvider | undefined {
  return providers[name];
}

const providers: Record<string, TestRunProvider> = {};

export function registerProvider(p: TestRunProvider): void {
  providers[p.name] = p;
}

registerProvider({
  name: "playwright",
  parseSummary(raw: any) {
    let passed = 0;
    let failed = 0;
    let totalDuration = 0;
    let testCount = 0;

    function walk(suite: any) {
      if (suite.specs) {
        for (const spec of suite.specs) {
          for (const t of spec.tests) {
            testCount++;
            const ok = t.results?.some((r: any) => r.status === "passed");
            if (ok) passed++;
            else failed++;
            for (const r of t.results || []) {
              totalDuration += r.duration || 0;
            }
          }
        }
      }
      if (suite.suites) {
        for (const s of suite.suites) walk(s);
      }
    }
    for (const suite of (raw as any).suites || []) walk(suite);

    const total = passed + failed;
    const passPct = total > 0 ? Math.round((passed / total) * 100) : 0;
    const durationSec = Math.round(totalDuration / 1000);
    const minutes = Math.floor(durationSec / 60);
    const seconds = durationSec % 60;
    let status = "PASS";
    if (failed > 0 && passed > 0) status = failed > passed / 2 ? "FAIL" : "FLAKY";
    else if (failed > 0) status = "FAIL";
    return { passed, failed, total, passPct, durationMs: totalDuration, durationStr: `${minutes}m ${seconds.toString().padStart(2, "0")}s`, status };
  },

  parseResults(raw: any) {
    const results: ProviderTestResult[] = [];
    const catMap: Record<string, string> = { smoke:"Smoke", login:"Security", checkboxes:"Functional", dropdown:"Functional", dynamic:"Performance", alerts:"Security", frames:"Functional", windows:"Functional" };
    function walk(suite: any) {
      const sn = (suite.title || "").toLowerCase();
      let cat = "General";
      for (const [kw, c] of Object.entries(catMap)) { if (sn.includes(kw)) { cat = c; break; } }
      if (suite.specs) {
        for (const spec of suite.specs) {
          const name = spec.title || "unknown";
          for (const t of spec.tests) {
            const ok = t.results?.some((r: any) => r.status === "passed");
            const last = t.results?.[t.results.length - 1];
            let error = "";
            if (!ok && last) {
              const err = last.error || (last.errors && last.errors[0]);
              if (err) error = err.message || String(err);
            }
            results.push({ name, status: ok ? "PASS" : "FAIL", duration: last?.duration || 0, category: cat, suite: suite.title || "", ...(error ? { error } : {}) });
          }
        }
      }
      if (suite.suites) { for (const s of suite.suites) walk(s); }
    }
    for (const suite of (raw as any).suites || []) walk(suite);
    return results;
  },

  extractFilmstrip(result, raw: any, attachmentsDir?: string) {
    const frames: { id: string; label: string; dataUri: string }[] = [];
    const spec = specForTestName(raw, result.name);
    if (!spec) return frames;
    for (const t of spec.tests || []) {
      for (const tr of t.results || []) {
        for (const att of tr.attachments || []) {
          if (att.contentType?.startsWith("image/png") || att.contentType?.startsWith("image/jpeg")) {
            if (att.body) {
              frames.push({ id: `ss_${frames.length}`, label: att.name || `screenshot-${frames.length}`, dataUri: `data:${att.contentType};base64,${att.body}` });
            } else if (att.path && attachmentsDir) {
              try {
                const fs = require("fs");
                const p = require("path");
                const fullPath = p.resolve(attachmentsDir, att.path);
                if (fs.existsSync(fullPath)) {
                  const buf = fs.readFileSync(fullPath);
                  frames.push({ id: `ss_${frames.length}`, label: att.name || `screenshot-${frames.length}`, dataUri: `data:${att.contentType || "image/png"};base64,${buf.toString("base64")}` });
                }
              } catch {}
            }
          }
        }
      }
    }
    return frames;
  },
});

function specForTestName(raw: any, testName: string): any {
  function walk(suite: any): any {
    if (suite.specs) {
      for (const spec of suite.specs) {
        if (spec.title === testName) return spec;
        for (const t of spec.tests || []) {
          if (spec.title === testName || t.title === testName) return spec;
        }
      }
    }
    if (suite.suites) { for (const s of suite.suites) { const found = walk(s); if (found) return found; } }
    return null;
  }
  for (const suite of (raw as any).suites || []) { const found = walk(suite); if (found) return found; }
  return null;
}
