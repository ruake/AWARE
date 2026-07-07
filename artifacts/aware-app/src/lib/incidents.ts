import { logWarn } from "./ai/debugLogger";

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "major" | "minor" | "info";
  status: "investigating" | "identified" | "monitoring" | "resolved";
  affected: string[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  updates: IncidentUpdate[];
}

export interface IncidentUpdate {
  timestamp: string;
  message: string;
  status: Incident["status"];
}

const STORAGE_KEY = "aware-incidents-v1";

const SEED_INCIDENTS: Incident[] = [
  {
    id: "inc-001",
    title: "Elevated error rates on PROD staging edge",
    description: "PROD staging environment is returning 5xx errors on ~12% of requests across multiple edge servers. Investigating root cause.",
    severity: "major",
    status: "identified",
    affected: ["prod_staging"],
    createdAt: "2026-06-23T14:30:00Z",
    updatedAt: "2026-06-23T16:15:00Z",
    updates: [
      {
        timestamp: "2026-06-23T14:30:00Z",
        message: "Alert triggered: PROD staging pass rate dropped below 90%. Investigating.",
        status: "investigating",
      },
      {
        timestamp: "2026-06-23T15:10:00Z",
        message: "Identified a recent property version rollback as the likely cause. Rolling forward to the previous stable version.",
        status: "identified",
      },
      {
        timestamp: "2026-06-23T16:15:00Z",
        message: "Property version rolled back. Error rates recovering. Monitoring for the next 30 minutes.",
        status: "monitoring",
      },
    ],
  },
  {
    id: "inc-002",
    title: "Intermittent TCP timeouts on UAT production",
    description: "UAT production environment experiencing intermittent TCP connection timeouts affecting origin fetch operations.",
    severity: "minor",
    status: "monitoring",
    affected: ["uat_prod"],
    createdAt: "2026-06-22T09:00:00Z",
    updatedAt: "2026-06-22T11:45:00Z",
    updates: [
      {
        timestamp: "2026-06-22T09:00:00Z",
        message: "Intermittent timeouts reported from UAT production edge servers. Investigating origin connectivity.",
        status: "investigating",
      },
      {
        timestamp: "2026-06-22T10:30:00Z",
        message: "Root cause identified: upstream origin provider is experiencing elevated latency in the us-east region.",
        status: "identified",
      },
      {
        timestamp: "2026-06-22T11:45:00Z",
        message: "Origin provider has mitigated the issue. Timeouts have subsided. Continuing to monitor.",
        status: "monitoring",
      },
    ],
  },
  {
    id: "inc-003",
    title: "DNS resolution failure for QA staging CDN hostname",
    description: "QA staging CDN hostname temporarily unresolvable due to DNS propagation delay after a CNAME update.",
    severity: "critical",
    status: "resolved",
    affected: ["qa_staging"],
    createdAt: "2026-06-20T07:00:00Z",
    updatedAt: "2026-06-20T08:30:00Z",
    resolvedAt: "2026-06-20T08:30:00Z",
    updates: [
      {
        timestamp: "2026-06-20T07:00:00Z",
        message: "QA staging CDN hostname returning SERVFAIL. All tests on qa_staging failing.",
        status: "investigating",
      },
      {
        timestamp: "2026-06-20T07:35:00Z",
        message: "CNAME record updated 15 minutes prior to incident. Waiting for DNS propagation across all edge DNS servers.",
        status: "identified",
      },
      {
        timestamp: "2026-06-20T08:00:00Z",
        message: "DNS propagation complete in most regions. Pass rates recovering. Monitoring remaining edge DNS servers.",
        status: "monitoring",
      },
      {
        timestamp: "2026-06-20T08:30:00Z",
        message: "DNS fully propagated across all edge DNS servers. QA staging fully operational.",
        status: "resolved",
      },
    ],
  },
  {
    id: "inc-004",
    title: "Scheduled maintenance: PROD edge certificate rotation",
    description: "Planned SSL/TLS certificate rotation for PROD production edge servers. Expected brief interruption during rotation window.",
    severity: "info",
    status: "resolved",
    affected: ["prod_prod"],
    createdAt: "2026-06-18T22:00:00Z",
    updatedAt: "2026-06-18T22:45:00Z",
    resolvedAt: "2026-06-18T22:45:00Z",
    updates: [
      {
        timestamp: "2026-06-18T22:00:00Z",
        message: "Certificate rotation started for PROD production edge servers.",
        status: "identified",
      },
      {
        timestamp: "2026-06-18T22:45:00Z",
        message: "Certificate rotation completed successfully. All PROD production edge servers serving new certificates.",
        status: "resolved",
      },
    ],
  },
];

function loadFromStorage(): Incident[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as Incident[];
    }
  } catch {
    /* ignore corrupt storage */
  }
  return [];
}

function saveToStorage(data: Incident[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* storage full — ignore */
  }
}

let _incidents: Incident[] = loadFromStorage();
if (_incidents.length === 0) {
  _incidents = SEED_INCIDENTS;
  saveToStorage(_incidents);
}
let _incidentsSnapshot: Incident[] = [..._incidents];
const _listeners = new Set<() => void>();

function notify(): void {
  _listeners.forEach((cb) => cb());
}

function updateSnapshot(): void {
  _incidentsSnapshot = [..._incidents];
}

export function subscribeToIncidents(cb: () => void): () => void {
  _listeners.add(cb);
  return () => _listeners.delete(cb);
}

export function getIncidents(): Incident[] {
  return _incidentsSnapshot;
}

export function getActiveIncidents(): Incident[] {
  return _incidentsSnapshot.filter((i) => i.status !== "resolved");
}

export function getIncidentById(id: string): Incident | undefined {
  return _incidentsSnapshot.find((i) => i.id === id);
}

export function resolveIncident(id: string): void {
  const idx = _incidents.findIndex((i) => i.id === id);
  if (idx === -1) return;
  const now = new Date().toISOString();
  _incidents[idx] = {
    ..._incidents[idx],
    status: "resolved",
    resolvedAt: now,
    updatedAt: now,
  };
  saveToStorage(_incidents);
  updateSnapshot();
  notify();
}

export function addUpdate(id: string, message: string, status: Incident["status"]): void {
  const idx = _incidents.findIndex((i) => i.id === id);
  if (idx === -1) return;
  const now = new Date().toISOString();
  const update: IncidentUpdate = { timestamp: now, message, status };
  _incidents[idx] = {
    ..._incidents[idx],
    status,
    updatedAt: now,
    updates: [..._incidents[idx].updates, update],
  };
  saveToStorage(_incidents);
  updateSnapshot();
  notify();
}

export function resetIncidents(): void {
  _incidents = SEED_INCIDENTS.map((i) => ({
    ...i,
    updates: [...i.updates],
    affected: [...i.affected],
  }));
  saveToStorage(_incidents);
  updateSnapshot();
  notify();
}
