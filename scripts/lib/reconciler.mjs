/**
 * Reconciler — Kubernetes-style controller loop.
 *
 * A Reconciler watches a set of resources and drives their current state
 * toward the desired state on each reconciliation tick.
 *
 * Usage:
 *   const ctrl = new RunReconciler({ interval: 30000 });
 *   ctrl.reconcile = async () => { ... };
 *   ctrl.start();
 *   // later: ctrl.stop();
 */

export class Reconciler {
  /**
   * @param {string} name  — controller name (for logging)
   * @param {object} opts
   * @param {number} opts.interval — reconciliation interval in ms (default 30000)
   */
  constructor(name, opts = {}) {
    this.name = name;
    this.interval = opts.interval || 30000;
    this._running = false;
    this._timer = null;
    this.reconcileCount = 0;
  }

  /**
   * Reconcile — must be overridden by subclasses.
   * Called on each tick. Should read current state, diff against desired,
   * and apply changes.
   */
  async reconcile() {
    throw new Error(`${this.name}: reconcile() must be implemented`);
  }

  /**
   * Start the reconciliation loop.
   */
  start() {
    if (this._running) return this;
    this._running = true;
    console.log(`[${this.name}] reconciler started (interval=${this.interval}ms)`);
    this._tick();
    return this;
  }

  /**
   * Stop the reconciliation loop.
   */
  stop() {
    this._running = false;
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
    console.log(`[${this.name}] reconciler stopped`);
  }

  /**
   * Single tick: reconcile, then schedule next.
   */
  async _tick() {
    if (!this._running) return;
    try {
      await this.reconcile();
      this.reconcileCount++;
    } catch (err) {
      console.error(`[${this.name}] reconcile #${this.reconcileCount + 1} failed:`, err.message);
    }
    this._timer = setTimeout(() => this._tick(), this.interval);
  }

  /**
   * Current running state.
   */
  get isRunning() {
    return this._running;
  }
}

/**
 * ResourceReconciler — a Reconciler that watches a specific resource type.
 *
 * @template T
 * @extends Reconciler
 */
export class ResourceReconciler extends Reconciler {
  /**
   * @param {string} name
   * @param {object} opts
   * @param {number} opts.interval
   * @param {function(): Promise<T[]>} opts.listResources — returns array of resources
   * @param {function(T): Promise<boolean>} opts.reconcileResource  — reconcile one resource; return true if mutated
   */
  constructor(name, opts = {}) {
    super(name, opts);
    this.listResources = opts.listResources;
    this.reconcileResource = opts.reconcileResource;
  }

  async reconcile() {
    if (!this.listResources || !this.reconcileResource) return;
    const resources = await this.listResources();
    let mutated = 0;
    for (const r of resources) {
      const changed = await this.reconcileResource(r);
      if (changed) mutated++;
    }
    if (mutated > 0) {
      console.log(`[${this.name}] reconciled ${resources.length} resources, ${mutated} mutated`);
    }
    return mutated;
  }
}
