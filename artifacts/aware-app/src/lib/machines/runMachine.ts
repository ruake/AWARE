import { StateMachine } from '../stateMachine';
import type { RunStatus } from '../types';

type RunEvent = 'start' | 'pass' | 'fail' | 'partial' | 'error' | 'markFlaky';

export function createRunMachine(initialState: RunStatus = 'PENDING'): StateMachine<RunStatus, RunEvent> {
  return new StateMachine<RunStatus, RunEvent>({
    initial: initialState,
    transitions: [
      { from: 'PENDING', event: 'start', to: 'RUNNING' },
      { from: 'RUNNING', event: 'pass', to: 'PASS' },
      { from: 'RUNNING', event: 'fail', to: 'FAIL' },
      { from: 'RUNNING', event: 'partial', to: 'PARTIAL' },
      { from: 'RUNNING', event: 'error', to: 'ERROR' },
      { from: 'FAIL', event: 'markFlaky', to: 'FLAKY' },
    ],
  });
}
