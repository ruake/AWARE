import { describe, it, expect, vi, beforeEach } from 'vitest';
import { bus } from '../eventBus';

describe('eventBus.ts', () => {
  beforeEach(() => {
    bus.clear();
    vi.clearAllMocks();
  });

  it('should emit and receive events', () => {
    const handler = vi.fn();
    bus.on('runs:loaded', handler);
    
    bus.emit('runs:loaded', { count: 10 });
    
    expect(handler).toHaveBeenCalledWith({ count: 10 });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should handle multiple subscribers for the same event', () => {
    const h1 = vi.fn();
    const h2 = vi.fn();
    bus.on('runs:updated', h1);
    bus.on('runs:updated', h2);
    
    bus.emit('runs:updated', undefined);
    
    expect(h1).toHaveBeenCalledTimes(1);
    expect(h2).toHaveBeenCalledTimes(1);
  });

  it('should unsubscribe correctly using off', () => {
    const handler = vi.fn();
    bus.on('runs:updated', handler);
    bus.off('runs:updated', handler);
    
    bus.emit('runs:updated', undefined);
    
    expect(handler).not.toHaveBeenCalled();
  });

  it('should unsubscribe correctly using the returned function', () => {
    const handler = vi.fn();
    const unsub = bus.on('runs:updated', handler);
    unsub();
    
    bus.emit('runs:updated', undefined);
    
    expect(handler).not.toHaveBeenCalled();
  });

  it('should handle once subscribers', () => {
    const handler = vi.fn();
    bus.once('runs:updated', handler);
    
    bus.emit('runs:updated', undefined);
    bus.emit('runs:updated', undefined);
    
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should pass correct payload to handlers', () => {
    const handler = vi.fn();
    bus.on('jobs:updated', handler);
    
    const payload = { jobId: '123' };
    bus.emit('jobs:updated', payload);
    
    expect(handler).toHaveBeenCalledWith(payload);
  });
});
