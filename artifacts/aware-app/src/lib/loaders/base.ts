export interface LoaderOptions {
  name: string;
  timeoutMs?: number;
  retries?: number;
  required?: boolean; // if true, errors are fatal (re-thrown); if false, logged and swallowed
}

export abstract class DataLoader<T> {
  readonly name: string;
  readonly timeoutMs: number;
  readonly retries: number;
  readonly required: boolean;
  private _loaded = false;

  constructor(options: LoaderOptions) {
    this.name = options.name;
    this.timeoutMs = options.timeoutMs ?? 15000;
    this.retries = options.retries ?? 2;
    this.required = options.required ?? false;
  }

  /**
   * Template Method — subclasses implement this to perform the actual data loading.
   */
  protected abstract doLoad(): Promise<T>;

  /**
   * Hook — called before starting the load process.
   */
  protected beforeLoad(): void {}

  /**
   * Hook — called after a successful load.
   */
  protected afterLoad(_result: T): void {}

  /**
   * Hook — called when an error occurs.
   */
  protected onError(_err: unknown): void {}

  /**
   * Hook — called when a retry is about to happen.
   */
  protected onRetry(_attempt: number, _err: unknown): void {}

  /**
   * Final algorithm — do not override.
   * This method coordinates the loading process, including hooks and error handling.
   */
  async load(): Promise<T | undefined> {
    if (this._loaded) {
      return undefined;
    }

    this.beforeLoad();

    let attempt = 0;
    while (attempt <= this.retries) {
      try {
        const result = await this.doLoad();
        this.afterLoad(result);
        this._loaded = true;
        return result;
      } catch (err) {
        if (attempt < this.retries) {
          this.onRetry(attempt + 1, err);
          attempt++;
          // Exponential backoff could be added here, but keeping it simple as per requirements
        } else {
          this.onError(err);
          if (this.required) {
            throw err;
          }
          return undefined;
        }
      }
    }

    return undefined;
  }

  /**
   * Indicates if the loader has successfully completed at least once.
   */
  get isLoaded(): boolean {
    return this._loaded;
  }

  /**
   * Allows re-loading by clearing the loaded flag.
   */
  reset(): void {
    this._loaded = false;
  }
}
