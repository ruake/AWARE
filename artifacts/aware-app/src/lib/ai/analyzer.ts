import type { UseCase } from "./useCases";
import type { ChatMessage } from "@/lib/chatStorage";

export interface AnalysisResult {
  response: string;
  useCase: UseCase | null;
}

export async function analyzePrompt(
  messages: ChatMessage[],
  useCases: UseCase[],
): Promise<AnalysisResult> {
  // Find matching use case
  const lastMsg = messages[messages.length - 1]?.content?.toLowerCase() || "";
  const matched =
    useCases.find((uc) => uc.trigger.some((t) => lastMsg.includes(t.toLowerCase()))) || null;

  // Build response based on matched use case
  if (matched) {
    const response = `## ${matched.name}\n\nRunning ${matched.description.toLowerCase()}...\n\nBased on the current data, I'll analyze the patterns and provide insights. Please ensure data is loaded for accurate results.`;
    return { response, useCase: matched };
  }

  // Generic response
  const response = `I'm PROOF AI Copilot. I can help with:\n${useCases.map((uc) => `- **${uc.name}**: ${uc.description}`).join("\n")}\n\nWhat would you like to analyze?`;
  return { response, useCase: null };
}

export async function streamAnalyze(
  messages: ChatMessage[],
  useCases: UseCase[],
  onChunk: (chunk: string) => void,
  onComplete: (result: AnalysisResult) => void,
): Promise<void> {
  const result = await analyzePrompt(messages, useCases);

  // Simulate streaming by splitting into words
  const words = result.response.split(" ");
  for (const word of words) {
    onChunk(word + " ");
    await new Promise((r) => setTimeout(r, 20));
  }
  onComplete(result);
}
