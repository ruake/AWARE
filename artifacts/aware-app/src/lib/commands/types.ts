export interface Command<T = void> {
  readonly id: string;
  readonly label: string;
  execute(): Promise<T>;
  undo?(): Promise<void>;
}

export interface CommandResult<T = void> {
  commandId: string;
  label: string;
  result: T;
  executedAt: string;
  undone?: boolean;
}
