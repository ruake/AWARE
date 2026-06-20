import { describe, it, expect, beforeEach } from "vitest";
import { clearChatHistory, getLLMConfig, setLLMConfig, getProvider } from "@/lib/llm";
import "@/lib/skills";

beforeEach(() => {
  clearChatHistory();
  localStorage.clear();
});

describe("LLM module", () => {
  it("has default config with custom provider", () => {
    const config = getLLMConfig();
    expect(config.provider).toBe("custom");
  });

  it("setLLMConfig updates config", () => {
    const updated = setLLMConfig({ temperature: 0.5 });
    expect(updated.temperature).toBe(0.5);
  });

  it("getProvider returns a provider instance", () => {
    const provider = getProvider();
    expect(provider.type).toBe("custom");
  });

  it("clearChatHistory does not throw", () => {
    expect(() => clearChatHistory()).not.toThrow();
  });
});
