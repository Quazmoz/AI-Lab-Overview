export interface TelemetryTimePoint {
  time: string;
  reqPerSec: number;
  ttftMs: number;
  tokensPerSec: number;
  e2eLatencySec: number;
  errorRatePct: number;
  concurrentRequests: number;
  cluster1MemoryGb: number;
  cluster2MemoryGb: number;
  cluster3MemoryGb: number;
  mac01MemoryGb: number;
  mac02MemoryGb: number;
  n8nDurationSec: number;
  redisQueueDepth: number;
  pgConnectionsPct: number;
  mcpLatencyMs: number;
}

export interface SimulatedLogEntry {
  id: string;
  timestamp: string;
  service: string;
  host: string;
  severity: 'INFO' | 'WARN' | 'DEBUG';
  traceId: string;
  message: string;
}

export interface TraceSpan {
  id: string;
  service: string;
  operation: string;
  host: string;
  startOffsetMs: number;
  durationMs: number;
  color: 'cyan' | 'violet' | 'amber' | 'teal' | 'blue';
  attributes: Record<string, string>;
}

export interface SimulatedDistributedTrace {
  id: string;
  traceId: string;
  title: string;
  routeSummary: string;
  totalDurationMs: number;
  status: string;
  spans: TraceSpan[];
}

export interface SimulatedAvailabilityItem {
  service: string;
  vmOrHost: string;
  targetSlo: string;
  simulatedUptime: string;
  probeMethod: string;
}

export const DEMO_TELEMETRY_SERIES: TelemetryTimePoint[] = [
  {
    time: '14:00',
    reqPerSec: 4.2,
    ttftMs: 285,
    tokensPerSec: 68,
    e2eLatencySec: 2.9,
    errorRatePct: 0.12,
    concurrentRequests: 8,
    cluster1MemoryGb: 685,
    cluster2MemoryGb: 510,
    cluster3MemoryGb: 320,
    mac01MemoryGb: 186,
    mac02MemoryGb: 184,
    n8nDurationSec: 4.1,
    redisQueueDepth: 3,
    pgConnectionsPct: 22,
    mcpLatencyMs: 64,
  },
  {
    time: '14:05',
    reqPerSec: 5.8,
    ttftMs: 310,
    tokensPerSec: 74,
    e2eLatencySec: 3.1,
    errorRatePct: 0.15,
    concurrentRequests: 11,
    cluster1MemoryGb: 710,
    cluster2MemoryGb: 540,
    cluster3MemoryGb: 335,
    mac01MemoryGb: 192,
    mac02MemoryGb: 189,
    n8nDurationSec: 4.5,
    redisQueueDepth: 6,
    pgConnectionsPct: 26,
    mcpLatencyMs: 71,
  },
  {
    time: '14:10',
    reqPerSec: 7.4,
    ttftMs: 365,
    tokensPerSec: 86,
    e2eLatencySec: 3.6,
    errorRatePct: 0.21,
    concurrentRequests: 15,
    cluster1MemoryGb: 745,
    cluster2MemoryGb: 580,
    cluster3MemoryGb: 360,
    mac01MemoryGb: 201,
    mac02MemoryGb: 198,
    n8nDurationSec: 5.2,
    redisQueueDepth: 11,
    pgConnectionsPct: 31,
    mcpLatencyMs: 85,
  },
  {
    time: '14:15',
    reqPerSec: 9.1,
    ttftMs: 420,
    tokensPerSec: 94,
    e2eLatencySec: 4.1,
    errorRatePct: 0.34,
    concurrentRequests: 19,
    cluster1MemoryGb: 780,
    cluster2MemoryGb: 620,
    cluster3MemoryGb: 385,
    mac01MemoryGb: 212,
    mac02MemoryGb: 209,
    n8nDurationSec: 6.0,
    redisQueueDepth: 17,
    pgConnectionsPct: 38,
    mcpLatencyMs: 92,
  },
  {
    time: '14:20',
    reqPerSec: 8.3,
    ttftMs: 380,
    tokensPerSec: 89,
    e2eLatencySec: 3.7,
    errorRatePct: 0.18,
    concurrentRequests: 16,
    cluster1MemoryGb: 760,
    cluster2MemoryGb: 595,
    cluster3MemoryGb: 370,
    mac01MemoryGb: 208,
    mac02MemoryGb: 205,
    n8nDurationSec: 5.4,
    redisQueueDepth: 12,
    pgConnectionsPct: 34,
    mcpLatencyMs: 78,
  },
  {
    time: '14:25',
    reqPerSec: 6.5,
    ttftMs: 325,
    tokensPerSec: 79,
    e2eLatencySec: 3.2,
    errorRatePct: 0.11,
    concurrentRequests: 12,
    cluster1MemoryGb: 720,
    cluster2MemoryGb: 550,
    cluster3MemoryGb: 340,
    mac01MemoryGb: 196,
    mac02MemoryGb: 194,
    n8nDurationSec: 4.6,
    redisQueueDepth: 7,
    pgConnectionsPct: 28,
    mcpLatencyMs: 69,
  },
  {
    time: '14:30',
    reqPerSec: 5.9,
    ttftMs: 295,
    tokensPerSec: 76,
    e2eLatencySec: 3.0,
    errorRatePct: 0.09,
    concurrentRequests: 10,
    cluster1MemoryGb: 695,
    cluster2MemoryGb: 525,
    cluster3MemoryGb: 325,
    mac01MemoryGb: 191,
    mac02MemoryGb: 188,
    n8nDurationSec: 4.3,
    redisQueueDepth: 4,
    pgConnectionsPct: 25,
    mcpLatencyMs: 63,
  },
];

export const DEMO_KPI_SNAPSHOT = {
  requestThroughput: { label: 'Request Throughput', value: '6.8 req/s', sublabel: 'Simulated peak 9.1 req/s' },
  ttft: { label: 'Time to First Token (P50)', value: '325 ms', sublabel: '8K prompt prefix cached' },
  tokensPerSec: { label: 'Tokens Generated / sec', value: '82.4 tok/s', sublabel: 'Aggregate cluster decode' },
  e2eLatency: { label: 'End-to-End Inference Latency', value: '3.24 s', sublabel: 'Mean 260 output tokens' },
  modelErrorRate: { label: 'Model Error Rate', value: '0.14%', sublabel: 'Rate-limit / timeout simulated' },
  concurrentRequests: { label: 'Concurrent Requests', value: '28 active', sublabel: 'Across 12 Mac Studio workers' },
  macMemoryUtil: { label: 'Cluster 1 Memory (Simulated)', value: '748 / 896 GB', sublabel: '4 nodes × 187 GB (DeepSeek-V3 4-bit)' },
  n8nDuration: { label: 'n8n Execution Duration', value: '4.6 s', sublabel: 'Multi-step agent workflow' },
  redisQueueDepth: { label: 'Redis Queue Depth', value: '7 jobs', sublabel: 'BullMQ persistent instance' },
  pgConnectionUtil: { label: 'PostgreSQL Connections', value: '28% (56/200)', sublabel: 'LiteLLM + n8n pools' },
  mcpToolLatency: { label: 'MCP Tool-Call Latency', value: '69 ms', sublabel: 'Streamable HTTP P50' },
  serviceAvailability: { label: 'Target Service Availability', value: '99.5% SLO', sublabel: 'Lab POC synthetic check' },
};

export const DEMO_DISTRIBUTED_TRACES: SimulatedDistributedTrace[] = [
  {
    id: 'trace-direct-inference',
    traceId: '7f9c4e12a8b04d3190e1c4a2',
    title: 'Sample Trace 1: Direct OpenAI-Compatible Inference',
    routeSummary: 'User Request → LiteLLM → MLX Inference → Response',
    totalDurationMs: 2840,
    status: '200 OK (Simulated)',
    spans: [
      {
        id: 't1-s1',
        service: 'Developer IDE Client',
        operation: 'POST /v1/chat/completions (stream=true)',
        host: 'corp-client-lan',
        startOffsetMs: 0,
        durationMs: 2840,
        color: 'cyan',
        attributes: { 'http.method': 'POST', 'llm.model': 'fabric-frontier-distributed', 'tokens.prompt': '1,420' },
      },
      {
        id: 't1-s2',
        service: 'LiteLLM Gateway',
        operation: 'auth.virtual_key + redis.ratelimit + route',
        host: 'ai-gateway-01',
        startOffsetMs: 12,
        durationMs: 34,
        color: 'amber',
        attributes: { 'ratelimit.remaining': '58/60 rpm', 'db.cache_hit': 'true', 'upstream': 'mac-ai-c1-01:8080' },
      },
      {
        id: 't1-s3',
        service: 'MLX Inference Server',
        operation: 'mlx.distributed.prefill (Cluster 1 4-Node Shard)',
        host: 'Cluster 1 (mac-ai-c1-01..04)',
        startOffsetMs: 48,
        durationMs: 292,
        color: 'violet',
        attributes: { 'mlx.backend': 'tb5-rdma-ring', 'ttft_ms': '340', 'kv_cache.reused_tokens': '1,024' },
      },
      {
        id: 't1-s4',
        service: 'Thunderbolt 5 RDMA Fabric',
        operation: 'all_reduce tensor sync (80 transformer layers)',
        host: 'tb5-ring-mesh',
        startOffsetMs: 65,
        durationMs: 245,
        color: 'blue',
        attributes: { 'interconnect': 'Thunderbolt 5 RDMA Ring', 'payload_mb': '148 MB', 'sync_latency_us': '190 us/op' },
      },
      {
        id: 't1-s5',
        service: 'MLX Inference Server',
        operation: 'mlx.decode_stream (218 tokens @ 87.2 tok/s)',
        host: 'Cluster 1 (mac-ai-c1-01..04)',
        startOffsetMs: 340,
        durationMs: 2490,
        color: 'violet',
        attributes: { 'tokens.completion': '218', 'decode_rate': '87.2 tok/s', 'finish_reason': 'stop' },
      },
    ],
  },
  {
    id: 'trace-agent-workflow',
    traceId: '3b8a91d0f4e2491cb7720e88',
    title: 'Sample Trace 2: Automated RAG + MCP Agent Workflow',
    routeSummary: 'n8n → MCP Tool → Qdrant → LiteLLM → MLX',
    totalDurationMs: 4620,
    status: '200 OK (Simulated)',
    spans: [
      {
        id: 't2-s1',
        service: 'n8n Workflow Engine',
        operation: 'workflow.execute (incident-triage-agent)',
        host: 'ai-automation-01',
        startOffsetMs: 0,
        durationMs: 4620,
        color: 'cyan',
        attributes: { 'n8n.execution_mode': 'queue', 'bullmq.worker': 'worker-02', 'trigger': 'webhook' },
      },
      {
        id: 't2-s2',
        service: 'MCP Servers',
        operation: 'mcp.call_tool (proxmox_get_vm_config)',
        host: 'ai-mcp-01',
        startOffsetMs: 45,
        durationMs: 118,
        color: 'cyan',
        attributes: { 'mcp.transport': 'streamable-http', 'policy.scope': 'read-only', 'target': 'pve-ai-host-01' },
      },
      {
        id: 't2-s3',
        service: 'Qdrant Vector DB',
        operation: 'qdrant.search (collection=eng_runbooks, top_k=6)',
        host: 'ai-rag-01',
        startOffsetMs: 175,
        durationMs: 28,
        color: 'amber',
        attributes: { 'hnsw.ef': '128', 'vectors.matched': '6', 'filter': 'dept=infra' },
      },
      {
        id: 't2-s4',
        service: 'LiteLLM Gateway',
        operation: 'POST /v1/chat/completions (grounded synthesis)',
        host: 'ai-gateway-01',
        startOffsetMs: 215,
        durationMs: 4360,
        color: 'cyan',
        attributes: { 'key.alias': 'n8n-prod-workflow', 'model': 'Llama-3.3-70B-Instruct-4bit' },
      },
      {
        id: 't2-s5',
        service: 'MLX Inference Server',
        operation: 'mlx_lm.generate (prompt=3,180 tok → output=310 tok)',
        host: 'Cluster 2 (mac-ai-c2-01)',
        startOffsetMs: 245,
        durationMs: 4315,
        color: 'violet',
        attributes: { 'ttft_ms': '410', 'tokens.output': '310', 'wired_mem_gb': '54.2 GB' },
      },
    ],
  },
];

export const DEMO_LOKI_LOGS: SimulatedLogEntry[] = [
  {
    id: 'log-1',
    timestamp: '14:29:51.104',
    service: 'litellm-proxy',
    host: 'ai-gateway-01',
    severity: 'INFO',
    traceId: '7f9c4e12a8b04d3190e1c4a2',
    message: '[SIMULATED] POST /v1/chat/completions model=fabric-frontier-distributed key_team=core-eng status=200 ttft_ms=340 total_tokens=1638',
  },
  {
    id: 'log-2',
    timestamp: '14:29:51.396',
    service: 'mlx-distributed',
    host: 'mac-ai-c1-01',
    severity: 'DEBUG',
    traceId: '7f9c4e12a8b04d3190e1c4a2',
    message: '[SIMULATED] cluster=mac-cluster-01 rank=0 peer=mac-ai-c1-02-tb5 transport=tb5-rdma-ring kv_prefix_hit=0.72 wired_mem_gb=186.4',
  },
  {
    id: 'log-3',
    timestamp: '14:29:44.812',
    service: 'n8n-worker',
    host: 'ai-automation-01',
    severity: 'INFO',
    traceId: '3b8a91d0f4e2491cb7720e88',
    message: '[SIMULATED] Completed workflow="Incident Triage RAG" job_id=4819 duration_ms=4620 mcp_calls=1 qdrant_hits=6',
  },
  {
    id: 'log-4',
    timestamp: '14:29:44.205',
    service: 'mcp-gateway',
    host: 'ai-mcp-01',
    severity: 'INFO',
    traceId: '3b8a91d0f4e2491cb7720e88',
    message: '[SIMULATED] Audit tool=proxmox_get_vm_config caller=ai-automation-01 decision=ALLOW latency_ms=118',
  },
  {
    id: 'log-5',
    timestamp: '14:28:19.042',
    service: 'redis-queues',
    host: 'ai-data-01',
    severity: 'WARN',
    traceId: '9a01bc44e21048f2a109c311',
    message: '[SIMULATED] Queue bull:n8n:jobs depth reached 17 waiting jobs during batch webhook burst; maxmemory-policy=noeviction intact',
  },
  {
    id: 'log-6',
    timestamp: '14:27:55.600',
    service: 'otel-collector',
    host: 'ai-monitoring-01',
    severity: 'INFO',
    traceId: '000000000000000000000000',
    message: '[SIMULATED] Batch processor exported 1,240 spans to tempo:4319 and 410 log records to loki:3100/otlp (auth headers redacted)',
  },
];

export const DEMO_SERVICE_AVAILABILITY: SimulatedAvailabilityItem[] = [
  { service: 'LiteLLM Gateway', vmOrHost: 'ai-gateway-01', targetSlo: '99.9%', simulatedUptime: '99.94%', probeMethod: 'GET /health/liveliness' },
  { service: 'MLX Inference Runtime', vmOrHost: 'Clusters 1 / 2 / 3 (12 Nodes)', targetSlo: '99.5%', simulatedUptime: '99.82%', probeMethod: 'GET /v1/models' },
  { service: 'PostgreSQL 16', vmOrHost: 'ai-data-01', targetSlo: '99.9%', simulatedUptime: '99.99%', probeMethod: 'pg_isready :5432' },
  { service: 'Redis 7 Broker', vmOrHost: 'ai-data-01', targetSlo: '99.9%', simulatedUptime: '99.98%', probeMethod: 'PING :6379' },
  { service: 'n8n Automation', vmOrHost: 'ai-automation-01', targetSlo: '99.5%', simulatedUptime: '99.89%', probeMethod: 'GET /healthz' },
  { service: 'Qdrant Vector Engine', vmOrHost: 'ai-rag-01', targetSlo: '99.5%', simulatedUptime: '99.91%', probeMethod: 'GET /readyz :6333' },
  { service: 'MCP Tool Hub', vmOrHost: 'ai-mcp-01', targetSlo: '99.5%', simulatedUptime: '99.87%', probeMethod: 'MCP initialize ping' },
  { service: 'OTel + LGTM Stack', vmOrHost: 'ai-monitoring-01', targetSlo: '99.5%', simulatedUptime: '99.95%', probeMethod: 'Collector :13133/health' },
];
