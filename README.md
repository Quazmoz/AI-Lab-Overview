# Private AI Compute Fabric — AI Lab Architecture Explorer

[![GitHub Pages](https://github.com/Quazmoz/AI-Lab-Overview/actions/workflows/pages.yml/badge.svg)](https://github.com/Quazmoz/AI-Lab-Overview/actions/workflows/pages.yml)

An interactive, browser-only reference architecture for a **proposed on-premises AI lab** combining Apple Silicon inference compute with a Proxmox-hosted AI service plane.

**[Open the architecture explorer](https://quazmoz.github.io/AI-Lab-Overview/)** (GitHub Pages; deployment must be enabled in repository settings).

> **Planning site, not a production dashboard.** All nodes, services, statuses, throughput estimates, observability signals, and roadmap progress are illustrative. No real API endpoints, credentials, or live infrastructure telemetry are connected.

## Explore the design

- **Overview:** infrastructure zones and a navigable service topology.
- **Architecture Topology:** interactive dependency graph, inference-mode switch, filtering, service detail sheets, PNG/SVG export.
- **Mac Studio Cluster:** three four-node clusters, individual node specifications, model-memory sizing heuristic, and independent-vs-distributed comparison.
- **Proxmox Infrastructure:** planned host baseline and six VM allocations.
- **Services & Dependencies:** LiteLLM, MLX-LM, n8n, PostgreSQL, Redis, Qdrant, MCP servers, and operational components.
- **Observability:** synthetic OpenTelemetry, Prometheus, Grafana, Loki, and Tempo examples.
- **Network Architecture:** segmented Ethernet VLANs and proposed Thunderbolt 5 JACCL meshes.
- **Deployment Roadmap:** five phases with local, browser-specific status overrides.

The application supports dark/light themes, keyboard search via **Cmd/Ctrl+K**, and clickable infrastructure service cards. Roadmap state and theme preference are stored in `localStorage`, not synchronized to GitHub or a backend.

The published bundle is a **static client-side React application**. The dependency manifest intentionally excludes server-only Express and environment loaders, the Gemini SDK, and unused runtime packages; adding a live API requires a separate authenticated backend and threat model.

## Reference architecture at a glance

| Plane | Planned components | Responsibilities |
| --- | --- | --- |
| Compute | 12 × Mac Studio M5 Ultra, grouped into 3 clusters of 4 | MLX/MLX-LM local inference, independent replicas, experimental four-rank distributed inference, embeddings and fine-tuning |
| Interconnect | 3 isolated Thunderbolt 5 full meshes; **6 direct cables per cluster / 18 total** | JACCL RDMA between the four peers of each cluster; no shared memory fabric across all 12 Macs |
| Service | 1 Proxmox VE host, 6 KVM VMs | LiteLLM gateway, n8n workers, PostgreSQL/Redis, Qdrant, MCP execution, observability |
| Network | 4 planned Ethernet VLANs plus point-to-point Thunderbolt links | Management, applications, AI compute, and backup/storage segmentation |
| Observability | OTel Collector, Prometheus, Loki, Tempo, Grafana | Metrics, logs, traces, dashboards; all signals shown in the UI are simulated |

### Validated hardware baseline versus assumptions

The site models the **configurable 36-core CPU / 80-core GPU / 32-core Neural Engine M5 Ultra** with 256 GB unified memory, rated at 1.2 TB/s *per Mac* by Apple. Thus 12 nodes sum to 3,072 GB of physical memory; the displayed 4.8 TB/s per-cluster figure is only the **sum of four independent local memory-bandwidth ratings**, not inter-node RDMA throughput.

The 224 GB usable wired-memory allowance per node (896 GB per four-node cluster), model weights, KV cache, and runtime overhead are **planning heuristics**. They do not establish actual allocation, shared addressability, model support, maximum context length, performance, or failover. A mixture-of-experts model's **total stored parameters**, not merely the active-per-token count, determines weight storage.

MLX's JACCL backend requires a **fully connected Thunderbolt 5 mesh**, macOS 26.2 or newer, local RDMA enablement in macOS Recovery, and a generated hostfile. An ordinary four-node Thunderbolt ring is a different, TCP-based MLX backend; it cannot be assumed interchangeable with JACCL.

See [Technical Validation & Acceptance Gates](docs/TECHNICAL_VALIDATION.md) for checked sources, corrected assumptions, known limitations, hands-on qualification steps, and acceptance criteria.

## Local development

Requirements:

- Node.js compatible with the installed Vite 8 release.
- [Bun](https://bun.com/docs/installation) compatible with the committed `bun.lock`. CI currently uses the newest release via `oven-sh/setup-bun`.
- No backend, cloud API keys, Apple hardware, or local Proxmox instance is needed.

```bash
git clone https://github.com/Quazmoz/AI-Lab-Overview.git
cd AI-Lab-Overview
bun install --frozen-lockfile
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

Validation commands:

```bash
bun run lint                 # TypeScript: tsc --noEmit
bun test                     # Logic and inventory consistency tests
bun run build                # Ordinary site build at /
VITE_BASE_PATH=/AI-Lab-Overview/ bun run build
VITE_BASE_PATH=/AI-Lab-Overview/ node scripts/verify-pages-build.mjs
bun run preview              # Preview the most recent dist/ artifact
```

The Pages-specific build and verifier validate the GitHub Pages subdirectory output, including JS/CSS and favicon URLs. Run preview with the same base path as the build when testing project-site navigation.

For an end-to-end browser check, visit the [live Pages URL](https://quazmoz.github.io/AI-Lab-Overview/), navigate all eight sections, search for `qdrant`, switch the theme, try model-sizing controls, and exercise export and local roadmap state. See the [browser smoke checklist](docs/TECHNICAL_VALIDATION.md#browser-smoke-checklist) for specific acceptance criteria. A build passing does not guarantee that downloaded diagrams are visually complete or that the UI works on every device.

### Source layout

| Path | Purpose |
| --- | --- |
| `src/data/architectureData.ts` | Proposed hardware, VMs, services, connections, VLANs, models, roadmap |
| `src/data/demoTelemetry.ts` | Synthetic KPIs, logs, traces, availability (never live data) |
| `src/services/infrastructureAdapter.ts` | Read-only `PlanningArchitectureProvider` contract, extension seam for future live integrations |
| `src/utils/architectureLogic.ts` | Memory planning, filtering, roadmap and VM calculations |
| `src/utils/topologyBuilder.ts` | React Flow graph view-model |
| `src/pages/`, `src/components/` | React UI, topology, controls and details |
| `src/utils/architectureLogic.test.ts` | Logic and architecture reference-integrity tests |
| `public/favicon.svg` | Base-path-aware favicon published with the static site |
| `scripts/verify-pages-build.mjs` | Built-asset verification for Pages |

## GitHub Pages deployment

[Workflow: `.github/workflows/pages.yml`](.github/workflows/pages.yml)

1. Audit the [publication warning](#public-publication-warning) before publishing any real infrastructure details.
2. Set **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Push to `main`. The workflow checks out the code, installs Bun dependencies from the committed lockfile, type-checks, runs tests, builds, verifies asset paths, and publishes `dist/`.
4. The expected default project URL is [https://quazmoz.github.io/AI-Lab-Overview/](https://quazmoz.github.io/AI-Lab-Overview/). Check **Actions → GitHub Pages** and the deployment environment for authoritative status and URL.

Pull requests to `main` execute validation only; they **do not deploy**. The Vite base path is `/AI-Lab-Overview/` in CI and `/` for ordinary local development. The favicon uses Vite's `%BASE_URL%` placeholder so it works for both. This app does not use path-based routing, so no `404.html` SPA fallback is necessary.

For a future custom domain, change the workflow's `VITE_BASE_PATH` to `/` and configure the domain in Pages settings. Do not switch the path without updating the deployment configuration.

## Security and scope

- Public static HTML/JS includes all bundled configuration and example snippets. **Never** put a real secret in `VITE_*` variables, React state, source data, or static assets.
- Internal hostnames and addresses are illustrative or redacted. Do not reuse sample network policies unreviewed.
- No current authentication, backend writes, resource provisioning, telemetry ingestion, or AI inference is performed by the published site.
- Any future live integration should use a separate, authenticated, least-privilege backend with CORS restrictions and server-side secrets. Never connect a public Pages site directly to Proxmox, database, Grafana admin, or MCP management APIs.
- Device specifications and compatibility change. Vendor and project docs take precedence over historical planning figures.

### Public publication warning

GitHub Pages is publicly accessible, even in setups where its source repository may be private. **Review the full git history, committed snapshots, source data, snippets, and built assets** for confidential hostnames, topologies, IPs, passwords, tokens, employee data, or business-specific information before enabling Pages or publishing changes. Publishing only `dist/` prevents source files from being served *as files*, but literals embedded in the JavaScript are still public.

## Troubleshooting

- **Blank page / 404 for assets:** verify `VITE_BASE_PATH=/AI-Lab-Overview/`, the artifact contents, and the `scripts/verify-pages-build.mjs` check.
- **No site:** Pages source must be GitHub Actions; check repository Actions permissions, the build and deploy jobs, and the `github-pages` environment URL.
- **PR does not update the site:** expected; only a push to `main` or a workflow dispatch on `main` deploys.
- **No live telemetry:** expected; `PlanningArchitectureProvider` always returns synthetic snapshots.
- **Roadmap changes disappear across devices:** expected; local browser storage is intentionally not synchronized.
- **Model fit says estimated:** intentional; actual memory and JACCL behavior require physical Mac validation as described in the [acceptance checklist](docs/TECHNICAL_VALIDATION.md).

## References

- [Apple Mac Studio M5 Ultra technical specifications](https://support.apple.com/en-us/128107)
- [Apple M5 Ultra launch and memory-bandwidth details](https://www.apple.com/newsroom/2026/08/apple-introduces-new-mac-studio-with-m5-max-and-m5-ultra/)
- [MLX distributed backends and JACCL setup](https://github.com/ml-explore/mlx/blob/main/docs/src/usage/distributed.rst)
- [MLX distributed hostfile tooling](https://github.com/ml-explore/mlx/blob/main/docs/src/usage/launching_distributed.rst)
- [MLX-LM model serving documentation](https://github.com/ml-explore/mlx-lm/blob/main/mlx_lm/SERVER.md)
- [LiteLLM production practices](https://docs.litellm.ai/docs/proxy/prod)
- [n8n queue mode](https://docs.n8n.io/hosting/scaling/queue-mode/)

This repository documents a proposed lab proof of concept; it is not an installation guide or a claim that its hardware is already deployed.
