import { describe, it, expect, beforeEach } from "vitest";
import {
  clearChatHistory,
  llmChat,
  setLLMConfig,
} from "./llm";
import "./skills";

beforeEach(() => {
  clearChatHistory();
  localStorage.clear();
  setLLMConfig({ provider: "mock" });
});

describe("llmChat with skill routing (mock)", () => {
  it("runs generate-script skill when [SKILL:generate-script] is set", async () => {
    await llmChat("hello", "[SKILL:generate-script]\nYou are a test engineer.");
    const res = await llmChat("generate a script for cache HIT", "[SKILL:generate-script]\nYou are a test engineer.");
    expect(res.content).toContain("config:");
    expect(res.content).toContain("tests:");
  });

  it("runs analyze-results skill when [SKILL:analyze-results] is set", async () => {
    await llmChat("hello", "[SKILL:analyze-results]\nYou are an analyst.");
    const res = await llmChat("my tests are failing", "[SKILL:analyze-results]\nYou are an analyst.");
    expect(res.content).toContain("Regression");
  });

  it("runs explain-diff skill when [SKILL:explain-diff] is set", async () => {
    await llmChat("hello", "[SKILL:explain-diff]\nYou are a release engineer.");
    const res = await llmChat("compare baseline vs candidate", "[SKILL:explain-diff]\nYou are a release engineer.");
    expect(res.content).toContain("Comparison");
  });
});
