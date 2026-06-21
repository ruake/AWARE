import { describe, it, expect, vi } from 'vitest';
import { StateMachine, InvalidTransitionError } from '../stateMachine';

describe('StateMachine', () => {
  type State = 'idle' | 'running' | 'paused' | 'stopped';
  type Event = 'start' | 'pause' | 'resume' | 'stop' | 'reset';

  const config = {
    initial: 'idle' as State,
    transitions: [
      { from: 'idle', event: 'start', to: 'running' as State },
      { from: 'running', event: 'pause', to: 'paused' as State },
      { from: 'paused', event: 'resume', to: 'running' as State },
      { from: ['running', 'paused'], event: 'stop', to: 'stopped' as State },
      { from: 'stopped', event: 'reset', to: 'idle' as State },
    ],
  };

  it('should start with initial state', () => {
    const sm = new StateMachine<State, Event>(config);
    expect(sm.state).toBe('idle');
  });

  it('should transition to next state on valid event', () => {
    const sm = new StateMachine<State, Event>(config);
    sm.send('start');
    expect(sm.state).toBe('running');
  });

  it('should support array of from states', () => {
    const sm = new StateMachine<State, Event>(config);
    sm.send('start');
    sm.send('stop');
    expect(sm.state).toBe('stopped');

    const sm2 = new StateMachine<State, Event>(config);
    sm2.send('start');
    sm2.send('pause');
    sm2.send('stop');
    expect(sm2.state).toBe('stopped');
  });

  it('should throw InvalidTransitionError on invalid transition', () => {
    const sm = new StateMachine<State, Event>(config);
    expect(() => sm.send('pause')).toThrow(InvalidTransitionError);
    expect(() => sm.send('pause')).toThrow("No transition from 'idle' on event 'pause'");
  });

  it('should return true/false for can()', () => {
    const sm = new StateMachine<State, Event>(config);
    expect(sm.can('start')).toBe(true);
    expect(sm.can('pause')).toBe(false);
  });

  it('should return true/false for matches()', () => {
    const sm = new StateMachine<State, Event>(config);
    expect(sm.matches('idle')).toBe(true);
    expect(sm.matches(['idle', 'running'])).toBe(true);
    expect(sm.matches('running')).toBe(false);
  });

  it('should notify subscribers on transition', () => {
    const sm = new StateMachine<State, Event>(config);
    const cb = vi.fn();
    const unsubscribe = sm.subscribe(cb);

    sm.send('start');
    expect(cb).toHaveBeenCalledWith('running');

    unsubscribe();
    sm.send('pause');
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('should respect guards', () => {
    const sm = new StateMachine<State, Event>({
      initial: 'idle',
      transitions: [
        { 
          from: 'idle', 
          event: 'start', 
          to: 'running',
          guard: (ctx) => !!ctx.allowed 
        }
      ]
    });

    expect(sm.can('start')).toBe(false);
    expect(() => sm.send('start')).toThrow(InvalidTransitionError);
    
    expect(sm.can('start', { allowed: true })).toBe(true);
    sm.send('start', { allowed: true });
    expect(sm.state).toBe('running');
  });
});
