type AwareEventMap = {
  "runs:loaded": { count: number };
  "runs:updated": void;
  "results:loaded": { runId: string };
  "testcases:updated": void;
  "suites:updated": void;
  "promotions:updated": void;
  "jobs:updated": { jobId: string };
  "data:phase": { phase: 1 | 2 | 3; done: boolean };
  "anomaly:detected": { runId: string; severity: string };
  "scheduler:updated": void;
  "diffrows:loaded": { count: number };
};

export type EventName = keyof AwareEventMap;
export type EventPayload<K extends EventName> = AwareEventMap[K];

export class TypedEventBus {
  private listeners: Map<EventName, Set<(payload: any) => void>> = new Map();

  emit<K extends EventName>(event: K, payload: EventPayload<K>): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach((handler) => handler(payload));
    }
  }

  on<K extends EventName>(
    event: K,
    handler: (payload: EventPayload<K>) => void,
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
    return () => this.off(event, handler);
  }

  once<K extends EventName>(
    event: K,
    handler: (payload: EventPayload<K>) => void,
  ): () => void {
    const wrapper = (payload: EventPayload<K>) => {
      this.off(event, wrapper);
      handler(payload);
    };
    return this.on(event, wrapper);
  }

  off<K extends EventName>(
    event: K,
    handler: (payload: EventPayload<K>) => void,
  ): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}

export const bus = new TypedEventBus();
