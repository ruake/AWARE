import { useEffect, useState, useSyncExternalStore } from 'react';
import { subscribeToTestCases, subscribeToTestSuites } from '@/lib/store';
import { getTestCases, loadTestCases } from '@/lib/testCases';
import { getTestSuites, loadTestSuites } from '@/lib/testSuites';

export function useTestCase(id: string) {
  const tc = useSyncExternalStore(subscribeToTestCases, () => getTestCases());
  useEffect(() => { loadTestCases(); }, []);
  return tc[id];
}

export function useTestSuites() {
  const suites = useSyncExternalStore(subscribeToTestSuites, () => getTestSuites());
  useEffect(() => { loadTestSuites(); }, []);
  return suites;
}

export function useAllTestCases() {
  const tcs = useSyncExternalStore(subscribeToTestCases, () => getTestCases());
  useEffect(() => { loadTestCases(); }, []);
  return tcs;
}
