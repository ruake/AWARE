import type { TestSuite, SuiteTreeNode } from '@/lib/types';
import { fetchJson } from '@/lib/dataFetcher';
import { _notifyTS } from '@/lib/store';

let _suites: TestSuite[] = [];
let _loaded = false;

export async function loadTestSuites(): Promise<void> {
  if (_loaded) return;
  try {
    _suites = await fetchJson<TestSuite[]>('/data/test-suites.json');
  } catch {
    _suites = [];
  }
  _loaded = true;
  _notifyTS();
}

export function getTestSuites(): TestSuite[] {
  return _suites;
}

export function getTestSuiteById(id: string): TestSuite | undefined {
  return _suites.find(s => s.id === id);
}

export function buildSuiteTree(): SuiteTreeNode[] {
  const children = new Map<string | null, TestSuite[]>();
  for (const suite of _suites) {
    const p = suite.parentId ?? '__root__';
    if (!children.has(p)) children.set(p, []);
    children.get(p)!.push(suite);
  }

  function build(parentId: string | null, depth: number): SuiteTreeNode[] {
    const key = parentId ?? '__root__';
    const suites = children.get(key) ?? [];
    return suites.map(suite => ({
      suite,
      depth,
      children: build(suite.id, depth + 1),
    }));
  }

  return build(null, 0);
}
