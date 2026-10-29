# Private AI Compute Fabric — AI Lab Architecture Explorer

[![GitHub Pages](https://github.com/Quazmoz/AI-Lab-Overview/actions/workflows/pages.yml/badge.svg)](https://github.com/Quazmoz/AI-Lab-Overview/actions/workflows/pages.yml)

An interactive, browser-only reference architecture for a **proposed on-premises AI lab** combining Apple Silicon inference compute with a Proxmox-hosted service plane and optional Docker Compose or Kubernetes delivery for eligible supporting workloads.

**[Open the architecture explorer](https://quazmoz.github.io/AI-Lab-Overview/)** (GitHub Pages; deployment must be enabled in repository settings).

> **Planning site, not a production dashboard.** All nodes, services, statuses, throughput estimates, observability signals, and roadmap progress are illustrative. No real API endpoints, credentials, or live infrastructure telemetry are connected.

## Explore the design

- **Overview:** infrastructure zones and a navigable service topology.
- **Architecture Topology:** interactive dependency graph, inference-mode switch, filtering, service detail sheets, PNG/SVG export.
- **Mac Studio Cluster:** selectable Apple M5 Ultra hardware profiles, SSD sizes, three four-node clusters, dynamically updated model-memory sizing and independent-vs-distributed comparisons.
- **Proxmox Infrastructure:** planned host baseline and six VM allocations.
- **Docker & Kubernetes Options:** interactive comparison of VM, Docker Compose and Kubernetes placements for eligible supporting workloads, with state and security constraints.
- **Services & Dependencies:** LiteLLM, MLX-LM, n8n, PostgreSQL, Redis, Qdrant, MCP servers, and operational components.
- **Observability:** synthetic OpenTelemetry, Prometheus, Grafana, Loki, and Tempo examples.
- **Network Architecture:** segmented Ethernet VLANs and proposed Thunderbolt 5 JACCL meshes.
- **Deployment Roadmap:** five phases with local, browser-specific status overrides.

The application supports dark/light themes, keyboard search via **Cmd/Ctrl+K**, and clickable infrastructure service cards. Roadmap state, theme and Mac hardware scenario preferences are stored in `localStorage`, not synchronized to GitHub or a backend.

The published bundle is a **static client-side React application**. The dependency manifest intentionally excludes server-only Express and environment loaders, the Gemini SDK, and unused runtime packages; adding a live API requires a separate authenticated backend and threat model.

## Reference architecture at a glance

| Plane | Planned components | Responsibilities |
| --- | --- | --- |
| Compute | 12 × Mac Studio M5 Ultra, grouped into 3 clusters of 4 | MLX/MLX-LM local inference, independent replicas, experimental four-rank distributed inference, embeddings and fine-tuning |
| Interconnect | 3 isolated Thunderbolt 5 full meshes; **6 direct cables per cluster / 18 total** | JACCL RDMA between the four peers of each cluster; no shared memory fabric across all 12 Macs |
| Service | 1 Proxmox VE host, 6 baseline KVM VMs; optional containers or extra Kubernetes guest tier | LiteLLM gateway, n8n workers, PostgreSQL/Redis, Qdrant, MCP execution, observability |
| Network | 4 planned Ethernet VLANs plus point-to-point Thunderbolt links | Management, applications, AI compute, and backup/storage segmentation |
| Observability | OTel Collector, Prometheus, Loki, Tempo, Grafana | Metrics, logs, traces, dashboards; all signals shown in the UI are simulated |

### Optional service runtimes: VM, Docker Compose and Kubernetes

The site starts from **six planned Linux KVM VMs**, each with a documented service role. The **Docker Compose** option packages Linux workloads inside those VMs; it does not run the inference engine in a container or remove VM/VLAN isolation. The **Kubernetes** option is a separately sized set of Linux guest VMs on the Proxmox service plane, and it applies only to eligible applications. Selecting an option in the site changes a **planning comparison**, not the actual architecture graph, a live resource, or the six baseline VM budget.

| Workload group | VM baseline | Docker Compose inside Linux VM | Kubernetes guest tier |
| --- | --- | --- | --- |
| LiteLLM gateway, n8n, MCP servers, OTel Collector | Supported | Candidate | Candidate (requires extra control-plane/worker VMs) |
| Grafana | Supported | Candidate with persistent config/database | Candidate with persistent config/database |
| PostgreSQL, Redis, Qdrant | Preferred baseline | Candidate with durable volumes, backups, recovery | Deferred until storage operators and recovery are qualified |
| Prometheus, Loki, Tempo | Preferred baseline | Candidate with durable metrics/log/trace storage | Deferred for POC simplicity |
| MLX / MLX-LM, Mac Studio inference | Bare-metal macOS, outside this comparison | Not part of this proposal | Not part of this proposal |

The six-VM CPU and RAM calculations **exclude Kubernetes guest nodes**. A single Proxmox host is a single hardware failure domain even with multiple guest nodes. Before enabling a containerized option, qualify image provenance, secret handling, least-privilege egress, resource limits, durability/restore, queue recovery and rollback. Keep LiteLLM as the governed API entry point; preserve existing VLAN segmentation and the isolated Mac inference plane.

The [interactive runtime comparison](https://quazmoz.github.io/AI-Lab-Overview/) and [workload deployment catalog](src/data/workloadDeployment.ts) provide the per-service details. They are reference designs, not ready-to-apply production manifests.

### Toggleable Mac Studio hardware scenarios

On **Mac Studio Cluster → Mac Studio Hardware Scenario**, choose one of the Apple-listed M5 Ultra combinations:

| Profile | CPU / GPU cores | Unified memory per Mac | Illustrative wired budget per Mac |
| --- | --- | --- | --- |
| Base M5 Ultra | 30 / 64 | 96 GB | 84 GB |
| Upgraded M5 Ultra (default) | 36 / 80 | 256 GB | 224 GB |
| Maximum-memory M5 Ultra | 36 / 80 | 512 GB | 448 GB |

You can also choose **1, 2, 4, 8, or 16 TB SSD** per Mac (default: 4 TB). The selector applies uniformly to all 12 Macs, updating the **Overview**, **Topology**, **Mac Cluster**, **Services**, and **node detail** figures without changing Proxmox resources or the logical connection graph. The model-fit calculator and reference category table use the selected heuristic per-node budget. Invalid saved values are rejected, and a reset button returns to the original 256 GB / 4 TB proposal.

The illustrative wired budget is **87.5% of physical RAM**, reserving 12.5% for macOS and runtime overhead. This is **not** a measured Metal limit or a guarantee of model compatibility. Neither SSD size nor CPU/GPU core count is currently used to predict throughput. Synthetic observability charts and the implementation roadmap remain baseline demonstrations; they are not live readings or procurement records.

### Validated hardware baseline versus assumptions

The default profile models the **36-core CPU / 80-core GPU / 32-core Neural Engine M5 Ultra** with 256 GB unified memory, rated at 1.2 TB/s *per Mac* by Apple. Thus 12 default nodes sum to 3,072 GB physical memory; 4.8 TB/s per cluster is only the **sum of four independent local memory-bandwidth ratings**, not inter-node RDMA throughput. Other profiles are selectable what-if configurations.

The default 224 GB usable wired-memory allowance per node (896 GB per four-node cluster), scenario-specific 12.5% reserve, model weights, KV cache, and runtime overhead are **planning heuristics**. They do not establish actual allocation, shared addressability, model support, maximum context length, performance, or failover. A mixture-of-experts model's **total stored parameters**, not merely the active-per-token count, determines weight storage.

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

For an end-to-end browser check, visit the [live Pages URL](https://quazmoz.github.io/AI-Lab-Overview/), navigate all nine sections, search for `qdrant`, switch the theme, try model-sizing controls, and exercise export and local roadmap state. See the [browser smoke checklist](docs/TECHNICAL_VALIDATION.md#browser-smoke-checklist) for specific acceptance criteria. A build passing does not guarantee that downloaded diagrams are visually complete or that the UI works on every device.

### Source layout

| Path | Purpose |
| --- | --- |
| `src/data/architectureData.ts` | Proposed hardware, VMs, services, connections, VLANs, models, roadmap |
| `src/data/workloadDeployment.ts` | Eligible Linux runtime options and per-service deployment guardrails |
| `src/data/macHardwareProfiles.ts` | Apple-listed Mac SKU/SSD choices and immutable hardware-scenario derivation |
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
- **Kubernetes not visible in the physical topology:** intentional. It is an optional planning overlay until additional Linux guest sizing, network/storage design and runtime qualification are completed.

## References

- [Apple Mac Studio M5 Ultra technical specifications](https://support.apple.com/en-us/128107)
- [Apple M5 Ultra launch and memory-bandwidth details](https://www.apple.com/newsroom/2026/08/apple-introduces-new-mac-studio-with-m5-max-and-m5-ultra/)
- [MLX distributed backends and JACCL setup](https://github.com/ml-explore/mlx/blob/main/docs/src/usage/distributed.rst)
- [MLX distributed hostfile tooling](https://github.com/ml-explore/mlx/blob/main/docs/src/usage/launching_distributed.rst)
- [MLX-LM model serving documentation](https://github.com/ml-explore/mlx-lm/blob/main/mlx_lm/SERVER.md)
- [LiteLLM production practices](https://docs.litellm.ai/docs/proxy/prod)
- [n8n queue mode](https://docs.n8n.io/hosting/scaling/queue-mode/)

This repository documents a proposed lab proof of concept; it is not an installation guide or a claim that its hardware is already deployed.
