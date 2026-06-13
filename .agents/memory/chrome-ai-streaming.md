---
name: Chrome AI streaming quirk
description: Chrome AI's promptStreaming yields cumulative text per chunk. initialPrompts must not have assistant-first history — use systemPrompt only.
---

# Chrome AI Streaming Quirk

## Streaming: cumulative text, not deltas
Chrome AI's `promptStreaming` ReadableStream yields the **entire response so far** on each chunk, NOT an incremental delta. Track last-emitted length to emit true deltas:

```typescript
let fullText = "";
let lastEmittedLen = 0;
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  fullText = typeof value === "string" ? value : new TextDecoder().decode(value); // = not +=
  const increment = fullText.slice(lastEmittedLen);
  if (increment) { onDelta({ content: increment }); lastEmittedLen = fullText.length; }
}
```

**Why:** Chrome sends the full accumulated text on every `read()` call. Appending via `+=` duplicates all content massively.

## initialPrompts MUST alternate user/assistant — NEVER assistant-first
`LanguageModel.create({ initialPrompts })` requires conversation history to start with a user turn (after system). If the only prior message is the assistant's welcome greeting, `initialPrompts` becomes `[system, assistant]` — NO preceding user message. Chrome AI **hangs or throws** on this.

**Fix:** ALWAYS use `systemPrompt` (not `initialPrompts`) for Chrome AI, and format conversation history as text inside the system prompt:
```typescript
session = await window.LanguageModel.create({
  systemPrompt: "You are ...\n\nConversation so far:\nAssistant: Hi! ...",
  signal,
});
// Then: session.promptStreaming(currentUserContent)
```

**Why:** `systemPrompt` accepts any string and never validates conversation structure. `initialPrompts` has strict format requirements that break on assistant-first or tool-message history.

## Always emit { done: true } even on abort or error
If the stream is aborted or throws, call `onDelta({ done: true })` explicitly before returning, or the planAndRouteNode's Promise will be left unresolved (hanging the graph). The `.then()` fallback in the graph agent handles the case where `done` was already emitted, so double-resolving is safe.

## Related
- Applies to both `window.LanguageModel` (Chrome 148+) and `window.ai.languageModel` (Chrome 128-147).
- When tools are present, buffer full text before checking for JSON tool call (partial JSON looks like plain text mid-stream).
- `providers.ts` → `ChromeProvider.stream()` implements all of this correctly.
