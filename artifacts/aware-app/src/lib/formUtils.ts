import type { TestCase } from "./types";

export interface TestCaseDraft {
  name: string;
  description?: string;
  testType: "web" | "api" | "edgeworker" | "transaction";
  category: string;
  priority: "P0" | "P1" | "P2" | "P3";
  severity: "critical" | "major" | "minor" | "trivial";
  status: "active" | "disabled" | "deprecated";
  tags?: string[];
  owner: string;
  automated: boolean;
  scriptPath?: string;
  preconditions?: string;
  expectedBehavior?: string;
  expectedStatus?: number;
  requestHeaders?: Record<string, string>;
  cookies?: Record<string, string>;
  captureResponseHeaders?: string[];
  filmstrip?: {
    enabled: boolean;
    threshold?: number;
    region?: string;
  };
  predicates?: Array<{
    type: string;
    field: string;
    expected: string;
    operator: string;
    description: string;
  }>;
}

export const REQUIRED_FIELDS: Record<string, string[]> = {
  web: ["name", "category", "owner", "expectedStatus", "description"],
  api: ["name", "category", "owner", "expectedStatus", "description"],
  edgeworker: ["name", "category", "owner", "expectedStatus", "description", "scriptPath"],
  transaction: ["name", "category", "owner", "description"],
};

export function testCaseToDraft(tc: Partial<TestCase>): TestCaseDraft {
  return {
    name: tc.name || "",
    description: tc.description || "",
    testType: tc.testType || "web",
    category: tc.category || "geo-match",
    priority: tc.priority || "P2",
    severity: tc.severity || "minor",
    status: tc.status || "active",
    tags: tc.tags || [],
    owner: tc.owner || "",
    automated: tc.automated ?? true,
    scriptPath: tc.scriptPath || "",
    preconditions: tc.preconditions || "",
    expectedBehavior: tc.expectedBehavior || "",
    expectedStatus: tc.expectedStatus ?? 200,
    requestHeaders: tc.requestHeaders || {},
    cookies: tc.cookies || {},
    captureResponseHeaders: tc.captureResponseHeaders || [],
    filmstrip: tc.filmstrip || { enabled: false, threshold: 0.99 },
    predicates: tc.predicates || [],
  };
}

export function draftToTestCaseData(draft: TestCaseDraft): Omit<TestCase, "id" | "createdAt" | "updatedAt"> {
  return {
    name: draft.name || "",
    description: draft.description || "",
    testType: draft.testType || "web",
    category: draft.category || "geo-match",
    priority: draft.priority || "P2",
    severity: draft.severity || "minor",
    status: draft.status || "active",
    tags: draft.tags || [],
    owner: draft.owner || "",
    automated: draft.automated ?? true,
    scriptPath: draft.scriptPath || "",
    preconditions: draft.preconditions || "",
    expectedBehavior: draft.expectedBehavior || "",
    expectedStatus: draft.expectedStatus ?? 200,
    requestHeaders: draft.requestHeaders || {},
    cookies: draft.cookies || {},
    captureResponseHeaders: draft.captureResponseHeaders || [],
    filmstrip: draft.filmstrip ? {
      enabled: draft.filmstrip.enabled,
      threshold: draft.filmstrip.threshold ?? 0.99,
      region: draft.filmstrip.region,
    } : { enabled: false, threshold: 0.99 },
    predicates: (draft.predicates || []).map(p => ({
      id: `pred_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type: p.type as "statusCode" | "headerEquals" | "headerContains" | "responseTime" | "cookieEquals",
      field: p.field || "",
      expected: p.expected || "",
      operator: p.operator as "equals" | "contains" | "gt" | "lt" | "exists",
      description: p.description || "",
    })),
    suiteIds: [],
    relatedTestIds: [],
    documentation: "",
    config: {},
    assertions: [],
    version: 1,
    changelog: [],
  };
}

export function formatTestCaseDraftAsYaml(draft: TestCaseDraft): string {
  const lines: string[] = [];
  lines.push("---");
  lines.push(`name: "${draft.name}"`);
  lines.push(`testType: ${draft.testType}`);
  lines.push(`category: ${draft.category}`);
  lines.push(`priority: ${draft.priority}`);
  lines.push(`severity: ${draft.severity}`);
  lines.push(`status: ${draft.status}`);
  lines.push(`automated: ${draft.automated}`);
  lines.push(`owner: "${draft.owner}"`);
  if (draft.scriptPath) lines.push(`scriptPath: "${draft.scriptPath}"`);
  lines.push(`expectedStatus: ${draft.expectedStatus ?? 200}`);
  if (draft.description) lines.push(`description: "${draft.description}"`);

  const headers = draft.requestHeaders ?? {};
  if (Object.keys(headers).length > 0) {
    lines.push("requestHeaders:");
    Object.entries(headers).forEach(([k, v]) => {
      if (k) lines.push(`  "${k}": "${v}"`);
    });
  }

  const cookies = draft.cookies ?? {};
  if (Object.keys(cookies).length > 0) {
    lines.push("cookies:");
    Object.entries(cookies).forEach(([k, v]) => {
      if (k) lines.push(`  "${k}": "${v}"`);
    });
  }

  if (draft.captureResponseHeaders && draft.captureResponseHeaders.length > 0) {
    lines.push("captureResponseHeaders:");
    draft.captureResponseHeaders.forEach(h => lines.push(`  - "${h}"`));
  }

  if (draft.filmstrip?.enabled) {
    lines.push("filmstrip:");
    lines.push(`  enabled: true`);
    lines.push(`  threshold: ${draft.filmstrip.threshold ?? 0.99}`);
    if (draft.filmstrip.region) lines.push(`  region: ${draft.filmstrip.region}`);
  }

  if (draft.predicates && draft.predicates.length > 0) {
    lines.push("predicates:");
    draft.predicates.forEach(p => {
      lines.push(`  - type: ${p.type}`);
      lines.push(`    field: "${p.field}"`);
      lines.push(`    expected: "${p.expected}"`);
      lines.push(`    operator: ${p.operator}`);
      if (p.description) lines.push(`    description: "${p.description}"`);
    });
  }

  return lines.join("\n");
}

export function parseYamlToDraft(yamlStr: string): TestCaseDraft | null {
  try {
    const yamlModule = (window as unknown as Record<string, unknown>).yaml as {
      load: (s: string) => Record<string, unknown>;
    } || { load: () => ({}) };
    const parsed = typeof yamlModule.load === "function" ? yamlModule.load(yamlStr) : JSON.parse(yamlStr);
    if (!parsed || typeof parsed !== "object") return null;
    const p = parsed as Record<string, unknown>;
    return {
      name: String(p.name || ""),
      description: String(p.description || ""),
      testType: (p.testType as TestCaseDraft["testType"]) || "web",
      category: String(p.category || "geo-match"),
      priority: (p.priority as TestCaseDraft["priority"]) || "P2",
      severity: (p.severity as TestCaseDraft["severity"]) || "minor",
      status: (p.status as TestCaseDraft["status"]) || "active",
      tags: Array.isArray(p.tags) ? p.tags.map(String) : [],
      owner: String(p.owner || ""),
      automated: p.automated !== false,
      scriptPath: p.scriptPath ? String(p.scriptPath) : "",
      preconditions: String(p.preconditions || ""),
      expectedBehavior: String(p.expectedBehavior || ""),
      expectedStatus: Number(p.expectedStatus ?? 200),
      requestHeaders: (p.requestHeaders as Record<string, string>) || {},
      cookies: (p.cookies as Record<string, string>) || {},
      captureResponseHeaders: Array.isArray(p.captureResponseHeaders) ? p.captureResponseHeaders.map(String) : [],
      filmstrip: p.filmstrip ? {
        enabled: (p.filmstrip as Record<string, unknown>).enabled === true,
        threshold: Number((p.filmstrip as Record<string, unknown>).threshold ?? 0.99),
        region: String((p.filmstrip as Record<string, unknown>).region || "full"),
      } : { enabled: false, threshold: 0.99 },
      predicates: Array.isArray(p.predicates) ? p.predicates.map((pred: unknown) => {
        const pp = pred as Record<string, unknown>;
        return {
          type: String(pp.type || "statusCode"),
          field: String(pp.field || ""),
          expected: String(pp.expected || ""),
          operator: String(pp.operator || "equals"),
          description: String(pp.description || ""),
        };
      }) : [],
    };
  } catch {
    return null;
  }
}
