# Technical Validation & Acceptance Gates

**Reviewed 29 October 2026.** This is a source-code and vendor-documentation audit, **not** a physical cluster qualification. No Mac Studio, JACCL fabric, Proxmox VM, live LiteLLM endpoint, or production telemetry source was connected during this review.

## Evidence-backed status

| Subsystem | What is supported by evidence | What is still unverified |
| --- | --- | --- |
| Mac Studio M5 Ultra | Apple lists the configurable 36-core CPU (12 super + 24 performance), 80-core GPU, 32-core Neural Engine, 256 GB unified-memory option and 1.2 TB/s rated memory bandwidth. | Exact purchased SKU, firmware, power, thermals and actual workload throughput |
| Fleet arithmetic | 3 × 4 × 256 GB = **3,072 GB installed**. Each four-node group has 1,024 GB total physical memory; 4 × 1.2 TB/s = **4.8 TB/s sum of local rated bandwidth**. | No shared address space or cross-node bandwidth follows from those sums |
| Wired-memory allowance | Site assumes 224 GB/node (896 GB/cluster) after 32 GB OS headroom. | Actual macOS Metal limits, memory pressure, KV-cache and concurrent allocations |
| Thunderbolt/JACCL | MLX requires macOS 26.2+ with RDMA enabled locally via Recovery. JACCL uses a **full mesh**, not a physical ring: 6 cables per 4-node cluster. | RDMA devices, negotiated link performance, collective latency, reliability |
| MLX-LM inference | MLX documents distributed inference and JACCL tools. | Compatibility of chosen checkpoints, multi-rank HTTP serving, 64K/128K contexts, tool calls and concurrent workloads |
| Model-memory calculator | Weight estimate uses total stored parameters; tests cover 671B MoE sizing and four-rank arithmetic. | Actual model formats, tensor distribution, runtime overhead and KV cache |
| Proxmox service plane | Static inventory of 6 VMs, allocation totals and reference IDs covered by tests. | Deployed host, backups, failover, security configuration and integrations |
| Network | VLAN and isolated Thunderbolt design documented; addresses redacted. | Switch/port configuration, firewall policy, routing, cable mapping |
| Observability | Synthetic OTel/Prometheus/Loki/Tempo/Grafana examples present. | Live scraping, logs, trace propagation, retention and alert routing |
| Web deployment | React/Vite source, Bun lockfile, Pages workflow, asset-path verifier and favicon available. | Runtime browser behavior and Pages publication must be checked after PR deployment |

### Changes incorporated in this audit

- Corrected "M4 Ultra" and mixed-generation hardware values to match the **M5 Ultra option** in the plan; moved unknown power usage to **TBD**.
- Replaced incorrect four-node physical RDMA rings with **JACCL-compatible full meshes**. Budget **18 Thunderbolt 5 cables across three clusters** and three direct peer links per node.
- Clarified that 896 GB is an assumed *summed wired-memory budget*, not a single remotely addressable memory pool. Likewise, 4.8 TB/s is summed **local** memory bandwidth.
- Removed hardcoded model layer partitioning and claims of measured token throughput or collective latency; four-rank tensor support varies by model and software version.
- Separated DeepSeek-V3 **671B total stored** parameters from active MoE parameters; these cannot be substituted in the weight-footprint calculator.
- Replaced misleading copy/paste shell examples with read-only inspection and MLX-managed network discovery steps. Do not blindly change Metal memory sysctls.
- Corrected the conceptual embedding-to-Qdrant data path, removed duplicated global ResizeObserver suppression, and added code/data integrity and favicon tests.
- Kept all dynamic metrics **synthetic** and the site explicitly **planning-only**.

## Hardware acceptance checklist

### 1. Inventory and safe baseline

- [ ] Record all 12 Mac model identifiers, memory sizes, GPU/CPU SKUs, macOS versions, MLX/MLX-LM/JACCL versions and Python environments.
- [ ] Confirm every proposed M5 Ultra uses the modeled **36-CPU / 80-GPU / 256-GB** configuration; adjust the source if hardware differs.
- [ ] Enable FileVault, restrict SSH to an admin segment, use separate service accounts, verify software provenance and establish update/rollback plans.
- [ ] Measure idle/prefill/decode wall power, noise and thermal throttling. Rack power/cooling must use **measured** numbers.
- [ ] Record memory pressure and Metal allocations under long prompts and concurrency. The 224 GB/node allowance is **not a verified system limit**.

### 2. JACCL fabric validation

- [ ] Use macOS 26.2 or newer and matching MLX/JACCL versions.
- [ ] Cable every node directly to each other within a cluster (**six pairs**, not four ring edges). Keep management/SSH reachable over Ethernet.
- [ ] Follow the [official MLX JACCL guide](https://github.com/ml-explore/mlx/blob/main/docs/src/usage/distributed.rst) to enable RDMA in macOS Recovery with `rdma_ctl enable` on each machine, reboot, then verify with `ibv_devices`.
- [ ] Visualize actual cabling with `mlx.distributed_config --hosts ... --over thunderbolt --dot`, including interface-to-peer mapping.
- [ ] Generate a hostfile via `mlx.distributed_config --backend jaccl --hosts ... --over thunderbolt --output hosts.json`. Review the generated setup before applying changes. `--auto-setup` requires passwordless sudo; treat it as a separate approval.
- [ ] Run a small collective and then a supported model via `mlx.launch --backend jaccl --hostfile hosts.json -- ...`.
- [ ] Benchmark p50/p95/p99 collective latency, link throughput and model output correctness; test unplugged cables, missing ranks, model crash and restart.
- [ ] Do not treat a distributed four-rank model as **highly available** unless failure recovery has been demonstrated.

### 3. Inference acceptance

For each actual checkpoint:

- [ ] Record model repo/revision/checksum, usage rights, **total** parameter count, on-disk size, quantization and supported context.
- [ ] Validate correctness on one node before distributed tests; compare actual outputs under the same prompt and sampling settings.
- [ ] Test model load, RSS/wired memory, KV cache, prefill, TTFT, decode tok/s, context truncation and OOM behavior at 8K/32K/64K/128K **where supported**.
- [ ] Verify distributed tensor compatibility, rank allocation and all collective operations against the exact MLX-LM release.
- [ ] Through LiteLLM, test OpenAI-compatible streaming, JSON/tool-call behavior where available, cancellation, backpressure, concurrency, rate limits and timeout handling.
- [ ] Independently test gateway balancing/failover for **replicated** models; record throughput and error rates rather than assuming them.

## Service-plane acceptance matrix

| Service | Minimum validation before labeling operational |
| --- | --- |
| Proxmox | Six VMs boot; CPU/RAM and ZFS capacity budget; VLAN firewall tests; VM backup **and restore** drill |
| LiteLLM | TLS, scoped keys, gateway routing, health checks, budgets/rate limits, secrets management, rollback |
| n8n | Queue mode coordinator/worker separation, PostgreSQL state, persistent Redis queue, encryption-key backup, idempotent retry and worker failure |
| PostgreSQL | Isolated DB roles, TLS, restricted ingress, backup retention, restore test and connection limits |
| Redis | Distinct persistent job queue and ephemeral cache/eviction policy; test AOF/restart and queue recovery |
| Qdrant | Embedding dimension consistency, vector schema, tenant ACL filtering by **caller**, snapshot/restore and retrieval quality |
| MCP servers | Scoped tokens, egress allowlists, auditable actions, isolated execution, prompt-injection/SSRF testing |
| OpenTelemetry | OTLP receivers/exporters, redaction, attributes, dropped-span rate, storage budgeting and retries |
| Prometheus / Grafana | Service scrape, cardinality controls, alert routes, dashboards, viewer RBAC and no exposed admin access |
| Loki / Tempo | Trace-ID correlation, retention, sensitive-data scrubbing, resource pressure and failure handling |
| Network | Deny-by-default inter-VLAN rules, documented approved flows, backup isolation, DNS/certificates and no public infra API exposure |

These are **proposed acceptance gates**, not tests performed against infrastructure.

## Reproducible repository checks

```bash
bun install --frozen-lockfile
bun run lint
bun test
bun run build
VITE_BASE_PATH=/AI-Lab-Overview/ bun run build
VITE_BASE_PATH=/AI-Lab-Overview/ node scripts/verify-pages-build.mjs
```

The built-asset verifier checks the mount point, generated JS/CSS, local asset base paths, existence of the favicon, and replacement of Vite's `%BASE_URL%` placeholder. Unit tests cover architecture data references and computations. Neither suite establishes physical compatibility.

## Primary evidence

- [Apple M5 Ultra Mac Studio specifications](https://support.apple.com/en-us/128107)
- [Apple August 2026 M5 Ultra introduction](https://www.apple.com/newsroom/2026/08/apple-introduces-new-mac-studio-with-m5-max-and-m5-ultra/)
- [Apple RDMA over Thunderbolt technote](https://developer.apple.com/documentation/technotes/tn3205-low-latency-communication-with-rdma-over-thunderbolt)
- [MLX distributed/JACCL full-mesh documentation](https://github.com/ml-explore/mlx/blob/main/docs/src/usage/distributed.rst)
- [MLX hostfile/distributed configuration](https://github.com/ml-explore/mlx/blob/main/docs/src/usage/launching_distributed.rst)
- [MLX-LM serving guide](https://github.com/ml-explore/mlx-lm/blob/main/mlx_lm/SERVER.md)
- [LiteLLM production practices](https://docs.litellm.ai/docs/proxy/prod)
- [n8n queue-mode guide](https://docs.n8n.io/hosting/scaling/queue-mode/)

When software versions, SKU availability or measurements change, update this document and rerun the checks. **Never present theoretical planning numbers as observed benchmarks.**
