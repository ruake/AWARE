import { describe, it, expect, beforeEach } from "vitest";
import { clearChatHistory, getLLMConfig, setLLMConfig, getProvider } from "./llm";
import "./skills";

beforeEach(() => {
  clearChatHistory();
  localStorage.clear();
});

describe("LLM module", () => {
  it("has default config with openai provider", () => {
    const config = getLLMConfig();
    expect(config.provider).toBe("openai");
    expect(config.model).toBeTruthy();
  });

  it("setLLMConfig updates config", () => {
    const updated = setLLMConfig({ temperature: 0.5 });
    expect(updated.temperature).toBe(0.5);
  });

  it("getProvider returns a provider instance", () => {
    const provider = getProvider();
    expect(provider.type).toBe("openai");
  });

  it("clearChatHistory does not throw", () => {
    expect(() => clearChatHistory()).not.toThrow();
  });
});
