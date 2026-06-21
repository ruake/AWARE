export interface IRepository<T, ID = string> {
  findById(id: ID): T | undefined;
  findMany(predicate?: (item: T) => boolean): readonly T[];
  count(predicate?: (item: T) => boolean): number;
  subscribe(cb: () => void): () => void;
  getSnapshot(): readonly T[];
}

export class InMemoryRepository<T extends { id: string }> implements IRepository<T> {
  private _data: T[] = [];
  private _snapshot: readonly T[] = [];
  private _listeners = new Set<() => void>();

  constructor(initialData: T[] = []) {
    this._data = [...initialData];
    this.updateSnapshot();
  }

  findById(id: string): T | undefined {
    return this._data.find((item) => item.id === id);
  }

  findMany(predicate?: (item: T) => boolean): readonly T[] {
    if (!predicate) return this._snapshot;
    return this._data.filter(predicate);
  }

  count(predicate?: (item: T) => boolean): number {
    if (!predicate) return this._data.length;
    return this._data.filter(predicate).length;
  }

  subscribe(cb: () => void): () => void {
    this._listeners.add(cb);
    return () => {
      this._listeners.delete(cb);
    };
  }

  getSnapshot(): readonly T[] {
    return this._snapshot;
  }

  protected notify(): void {
    this._listeners.forEach((cb) => cb());
  }

  protected updateSnapshot(): void {
    this._snapshot = Object.freeze([...this._data]);
  }

  setData(data: T[]): void {
    this._data = [...data];
    this.updateSnapshot();
    this.notify();
  }
}
