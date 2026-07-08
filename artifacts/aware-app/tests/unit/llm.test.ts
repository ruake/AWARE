import { describe, it, expect, beforeEach } from "vitest";
import { clearChatHistory, getLLMConfig, setLLMConfig, getProvider, resetLLMConfig } from "@/lib/llm";

beforeEach(() => {
  resetLLMConfig();
  clearChatHistory();
  localStorage.clear();
});

describe("LLM module", () => {
  it("has a provider in the default config", () => {
    const config = getLLMConfig();
    expect(typeof config.provider).toBe("string");
    expect(config.provider.length).toBeGreaterThan(0);
  });

  it("defaults to chrome provider", () => {
    const config = getLLMConfig();
    expect(config.provider).toBe("chrome");
  });

  it("setLLMConfig updates config", () => {
    const updated = setLLMConfig({ temperature: 0.5 });
    expect(updated.temperature).toBe(0.5);
  });

  it("setLLMConfig returns the full updated config", () => {
    setLLMConfig({ temperature: 0.5 });
    const config = getLLMConfig();
    expect(config.temperature).toBe(0.5);
    expect(config.provider).toBe("chrome");
  });

  it("setLLMConfig merges partial updates", () => {
    setLLMConfig({ model: "gpt-4" });
    const config = getLLMConfig();
    expect(config.model).toBe("gpt-4");
    expect(config.temperature).toBe(0.7);
  });

  it("getProvider returns a provider instance with a complete method", () => {
    const provider = getProvider();
    expect(typeof provider.complete).toBe("function");
  });

  it("getProvider.complete returns a string", async () => {
    const provider = getProvider();
    const result = await provider.complete("test prompt");
    expect(typeof result).toBe("string");
  });

  it("clearChatHistory does not throw", () => {
    expect(() => clearChatHistory()).not.toThrow();
  });

  it("clearChatHistory removes the storage key", () => {
    localStorage.setItem("aware-chat-history", "test data");
    clearChatHistory();
    expect(localStorage.getItem("aware-chat-history")).toBeNull();
  });
});
