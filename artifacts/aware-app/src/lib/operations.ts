import type { TestCase, TestSuite } from './types';

const TC_STORAGE_KEY = 'aware_test_cases_v2';
const TS_STORAGE_KEY = 'aware_test_suites_v2';

export function getLocalTestCases(): Record<string, TestCase> {
  try {
    return JSON.parse(localStorage.getItem(TC_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

export function saveLocalTestCase(tc: TestCase): void {
  const all = getLocalTestCases();
  all[tc.id] = tc;
  localStorage.setItem(TC_STORAGE_KEY, JSON.stringify(all));
}

export function deleteLocalTestCase(id: string): void {
  const all = getLocalTestCases();
  delete all[id];
  localStorage.setItem(TC_STORAGE_KEY, JSON.stringify(all));
}

export function getLocalTestSuites(): Record<string, TestSuite> {
  try {
    return JSON.parse(localStorage.getItem(TS_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

export function saveLocalTestSuite(ts: TestSuite): void {
  const all = getLocalTestSuites();
  all[ts.id] = ts;
  localStorage.setItem(TS_STORAGE_KEY, JSON.stringify(all));
}

export function deleteLocalTestSuite(id: string): void {
  const all = getLocalTestSuites();
  delete all[id];
  localStorage.setItem(TS_STORAGE_KEY, JSON.stringify(all));
}
