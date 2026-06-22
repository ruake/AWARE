import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as runs from '../runs';
import * as runsLoader from '../runsLoader';
import { fetchJson } from '../dataFetcher';

declare global {
  var mockResults: Record<string, any[]>;
}

vi.mock('../runsLoader', () => ({
  getCachedResults: (runId: string) => {
    return (globalThis as any).mockResults?.[runId] || [];
  },
  loadResultsForRun: vi.fn(),
  loadAllResults: vi.fn(),
  getTestDetailsAsync: vi.fn(),
}));

const { computeDiffRows, getRunById, getRunIndex, loadRuns } = runs;

vi.mock('../dataFetcher', () => ({
  fetchJson: vi.fn(),
  dataUrl: vi.fn(p => p),
  isRunArray: vi.fn(() => true),
}));

vi.mock('../eventBus', () => ({
  bus: {
    emit: vi.fn(),
  },
}));

describe('runs.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.mockResults = {};
  });

  describe('getRunIndex & getRunById', () => {
    it('should find run by id and index', async () => {
      const mockRuns = [
        { id: 'run1', started: '2023-01-01T00:00:00Z', env: 'QA', status: 'PASS', passPct: 100, failures: 0, durationMs: 1000 },
        { id: 'run2', started: '2023-01-02T00:00:00Z', env: 'PROD', status: 'FAIL', passPct: 50, failures: 1, durationMs: 2000 },
      ];
      vi.mocked(fetchJson).mockResolvedValueOnce(mockRuns);
      await loadRuns();

      expect(getRunById('run1')).toEqual(mockRuns[0]);
      expect(getRunIndex('run1')).toBe(0);
      expect(getRunById('run2')).toEqual(mockRuns[1]);
      expect(getRunIndex('run2')).toBe(1);
      expect(getRunById('nonexistent')).toBeUndefined();
      expect(getRunIndex('nonexistent')).toBe(-1);
    });
  });

  describe('computeDiffRows', () => {
    it('should return empty array when both runs are empty', () => {
      globalThis.mockResults = { base: [], cand: [] };
      expect(computeDiffRows('base', 'cand')).toEqual([]);
    });

    it('should detect regressions (PASS -> FAIL)', () => {
      globalThis.mockResults = {
        base: [{ id: '1', testCaseId: '1', runId: 'base', name: 'Test 1', status: 'PASS', duration: 100, category: 'A', suite: 'S', evidence: {} as any, filmstrip: [] }],
        cand: [{ id: '2', testCaseId: '1', runId: 'cand', name: 'Test 1', status: 'FAIL', duration: 110, category: 'A', suite: 'S', evidence: {} as any, filmstrip: [] }]
      };
      
      // Clear memo cache
      (computeDiffRows as any).clear();

      const diff = computeDiffRows('base', 'cand');
      expect(diff).toHaveLength(1);
      expect(diff[0].state).toBe('regression');
      expect(diff[0].name).toBe('Test 1');
    });

    it('should detect fixed tests (FAIL -> PASS)', () => {
      globalThis.mockResults = {
        base: [{ id: '1', testCaseId: '1', runId: 'base', name: 'Test 1', status: 'FAIL', duration: 100, category: 'A', suite: 'S', evidence: {} as any, filmstrip: [] }],
        cand: [{ id: '2', testCaseId: '1', runId: 'cand', name: 'Test 1', status: 'PASS', duration: 110, category: 'A', suite: 'S', evidence: {} as any, filmstrip: [] }]
      };
      (computeDiffRows as any).clear();

      const diff = computeDiffRows('base', 'cand');
      expect(diff[0].state).toBe('fixed');
    });

    it('should detect duration changes (> 25%)', () => {
      globalThis.mockResults = {
        base: [{ id: '1', testCaseId: '1', runId: 'base', name: 'Test 1', status: 'PASS', duration: 100, category: 'A', suite: 'S', evidence: {} as any, filmstrip: [] }],
        cand: [{ id: '2', testCaseId: '1', runId: 'cand', name: 'Test 1', status: 'PASS', duration: 130, category: 'A', suite: 'S', evidence: {} as any, filmstrip: [] }]
      };
      (computeDiffRows as any).clear();

      const diff = computeDiffRows('base', 'cand');
      expect(diff[0].state).toBe('duration');
    });

    it('should mark as unchanged when status and duration (<= 25%) are similar', () => {
      globalThis.mockResults = {
        base: [{ id: '1', testCaseId: '1', runId: 'base', name: 'Test 1', status: 'PASS', duration: 100, category: 'A', suite: 'S', evidence: {} as any, filmstrip: [] }],
        cand: [{ id: '2', testCaseId: '1', runId: 'cand', name: 'Test 1', status: 'PASS', duration: 110, category: 'A', suite: 'S', evidence: {} as any, filmstrip: [] }]
      };
      (computeDiffRows as any).clear();

      const diff = computeDiffRows('base', 'cand');
      expect(diff[0].state).toBe('unchanged');
    });

    it('should handle new tests (only in candidate)', () => {
      globalThis.mockResults = {
        base: [],
        cand: [{ id: '2', testCaseId: '1', runId: 'cand', name: 'New Test', status: 'PASS', duration: 100, category: 'B', suite: 'S', evidence: {} as any, filmstrip: [] }]
      };
      (computeDiffRows as any).clear();

      const diff = computeDiffRows('base', 'cand');
      expect(diff).toHaveLength(1);
      expect(diff[0].name).toBe('New Test');
      expect(diff[0].baseStatus).toBe('FAIL'); // Default when missing
      expect(diff[0].state).toBe('fixed'); // FAIL -> PASS is "fixed"
    });

    it('should handle removed tests (only in base)', () => {
      globalThis.mockResults = {
        base: [{ id: '1', testCaseId: '1', runId: 'base', name: 'Old Test', status: 'PASS', duration: 100, category: 'B', suite: 'S', evidence: {} as any, filmstrip: [] }],
        cand: []
      };
      (computeDiffRows as any).clear();

      const diff = computeDiffRows('base', 'cand');
      expect(diff).toHaveLength(1);
      expect(diff[0].name).toBe('Old Test');
      expect(diff[0].candStatus).toBe('FAIL'); // Default when missing
      expect(diff[0].state).toBe('regression'); // PASS -> FAIL is "regression"
    });
  });
});
