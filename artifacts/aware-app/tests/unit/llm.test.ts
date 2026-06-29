import { describe, it, expect, beforeEach } from "vitest";
import { clearChatHistory, getLLMConfig, setLLMConfig, getProvider } from "@/lib/llm";
import "@/lib/skills";

beforeEach(() => {
  clearChatHistory();
  localStorage.clear();
});

describe("LLM module", () => {
  it("has a provider in the default config", () => {
    const config = getLLMConfig();
    // Default provider is "chrome" (Chrome AI adapter)
    expect(typeof config.provider).toBe("string");
    expect(config.provider.length).toBeGreaterThan(0);
  });

  it("setLLMConfig updates config", () => {
    const updated = setLLMConfig({ temperature: 0.5 });
    expect(updated.temperature).toBe(0.5);
  });

  it("getProvider returns a provider instance with a complete method", () => {
    const provider = getProvider();
    // Chrome AI provider exposes a complete() method; type is not a public field.
    expect(typeof provider.complete).toBe("function");
  });

  it("clearChatHistory does not throw", () => {
    expect(() => clearChatHistory()).not.toThrow();
  });
});
