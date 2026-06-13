---
name: Chrome AI streaming quirk
description: Chrome AI's promptStreaming yields cumulative text (full response so far) per chunk, not incremental deltas.
---

# Chrome AI Streaming Quirk

## The Rule
Chrome AI's `promptStreaming` ReadableStream yields the **entire response accumulated so far** on each chunk, NOT an incremental delta. Use `fullText = text` (assign), never `fullText += text` (append).

**Why:** Chrome's implementation of the Prompt API sends the full text up to that point on every `read()` call. Appending duplicates all content — e.g. a 200-char response becomes 20,000+ chars of repetition after ~100 chunks.

**How to apply:** In any `promptStreaming` read loop, always overwrite the accumulator:
```typescript
let fullText = "";
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  fullText = typeof value === "string" ? value : new TextDecoder().decode(value); // = not +=
}
```

## Related
- Applies to both `window.LanguageModel` (Chrome 148+ new API) and `window.ai.languageModel` (Chrome 128-147 old API).
- The final `fullText` after the loop is the complete model response.
- `providers.ts` → `ChromeProvider.stream()` implements this correctly.
