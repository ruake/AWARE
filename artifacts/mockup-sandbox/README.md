# A.W.A.K.E. — Akamai Web Analyser & Kit for Evaluations

A mockup concept for a cross-target test observability platform. Browse test runs, inspect failing HTTP evidence, compare any two runs side-by-side, and drill into per-test analytics.

## Live Demo

**https://ruake.github.io/AWARE**

## Pages

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/preview/aware/Dashboard` | Cross-target health gauge, pass-rate trend chart, outcome mix |
| Runs | `/preview/aware/Runs` | Filterable table of all test runs with one-click navigation |
| Run Detail | `/preview/aware/RunDetail?runId=...` | Split-panel test results + HTTP evidence viewer |
| Compare | `/preview/aware/Compare?baseline=...&candidate=...` | Side-by-side run diff with per-test analytics |
| Search | `/preview/aware/SearchDemo` | Global search palette (⌘K) |
| About | `/preview/aware/About` | Project info, stats, and tech stack |

## Tech Stack

- **React 19** + **TypeScript**
- **Vite** (dev server + build)
- **react-google-charts** (Gauge, Line, Bar, Column charts)
- **lucide-react** (icons)
- **Tailwind CSS v4**
- **pnpm** (package manager)

## Development

```bash
cd artifacts/mockup-sandbox
pnpm install
PORT=5173 BASE_PATH=/ pnpm dev
```

Open http://localhost:5173/preview/aware/Dashboard

## Build for Production

```bash
cd artifacts/mockup-sandbox
BASE_PATH=/AWARE PORT=1 pnpm build
```

The output goes to `dist/`. Deploy the `dist/` directory to any static host.

## GitHub Pages

Push to `main` — the [deploy workflow](.github/workflows/deploy.yml) builds and publishes automatically.

To deploy manually:
1. Go to repo **Settings → Pages**
2. Set source to **GitHub Actions**
3. The workflow handles the rest

## License

MIT
