export class InvalidTransitionError extends Error {
  constructor(from: string, event: string) {
    super(`No transition from '${from}' on event '${event}'`);
    this.name = 'InvalidTransitionError';
  }
}

export interface Transition<S extends string, E extends string> {
  from: S | S[];
  event: E;
  to: S;
  guard?: (context: Record<string, unknown>) => boolean;
  onEnter?: (context: Record<string, unknown>) => void;
}

export interface StateMachineConfig<S extends string, E extends string> {
  initial: S;
  transitions: Transition<S, E>[];
  onTransition?: (from: S, event: E, to: S) => void;
}

export class StateMachine<S extends string, E extends string> {
  private _state: S;
  private _config: StateMachineConfig<S, E>;
  private _listeners: Set<(state: S) => void> = new Set();

  constructor(config: StateMachineConfig<S, E>) {
    this._config = config;
    this._state = config.initial;
  }

  get state(): S {
    return this._state;
  }

  can(event: E, context: Record<string, unknown> = {}): boolean {
    const transition = this._config.transitions.find(t => {
      const froms = Array.isArray(t.from) ? t.from : [t.from];
      return froms.includes(this._state) && t.event === event;
    });

    if (!transition) return false;
    if (transition.guard && !transition.guard(context)) return false;

    return true;
  }

  send(event: E, context: Record<string, unknown> = {}): S {
    const transition = this._config.transitions.find(t => {
      const froms = Array.isArray(t.from) ? t.from : [t.from];
      return froms.includes(this._state) && t.event === event;
    });

    if (!transition || (transition.guard && !transition.guard(context))) {
      throw new InvalidTransitionError(this._state, event);
    }

    const oldState = this._state;
    this._state = transition.to;

    if (transition.onEnter) {
      transition.onEnter(context);
    }

    if (this._config.onTransition) {
      this._config.onTransition(oldState, event, this._state);
    }

    this._notify();
    return this._state;
  }

  matches(state: S | S[]): boolean {
    const states = Array.isArray(state) ? state : [state];
    return states.includes(this._state);
  }

  subscribe(cb: (state: S) => void): () => void {
    this._listeners.add(cb);
    return () => this._listeners.delete(cb);
  }

  private _notify() {
    this._listeners.forEach(cb => cb(this._state));
  }
}
