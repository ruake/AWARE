type Listener = () => void;

const tsListeners = new Set<Listener>();
const tcListeners = new Set<Listener>();

let _pendingNotify: (() => void) | null = null;

function scheduleNotify(notify: () => void): void {
  if (_pendingNotify) return;
  _pendingNotify = notify;
  Promise.resolve().then(() => {
    const fn = _pendingNotify;
    _pendingNotify = null;
    fn!();
  });
}

export function subscribeToTestSuites(cb: Listener): () => void {
  tsListeners.add(cb);
  return () => { tsListeners.delete(cb); };
}

export function _notifyTS(): void {
  scheduleNotify(() => {
    tsListeners.forEach(fn => fn());
  });
}

export function subscribeToTestCases(cb: Listener): () => void {
  tcListeners.add(cb);
  return () => { tcListeners.delete(cb); };
}

export function _notifyTC(): void {
  scheduleNotify(() => {
    tcListeners.forEach(fn => fn());
  });
}

const snapListeners = new Set<() => void>();
let snapshot: unknown[] = [];

export function subscribeSnapshot(cb: () => void) {
  snapListeners.add(cb);
  return () => { snapListeners.delete(cb); };
}

export function _notifySnapshot() {
  snapshot = [...snapshot];
  snapListeners.forEach(fn => fn());
}
