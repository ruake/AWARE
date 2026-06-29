import React from "react";
import {
  getTestCases,
  getTestSuites,
  subscribeToTestCases,
  subscribeToTestSuites,
} from "@/lib/data";

export function useTestData() {
  const tcs = React.useSyncExternalStore(subscribeToTestCases, getTestCases);
  const suites = React.useSyncExternalStore(subscribeToTestSuites, getTestSuites);
  return { tcs, suites };
}
