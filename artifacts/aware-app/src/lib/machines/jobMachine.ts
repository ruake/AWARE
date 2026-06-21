import { StateMachine } from '../stateMachine';
import type { JobStatus } from '../types';

type JobEvent = 'start' | 'complete' | 'fail' | 'cancel' | 'reset';

export function createJobMachine(initialState: JobStatus = 'pending'): StateMachine<JobStatus, JobEvent> {
  return new StateMachine<JobStatus, JobEvent>({
    initial: initialState,
    transitions: [
      { from: 'pending',   event: 'start',    to: 'running'   },
      { from: 'pending',   event: 'cancel',   to: 'cancelled' },
      { from: 'running',   event: 'complete', to: 'completed' },
      { from: 'running',   event: 'fail',     to: 'failed'    },
      { from: 'running',   event: 'cancel',   to: 'cancelled' },
      { from: ['failed', 'cancelled'], event: 'reset', to: 'pending' },
    ],
  });
}
