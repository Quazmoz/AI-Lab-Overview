# Private AI Compute Fabric — Architecture Explorer

An interactive, static React/TypeScript planning console for a proposed on-premises AI lab. Explore Mac Studio inference clusters, the Proxmox service plane, network topology, observability, service dependencies, and a deployment roadmap.

This is **planning/reference architecture**, not a live operations dashboard. Telemetry is synthetic, and roadmap edits are stored in your browser's local storage. No backend, credentials, or AI API key is required to use the published site.

## Local development

Requires [Bun](https://bun.com/docs/installation) (CI uses 1.3.3).

```bash
bun install --frozen-lockfile
bun run dev
```

Open `http://localhost:3000`. To verify source and production output:

```bash
bun run lint
bun test
bun run build
```

The ordinary local build uses `/` as its Vite base path.

## GitHub Pages deployment

The [Pages workflow](.github/workflows/pages.yml) builds and checks the project on pull requests to `main`. Pushes to `main` (or a manual run from `main`) build and deploy the static `dist/` artifact. The workflow uses Bun's committed `bun.lock` for reproducible installation.

1. Review the [publication warning](#publication-warning) below.
2. In **Settings → Pages → Build and deployment**, set **Source** to **GitHub Actions**.
3. Merge the Pages setup PR into `main`. Check **Actions → GitHub Pages** for the build and deploy outcome.
4. Once the deploy succeeds, the expected default URL is **https://quazmoz.github.io/AI-Lab-Overview/**. GitHub provides the authoritative URL in the workflow's `github-pages` deployment environment.

The build sets `VITE_BASE_PATH=/AI-Lab-Overview/` so Vite-generated CSS/JS URLs load from the project subdirectory. Local development remains at `/`. To reproduce the Pages artifact locally:

```bash
VITE_BASE_PATH=/AI-Lab-Overview/ bun run build
VITE_BASE_PATH=/AI-Lab-Overview/ node scripts/verify-pages-build.mjs
```

The application uses in-memory navigation rather than path-based browser routing, so no separate SPA redirect or `404.html` fallback is required. A future custom domain would require updating `VITE_BASE_PATH` to `/` in the workflow.

### Publication warning

**GitHub Pages sites are publicly accessible even when their source repository is private.** This repository includes illustrative internal hostnames, RFC1918 address plans, topology, service inventory, and configuration examples. Treat these as public documentation *only after* verifying that none describes confidential infrastructure or contains a real credential. Do not put secrets in Vite client variables or static assets. The deployment publishes only `dist/`, not `.env` files or the source tree.

GitHub Pages support for a private source repository depends on your GitHub plan. If Pages is unavailable in Settings, verify your plan or choose another hosting arrangement before making the repository public.

## Architecture notes

- App: React 19 + Vite 8 + Tailwind CSS 4, with React Flow topology views.
- Source of truth: `src/data/architectureData.ts` and `src/data/demoTelemetry.ts`.
- Current data provider: `PlanningArchitectureProvider` in `src/services/infrastructureAdapter.ts`, with simulated telemetry. No live integrations are enabled.
- Roadmap progress and theme preferences are local to each browser.
- The workflow validates TypeScript, unit tests, static build, and the generated asset base paths; it does not test real Mac/Proxmox hardware.

## Troubleshooting

- **Blank page / 404 on JavaScript assets:** Check that Pages publishes the workflow artifact and that the build uses `/AI-Lab-Overview/` as its base path.
- **No deployment:** Check Settings → Pages (Source = GitHub Actions), Actions permissions, and the GitHub Pages workflow log. Only the `main` branch can deploy.
- **Changes not appearing:** Allow the Actions run to finish and refresh the Pages URL; pull-request builds intentionally do not publish.
