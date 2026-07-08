const TIMEOUT_MS = 10_000;

export interface DataLoadResult {
  success: boolean;
  timedOut: boolean;
  failed: string[];
}

export async function loadAllData(): Promise<DataLoadResult> {
  const loaders = [
    import('./runsLoader').then(m => m.loadRuns()),
    import('./testSuites').then(m => m.loadTestSuites()),
    import('./testCases').then(m => m.loadTestCases()),
    import('./promotions').then(m => m.loadPromotions()),
    import('./schedulerStatus').then(m => m.loadSchedulerStatus()),
    import('./testDiscovery').then(m => m.loadTestDiscovery()),
  ];

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('TIMEOUT')), TIMEOUT_MS)
  );

  const results = await Promise.allSettled(
    loaders.map(p => Promise.race([p, timeout]))
  );

  const failed: string[] = [];
  const names = ['runsLoader', 'testSuites', 'testCases', 'promotions', 'schedulerStatus', 'testDiscovery'];

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.status === 'rejected') {
      if (r.reason?.message === 'TIMEOUT') {
        return { success: false, timedOut: true, failed };
      }
      failed.push(names[i]);
    }
  }

  return { success: failed.length === 0, timedOut: false, failed };
}
