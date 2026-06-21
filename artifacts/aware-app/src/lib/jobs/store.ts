import type { Job, JobStatus, JobType, JobSummary } from "../types";

const STORAGE_KEY = "aware-jobs";

function load(): Job[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(jobs: Job[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
  } catch {
    /* storage full — silently drop */
  }
}

let _cache: Job[] | null = null;

function getJobs(): Job[] {
  if (_cache === null) _cache = load();
  return _cache;
}

function persist() {
  save(getJobs());
}

function dropCache() {
  _cache = null;
}

export function getAllJobs(): Job[] {
  return [...getJobs()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function getJobById(id: string): Job | undefined {
  return getJobs().find((j) => j.id === id);
}

export function getJobsByStatus(status: JobStatus): Job[] {
  return getJobs().filter((j) => j.status === status);
}

export function getJobsByType(type: JobType): Job[] {
  return getJobs().filter((j) => j.type === type);
}

export function getRecentJobs(limit = 20): Job[] {
  return getAllJobs().slice(0, limit);
}

export function createJob(job: Omit<Job, "createdAt">): Job {
  const full: Job = { ...job, createdAt: new Date().toISOString() };
  const jobs = getJobs();
  jobs.unshift(full);
  persist();
  return full;
}

export function updateJob(id: string, updates: Partial<Job>): Job | undefined {
  const jobs = getJobs();
  const idx = jobs.findIndex((j) => j.id === id);
  if (idx === -1) return;
  jobs[idx] = { ...jobs[idx], ...updates };
  persist();
  return jobs[idx];
}

export function deleteJob(id: string) {
  const jobs = getJobs();
  const idx = jobs.findIndex((j) => j.id === id);
  if (idx !== -1) {
    jobs.splice(idx, 1);
    persist();
  }
}

export function clearCompletedJobs() {
  const jobs = getJobs().filter((j) => j.status === "running" || j.status === "pending");
  _cache = jobs;
  persist();
}

export function getJobSummary(): JobSummary {
  const jobs = getJobs();
  const byStatus: Record<JobStatus, number> = {
    pending: 0,
    running: 0,
    completed: 0,
    failed: 0,
    cancelled: 0,
  };
  const byType: Record<JobType, number> = {
    "test-run": 0,
    discovery: 0,
    sync: 0,
    build: 0,
    custom: 0,
  };
  let totalDuration = 0;
  let completedCount = 0;
  let passedCount = 0;
  let latest: Job | null = null;

  for (const j of jobs) {
    byStatus[j.status] = (byStatus[j.status] || 0) + 1;
    byType[j.type] = (byType[j.type] || 0) + 1;
    if (j.duration) {
      totalDuration += j.duration;
      completedCount++;
    }
    if (j.status === "completed") passedCount++;
    if (!latest || new Date(j.createdAt) > new Date(latest.createdAt)) latest = j;
  }

  return {
    total: jobs.length,
    byStatus,
    byType,
    lastRun: latest,
    avgDuration: completedCount > 0 ? Math.round(totalDuration / completedCount) : 0,
    passRate: jobs.length > 0 ? Math.round((passedCount / jobs.length) * 100) : 0,
  };
}

export function subscribeToJobs(callback: () => void) {
  const interval = setInterval(() => {
    dropCache();
    callback();
  }, 2000);
  return () => clearInterval(interval);
}

export function generateJobId(): string {
  return `job_${Date.now().toString(36)}_${crypto.randomUUID().slice(0, 7)}`;
}
