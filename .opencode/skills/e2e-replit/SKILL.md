---
name: e2e-replit
description: Use when asked about E2E testing, Playwright, or browser-based tests in this Replit environment. Covers the constraint that Playwright cannot run due to missing system libraries, and the vitest alternative already set up.
---

# E2E Testing in this Replit Environment

## Key constraint
Playwright browsers (Chromium, etc.) require system libraries (`libglib-2.0`, `libdbus-1`, `libnss3`, `libX11`, etc.) that are **not available in this Replit environment** — `apt-get` is blocked and nix packages for some libraries (dbus, libX11) don't include the actual `.so` files. Therefore, **Playwright E2E tests cannot run here**. The `@playwright/test` package is installed but attempts to launch Chromium will fail with missing shared library errors.

## Testing strategy
- Use **vitest** (already installed at `artifacts/aware-app/node_modules/vitest`) for unit/integration tests
- vitest runs in Node.js and uses `happy-dom` for DOM emulation, so no real browser is needed
- Test files live at `artifacts/aware-app/src/**/*.test.ts`

## Commands (run from `artifacts/aware-app/`)
| Command | Purpose |
|---|---|
| `pnpm test` | Run all tests once (vitest run) |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm run typecheck` | TypeScript check (must pass before commit) |

## Test infrastructure
- **Test runner**: vitest 4.x (`vitest.config.ts` at project root)
- **DOM environment**: `happy-dom` (no real browser needed)
- **Config**: `artifacts/aware-app/vitest.config.ts` — uses `@/` path alias, happy-dom env
- **Existing tests**: `artifacts/aware-app/src/lib/llm.test.ts` — 18 tests covering copilot flow, mock LLM routing, config persistence

## Writing new tests
- Place test files next to source files with `.test.ts` or `.test.tsx` extension
- vitest globals (`describe`, `it`, `expect`) are available via `globals: true` in config
- Use `localStorage.clear()` in `beforeEach` if tests touch localStorage
- No browser APIs beyond what happy-dom provides

## Adding E2E tests if system deps become available
1. Install Playwright properly: `pnpm add -D @playwright/test`
2. Install browsers with deps (may require `sudo apt-get install -y` system deps): `npx playwright install --with-deps chromium`
3. Create tests in `e2e/` directory
4. Run: `npx playwright test`
