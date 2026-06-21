import { Command } from "./types";
import { setPromotionDecision } from "../promotions";

export class PromoteRunCommand implements Command<void> {
  readonly id = crypto.randomUUID();
  readonly label: string;

  constructor(private runId: string) {
    this.label = `Promote run ${runId}`;
  }

  async execute(): Promise<void> {
    setPromotionDecision(this.runId, "promote");
  }

  async undo(): Promise<void> {
    setPromotionDecision(this.runId, "pending");
  }
}

export class BlockRunCommand implements Command<void> {
  readonly id = crypto.randomUUID();
  readonly label: string;

  constructor(private runId: string) {
    this.label = `Block run ${runId}`;
  }

  async execute(): Promise<void> {
    setPromotionDecision(this.runId, "block");
  }

  async undo(): Promise<void> {
    setPromotionDecision(this.runId, "pending");
  }
}
