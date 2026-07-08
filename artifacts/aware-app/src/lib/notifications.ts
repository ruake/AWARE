type Notification = { id: string; message: string; type: 'info' | 'warn' | 'error'; timestamp: number };
let nots: Notification[] = [];
const listeners = new Set<() => void>();

export function addNotification(message: string, type: Notification['type'] = 'info') {
  nots = [...nots, { id: crypto.randomUUID(), message, type, timestamp: Date.now() }];
  listeners.forEach(fn => fn());
}

export function getNotifications(): Notification[] {
  return nots;
}

export function clearNotifications() {
  nots = [];
  listeners.forEach(fn => fn());
}

export function subscribeNotifications(cb: () => void) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}
