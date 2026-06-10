---
name: validate-loop
description: Runs the full validation pipeline — typecheck, lint, format, data validation, unit tests, test discovery, and build — in a loop until all checks pass or the user triages failures.
license: MIT
metadata:
  author: ruake
  version: "1.0.0"
  domain: ci-cd
  triggers: validate, verify, lint, typecheck, build, test, format, pre-commit, pre-push
  role: specialist
  scope: implementation
  output-format: terminal
---

# Validate Loop

Validation automation for the AWARE project. Runs the full check suite and loops on failure, letting the agent fix issues and re-run.

## When to use

Use this skill when:
- Asked to "validate", "verify", "run checks", "run the validation loop"
- About to commit or push — run the full pipeline first
- Fixing CI failures — reproduce locally
- After making changes to data files, types, components, or tests

## Required project context

- Working directory: `artifacts/aware-app`
- Package manager: `pnpm` (v10.26.1)
- Key scripts (from `package.json`):

| Script | Command | Purpose |
|---|---|---|
| `validate:data` | `node scripts/validate-data.mjs` | JSON schema contract validation |
| `typecheck` | `tsc -p tsconfig.json --noEmit` | TypeScript type checking |
| `lint` | `eslint src/` | ESLint static analysis |
| `format` | `prettier --check ...` | Prettier formatting check |
| `test` | `vitest run` | Unit tests (vitest) |
| `discover:tests` | `node scripts/discover-all.mjs` | Auto-discover pytest/Playwright/Puppeteer/HTTP tests |
| `build` | `vite build` | Production build (auto-runs `validate:data`) |
| `verify` | typecheck + lint + format + test | Quick pre-commit check |

## Instructions

### Execution order

Run these steps **in order**. Stop at the first failure, fix it, then restart the loop from step 1.

1. **Data validation** — `pnpm validate:data`
   - Checks every JSON data file against its schema
   - Cross-references IDs between files
   - If this fails, inspect the error output and fix the malformed data or schema
2. **TypeScript typecheck** — `pnpm run typecheck`
   - Full project type checking with `tsc --noEmit`
   - If this fails, fix type errors (missing imports, incorrect types, etc.)
3. **Lint** — `pnpm run lint`
   - ESLint check on `src/`
   - If this fails, auto-fix with `pnpm run lint:fix` when safe, then re-run lint
4. **Format** — `pnpm run format`
   - Prettier check on source files
   - If this fails, auto-fix with `pnpm run format:fix`, then re-run format
5. **Unit tests** — `pnpm test`
   - Vitest runner
   - If this fails, read the test output to identify the failing test, fix the code, re-run
6. **Test discovery** — `pnpm discover:tests`
   - Regenerates `auto-tests.json` from pytest/Playwright/Puppeteer/HTTP sources
   - If this fails, check the individual discovery scripts for parse errors
7. **Build** — `pnpm build`
   - Vite production build (prebuild hook runs `validate:data` automatically)
   - If this fails, check Vite/TypeScript errors in build output

### Loop behavior

- After fixing any failure, **restart from step 1**, not from the failed step
- Keep a counter of iterations; if the loop exceeds 5 iterations without full pass, prompt the user to triage manually
- Report each step result clearly: `✅ pnpm validate:data` or `❌ pnpm run typecheck`
- On full pass, print a summary:

```
✅ Validation loop complete (X iterations)
   - validate:data  ✅
   - typecheck      ✅
   - lint           ✅
   - format         ✅
   - test           ✅
   - discover:tests ✅
   - build          ✅
```

### Partial / quick variants

| Request | Steps to run |
|---|---|
| "quick check" or "verify" | typecheck + lint + format + test (same as `pnpm run verify`) |
| "validate data only" | `validate:data` only |
| "pre-commit check" | validate:data + typecheck + lint + format |
| "full validation" | All 7 steps |

### Error handling

- If a command is not found, install dependencies first with `pnpm install`
- If a step produces warnings but no errors, continue to the next step
- If the same step fails twice in a row with the same error, stop the loop and show the error to the user — automatic retry is not helping
- If `build` fails due to a pre-existing issue unrelated to current changes, note it and ask the user whether to proceed
