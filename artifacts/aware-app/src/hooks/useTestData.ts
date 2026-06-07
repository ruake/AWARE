import React from "react";
import { getTestCases, getTestSuites, subscribeToTestCases, subscribeToTestSuites } from "@/lib/data";
import type { TestCase, TestSuite } from "@/lib/types";

export function useTestData() {
  const [tcs, setTcs] = React.useState<TestCase[]>(() => getTestCases());
  const [suites, setSuites] = React.useState<TestSuite[]>(() => getTestSuites());
  React.useEffect(() => {
    const u1 = subscribeToTestCases(() => setTcs(getTestCases()));
    const u2 = subscribeToTestSuites(() => setSuites(getTestSuites()));
    return () => { u1(); u2(); };
  }, []);
  return { tcs, suites };
}
