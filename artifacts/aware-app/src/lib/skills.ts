export interface Skill {
  id: string;
  name: string;
  description?: string;
}

export const SKILLS: Skill[] = [
  { id: 'anomaly', name: 'Anomaly Detection' },
  { id: 'trend', name: 'Trend Analysis' },
  { id: 'compare', name: 'Run Comparison' },
  { id: 'flakiness', name: 'Flakiness Analysis', description: 'Identify flaky tests across recent runs' },
  { id: 'regression', name: 'Regression Finder', description: 'Detect performance or pass-rate regressions' },
  { id: 'coverage', name: 'Coverage Gap Analysis', description: 'Find untested edge cases and coverage gaps' },
  { id: 'suite_optimizer', name: 'Suite Optimizer', description: 'Suggest suite grouping and parallelization' },
  { id: 'promotion_gate', name: 'Promotion Gate Check', description: 'Evaluate if promotion criteria are met' },
  { id: 'env_health', name: 'Environment Health', description: 'Assess environment stability across dimensions' },
  { id: 'duration_drift', name: 'Duration Drift Monitor', description: 'Track test duration changes over time' },
  { id: 'category_summary', name: 'Category Summary', description: 'Summarize pass/fail by test category' },
  { id: 'root_cause', name: 'Root Cause Suggester', description: 'Suggest likely root causes for failures' },
];

export function getSkill(id: string): Skill | undefined {
  return SKILLS.find(s => s.id === id);
}
