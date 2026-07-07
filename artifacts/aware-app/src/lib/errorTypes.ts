export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public recoverable: boolean = true,
    public retryFn?: () => Promise<void>
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NetworkError extends AppError {
  constructor(
    message: string,
    public status?: number,
    public url?: string,
    retryFn?: () => Promise<void>
  ) {
    super(message, status === 0 ? "NETWORK_ERROR" : "HTTP_ERROR", true, retryFn);
    this.name = "NetworkError";
  }
}

export class DataError extends AppError {
  constructor(
    message: string,
    code: string = "DATA_ERROR",
    retryFn?: () => Promise<void>
  ) {
    super(message, code, true, retryFn);
    this.name = "DataError";
  }
}

export class AuthError extends AppError {
  constructor(
    message: string,
    retryFn?: () => Promise<void>
  ) {
    super(message, "AUTH_ERROR", false, retryFn);
    this.name = "AuthError";
  }
}

export function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;
  if (err instanceof Error) {
    return new AppError(err.message, "UNKNOWN", true);
  }
  return new AppError(String(err), "UNKNOWN", false);
}
