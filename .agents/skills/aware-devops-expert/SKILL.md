---
name: aware-devops-expert
description: Expert in Vite build config, pnpm workspace, data generation/validation scripts, test discovery automation, and GitHub Pages deployment. Use when configuring the build, adding npm scripts, working with data generation scripts, debugging pnpm workspace issues, or setting up deployment.
---

# AWARE DevOps Expert

## Role
You are the build, scripts, and developer experience expert for the AWARE project. You own the Vite build config, pnpm workspace setup, data generation scripts, validation pipeline, test discovery automation, and deployment configuration.

## Package Manager
- **pnpm** workspaces
- Workspace root: `/home/runner/workspace/`
- Workspace package: `@workspace/aware-app` at `artifacts/aware-app/`
- Always use `pnpm --filter @workspace/aware-app run <script>` for app-scoped commands

## All NPM Scripts (`artifacts/aware-app/package.json`)
```bash
pnpm dev              # Vite dev server (0.0.0.0, hot reload)
pnpm build            # prebuild (validate-data.mjs) + vite build
pnpm serve            # vite preview
pnpm typecheck        # tsc --noEmit
pnpm test             # vitest run (unit tests)
pnpm test:watch       # vitest watch
pnpm test:e2e         # playwright test
pnpm test:e2e:ci      # playwright test (CI mode)
pnpm test:e2e:install # playwright install chromium --with-deps
pnpm test:puppeteer   # node scripts/run-puppeteer.mjs
pnpm test:http        # node scripts/run-http.mjs
pnpm test:all-e2e     # e2e + puppeteer + http
pnpm discover:tests   # node scripts/discover-all.mjs
pnpm validate:data    # node scripts/validate-data.mjs
pnpm badge            # node scripts/generate-badge.mjs
pnpm lint             # eslint src/
pnpm lint:fix         # eslint src/ --fix
pnpm format           # prettier --check
pnpm format:fix       # prettier --write
pnpm audit            # pnpm audit --prod --audit-level high
pnpm verify           # typecheck + lint + format + test (full CI pre-check)
```

## Vite Configuration
```ts
// vite.config.ts (key settings)
resolve.alias: { "@": path.resolve("./src") }  // @ alias → src/
server.host: "0.0.0.0"                          // required for Replit preview
server.allowedHosts: true                        // proxied iframe compatibility
plugins: [
  react(),            // @vitejs/plugin-react
  tailwindcss(),      // @tailwindcss/vite
  cartographer(),     // @replit/vite-plugin-cartographer
  devBanner(),        // @replit/vite-plugin-dev-banner
  runtimeErrorModal() // @replit/vite-plugin-runtime-error-modal
]
```

## Scripts Reference (`scripts/`)
| Script | Purpose |
|--------|---------|
| `validate-data.mjs` | Validates `test-results.json` against schema — **runs as prebuild** |
| `generate-data.mjs` | Regenerates seed JSON from templates |
| `discover-all.mjs` | Discovers all test types (Playwright + Puppeteer + HTTP) → `auto-tests.json` |
| `discover-playwright.mjs` | Playwright test discovery only |
| `discover-puppeteer.mjs` | Puppeteer test discovery only |
| `discover-http.mjs` | HTTP test discovery only |
| `discover-tests.py` | Python pytest discovery |
| `extract-branch-data.js` | Extracts CI run data from git branch metadata |
| `generate-badge.mjs` | Generates SVG pass-rate badge |
| `record-run.mjs` | Records a new CI run into runs.json |
| `run-http.mjs` | Executes HTTP test specs directly |
| `run-puppeteer.mjs` | Executes Puppeteer test specs directly |

## Prebuild Data Validation
`validate-data.mjs` runs automatically before every build:
1. Loads `data/test-results.json`
2. Validates against `data/schemas/test-results.schema.json`
3. Exits non-zero on failure → blocks the build

**Fix approach**: If build fails due to data validation, check that all TestResult entries have required fields (`id`, `name`, `status`, `duration`, `category`, `suite`, `evidence`).

## TypeScript Config
- `tsconfig.json` in `artifacts/aware-app/`
- Path alias: `"@/*": ["./src/*"]`
- Strict mode enabled
- Target: ESNext, bundler module resolution

## Workspace Structure
```
pnpm-workspace.yaml defines:
  packages:
    - artifacts/*
    - lib/*
```
Shared packages in `lib/`: `api-client-react`, `api-spec`, `api-zod`, `db`

## Deployment Target
- Static SPA → GitHub Pages
- `index.html` duplicated as `404.html` for SPA routing support
- No server-side logic in production
- `BASE_URL` from `import.meta.env.BASE_URL` used in Router base path

## Dev Server for Replit
Critical settings for Replit preview to work:
- `server.host: "0.0.0.0"` — binds to all interfaces
- `server.allowedHosts: true` — allows proxied iframe access
- Use `$REPLIT_DEV_DOMAIN` for external URL in scripts/debug (not localhost)

## When to Use This Skill
- Configuring or debugging the Vite build
- Adding new npm scripts or automation
- Working with data generation or validation scripts
- Setting up test discovery
- Debugging pnpm workspace issues
- Configuring linting, formatting, or TypeScript
- Deployment configuration

## Files to Read First
1. `artifacts/aware-app/package.json` — all scripts and dependencies
2. `artifacts/aware-app/vite.config.ts` — build configuration
3. `artifacts/aware-app/scripts/validate-data.mjs` — prebuild validation
4. `artifacts/aware-app/tsconfig.json` — TypeScript configuration
