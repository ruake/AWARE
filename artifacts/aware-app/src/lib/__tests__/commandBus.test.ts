import { describe, it, expect, vi } from 'vitest';
import { CommandBus } from '../commands/bus';
import { Command } from '../commands/types';

describe('CommandBus', () => {
  class MockCommand implements Command<number> {
    id = Math.random().toString();
    label = 'Mock Command';
    execute = vi.fn().mockResolvedValue(42);
    undo = vi.fn().mockResolvedValue(undefined);
  }

  it('should execute command and record history', async () => {
    const bus = CommandBus.instance;
    const cmd = new MockCommand();
    const result = await bus.execute(cmd);

    expect(result.result).toBe(42);
    expect(cmd.execute).toHaveBeenCalled();
    expect(bus.history).toContainEqual(expect.objectContaining({
      commandId: cmd.id,
      label: cmd.label,
    }));
  });

  it('should undo last command', async () => {
    const bus = CommandBus.instance;
    const cmd = new MockCommand();
    await bus.execute(cmd);
    
    expect(bus.canUndo).toBe(true);
    await bus.undo();
    
    expect(cmd.undo).toHaveBeenCalled();
    expect(bus.history[bus.history.length - 1].undone).toBe(true);
  });
});
