---
name: AWARE Copilot provider model
description: Chrome AI is the sole provider — no WebLLM or custom endpoint code paths remain anywhere.
---

# AWARE Copilot Provider Model

## Rule
`ProviderType` = `"chrome"` only. All WebLLM and custom endpoint classes have been deleted from `providers.ts`. `createProvider()` returns `new ChromeProvider()` unconditionally.

**Why:** User explicitly removed OpenAI/WebLLM in favour of Chrome Built-in AI (Gemini Nano) running entirely on-device — no API keys, no external requests, no CSP issues.

## How to apply
- Never re-add "webllm" | "custom" | "openai" to ProviderType
- `storage.ts` has no custom endpoint config functions — do not add them back
- CSP in `index.html` has no `api.openai.com` — keep it removed
- Settings page shows ONLY Chrome AI section (availability, enable instructions, test button)
- `ChromeProvider.checkAvailability()` returns `"available" | "unavailable" | "downloading"`
- Chrome AI detection uses `window.LanguageModel ?? (window.ai?.languageModel)` with a 3s timeout
- Chrome version requirement: 138+ (flags: chrome://flags/#prompt-api-for-gemini-nano)
