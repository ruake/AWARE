import { Command, CommandResult } from "./types";

export class CommandBus {
  private static _instance: CommandBus | null = null;
  private _history: CommandResult[] = [];
  private _commands: Command<any>[] = [];
  private _listeners = new Set<() => void>();

  static get instance(): CommandBus {
    if (!CommandBus._instance) {
      CommandBus._instance = new CommandBus();
    }
    return CommandBus._instance;
  }

  private constructor() {}

  async execute<T>(cmd: Command<T>): Promise<CommandResult<T>> {
    const result = await cmd.execute();
    const cmdResult: CommandResult<T> = {
      commandId: cmd.id,
      label: cmd.label,
      result,
      executedAt: new Date().toISOString(),
    };
    this._history.push(cmdResult as CommandResult<any>);
    if (cmd.undo) {
      this._commands.push(cmd);
    }
    this.notify();
    return cmdResult;
  }

  async undo(): Promise<void> {
    const cmd = this._commands.pop();
    if (cmd?.undo) {
      await cmd.undo();
      const lastResult = [...this._history].reverse().find(r => r.commandId === cmd.id && !r.undone);
      if (lastResult) {
        lastResult.undone = true;
      }
      this.notify();
    }
  }

  get history(): ReadonlyArray<CommandResult> {
    return this._history;
  }

  get canUndo(): boolean {
    return this._commands.length > 0;
  }

  subscribe(cb: () => void): () => void {
    this._listeners.add(cb);
    return () => this._listeners.delete(cb);
  }

  private notify(): void {
    this._listeners.forEach(cb => cb());
  }
}
