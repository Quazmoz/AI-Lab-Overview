import React, { useState } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  FileText,
  GitCommitHorizontal,
  LineChart as LineChartIcon,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { defaultInfrastructureProvider } from '@/src/services/infrastructureAdapter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import { cn } from '@/src/lib/utils';

interface ObservabilityPageProps {
  onSelectService: (serviceId: string) => void;
}

export const ObservabilityPage: React.FC<ObservabilityPageProps> = ({
  onSelectService,
}) => {
  const telemetry = defaultInfrastructureProvider.getTelemetrySnapshot();
  const [selectedTraceId, setSelectedTraceId] = useState<string>(
    telemetry.traces[0].id
  );
  const [logFilter, setLogFilter] = useState<string>('');

  const activeTrace =
    telemetry.traces.find((t) => t.id === selectedTraceId) ?? telemetry.traces[0];

  const filteredLogs = telemetry.logs.filter((l) => {
    const q = logFilter.trim().toLowerCase();
    if (!q) return true;
    return `${l.service} ${l.host} ${l.severity} ${l.message} ${l.traceId}`
      .toLowerCase()
      .includes(q);
  });

  const kpiList = Object.values(telemetry.kpis);

  return (
    <div className="space-y-6">
      {/* Unmistakable Simulated Demo Data Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-500/40 bg-amber-950/20 px-5 py-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Observability Architecture Preview — Simulated Demo Telemetry Only
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
              No live infrastructure is deployed or connected. All charts, counters, Loki log lines, and Grafana Tempo traces below use deterministic demo data to illustrate how <strong className="text-foreground">ai-monitoring-01</strong> will monitor the platform once provisioned.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onSelectService('svc-otel')}
          className="text-xs font-mono text-cyan-400 hover:text-cyan-300 whitespace-nowrap shrink-0 cursor-pointer"
        >
          Inspect OTel Config →
        </button>
      </div>

      {/* Section: Telemetry Processing (OpenTelemetry Collector Pipeline) */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-teal-400" />
              <CardTitle>Telemetry Processing: OpenTelemetry Collector Pipeline</CardTitle>
            </div>
            <span className="font-mono text-[11px] text-muted-foreground">
              ai-monitoring-01 · OTLP :4317 / :4318
            </span>
          </div>
          <CardDescription>
            Vendor-neutral ingestion scrubbing sensitive auth/prompt fields before fanning out signals to Prometheus, Loki, and Tempo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-2 items-center text-xs">
            <div className="md:col-span-2 rounded-lg border border-border bg-muted/35 p-3">
              <div className="font-semibold text-foreground">1. Instrumented Sources</div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                LiteLLM · MLX Wrapper · n8n Workers · Qdrant · MCP Servers · Host Exporters
              </p>
            </div>
            <div className="hidden md:flex justify-center text-teal-400">
              <ArrowRight className="h-4 w-4" />
            </div>
            <div className="md:col-span-2 rounded-lg border border-teal-500/40 bg-teal-950/20 p-3">
              <div className="font-semibold text-teal-300">2. OpenTelemetry Collector</div>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                receivers: [otlp] → processors: [memory_limiter, redact_keys, batch]
              </p>
            </div>
            <div className="hidden md:flex justify-center text-teal-400">
              <ArrowRight className="h-4 w-4" />
            </div>
            <div className="md:col-span-1 rounded-lg border border-border bg-muted/35 p-3 space-y-1 font-mono text-[11px]">
              <div className="text-cyan-400">→ Prometheus</div>
              <div className="text-amber-400">→ Loki</div>
              <div className="text-violet-400">→ Tempo</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section: Metrics (Prometheus) — 12 Required Indicators + 4 Recharts Panels */}
      <section className="space-y-4" aria-label="Prometheus Metrics">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LineChartIcon className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-foreground">
              Metrics: Prometheus (Simulated Demo Values)
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onSelectService('svc-prometheus')}
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 cursor-pointer"
          >
            prometheus.yml →
          </button>
        </div>

        {/* 12 Required KPI Stat Cells */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
          {kpiList.map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-lg border border-border bg-card p-3.5"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] text-muted-foreground truncate">
                  {kpi.label}
                </span>
                <span className="font-mono text-[9px] text-amber-400/90 shrink-0">
                  DEMO
                </span>
              </div>
              <div className="mt-1.5 font-mono text-base font-semibold text-foreground tabular-nums">
                {kpi.value}
              </div>
              <div className="mt-1 text-[10px] text-muted-foreground truncate">
                {kpi.sublabel}
              </div>
            </div>
          ))}
        </div>

        {/* Grafana-Style Time-Series Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>Inference Throughput & Tokens/sec (Demo)</CardTitle>
                <span className="font-mono text-[10px] text-muted-foreground">Simulated</span>
              </div>
              <CardDescription>
                Aggregate cluster decode tok/s vs concurrent active requests.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <ResponsiveContainer width="100%" height={220} minWidth={0} minHeight={0} debounce={50}>
                <AreaChart data={telemetry.series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f1624',
                      borderColor: '#334155',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Area
                    isAnimationActive={false}
                    type="monotone"
                    dataKey="tokensPerSec"
                    name="Tokens / sec"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.2}
                  />
                  <Area
                    isAnimationActive={false}
                    type="monotone"
                    dataKey="concurrentRequests"
                    name="Concurrent Requests"
                    stroke="#06b6d4"
                    fill="#06b6d4"
                    fillOpacity={0.18}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>Time to First Token (TTFT) & MCP Tool Latency (Demo)</CardTitle>
                <span className="font-mono text-[10px] text-muted-foreground">Simulated</span>
              </div>
              <CardDescription>
                Milliseconds latency for MLX prompt prefill vs MCP Streamable HTTP tool calls.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <ResponsiveContainer width="100%" height={220} minWidth={0} minHeight={0} debounce={50}>
                <LineChart data={telemetry.series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} unit="ms" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f1624',
                      borderColor: '#334155',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Line
                    isAnimationActive={false}
                    type="monotone"
                    dataKey="ttftMs"
                    name="TTFT (ms)"
                    stroke="#22d3ee"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    isAnimationActive={false}
                    type="monotone"
                    dataKey="mcpLatencyMs"
                    name="MCP Tool Latency (ms)"
                    stroke="#14b8a6"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>Unified Memory Allocation by Mac Studio Cluster (Demo)</CardTitle>
                <span className="font-mono text-[10px] text-muted-foreground">Simulated</span>
              </div>
              <CardDescription>
                Wired Metal/MLX memory (GB) across Cluster 1 (Reasoning / MoE), Cluster 2 (Throughput), and Cluster 3 (Multimodal / RAG) (1,024 GB RAM per cluster).
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <ResponsiveContainer width="100%" height={220} minWidth={0} minHeight={0} debounce={50}>
                <BarChart data={telemetry.series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis domain={[0, 1024]} tick={{ fill: '#94a3b8', fontSize: 11 }} unit="GB" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f1624',
                      borderColor: '#334155',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar isAnimationActive={false} dataKey="cluster1MemoryGb" name="Cluster 1: Reasoning (GB)" fill="#8b5cf6" />
                  <Bar isAnimationActive={false} dataKey="cluster2MemoryGb" name="Cluster 2: Throughput (GB)" fill="#38bdf8" />
                  <Bar isAnimationActive={false} dataKey="cluster3MemoryGb" name="Cluster 3: Multimodal/RAG (GB)" fill="#14b8a6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>Redis Queue Depth & PostgreSQL Connections % (Demo)</CardTitle>
                <span className="font-mono text-[10px] text-muted-foreground">Simulated</span>
              </div>
              <CardDescription>
                n8n BullMQ waiting jobs and PostgreSQL pool utilization on ai-data-01.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <ResponsiveContainer width="100%" height={220} minWidth={0} minHeight={0} debounce={50}>
                <LineChart data={telemetry.series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f1624',
                      borderColor: '#334155',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Line
                    isAnimationActive={false}
                    type="monotone"
                    dataKey="redisQueueDepth"
                    name="Redis Queue Jobs"
                    stroke="#f59e0b"
                    strokeWidth={2}
                  />
                  <Line
                    isAnimationActive={false}
                    type="monotone"
                    dataKey="pgConnectionsPct"
                    name="PG Pool Util (%)"
                    stroke="#a855f7"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Section: Distributed Traces (Grafana Tempo) */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <GitCommitHorizontal className="h-4 w-4 text-violet-400" />
              <div>
                <CardTitle>Distributed Traces: Grafana Tempo (Simulated Waterfalls)</CardTitle>
                <CardDescription>
                  Switch between direct OpenAI gateway inference and multi-hop n8n + MCP + Qdrant agent execution.
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {telemetry.traces.map((tr, i) => (
                <button
                  key={tr.id}
                  type="button"
                  onClick={() => setSelectedTraceId(tr.id)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap',
                    selectedTraceId === tr.id
                      ? 'bg-violet-500/20 text-violet-200 border border-violet-400/40'
                      : 'border border-border bg-muted text-muted-foreground hover:text-foreground'
                  )}
                >
                  Trace {i + 1}: {i === 0 ? 'Direct Inference' : 'AI Workflow'}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/40 px-3.5 py-2.5 text-xs">
            <div className="font-medium text-foreground">{activeTrace.routeSummary}</div>
            <div className="flex items-center gap-3 font-mono text-[11px] text-muted-foreground">
              <span>trace_id={activeTrace.traceId}</span>
              <span>·</span>
              <span className="text-cyan-400">{activeTrace.totalDurationMs} ms total</span>
              <span>·</span>
              <span>{activeTrace.status}</span>
            </div>
          </div>

          {/* Span Waterfall */}
          <div className="space-y-2.5">
            {activeTrace.spans.map((span) => {
              const leftPct = (span.startOffsetMs / activeTrace.totalDurationMs) * 100;
              const widthPct = Math.max(
                2,
                (span.durationMs / activeTrace.totalDurationMs) * 100
              );

              const barColor =
                span.color === 'violet'
                  ? 'bg-violet-500'
                  : span.color === 'amber'
                    ? 'bg-amber-500'
                    : span.color === 'blue'
                      ? 'bg-sky-400'
                      : 'bg-cyan-500';

              return (
                <div
                  key={span.id}
                  className="rounded-lg border border-border/80 bg-secondary/25 p-3 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{span.service}</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {span.operation}
                      </span>
                    </div>
                    <div className="font-mono text-[11px] text-foreground tabular-nums">
                      +{span.startOffsetMs}ms → {span.durationMs}ms ({span.host})
                    </div>
                  </div>

                  {/* Timeline Track */}
                  <div className="relative h-2.5 w-full rounded-full bg-slate-900 overflow-hidden">
                    <div
                      className={cn('absolute top-0 h-full rounded-full', barColor)}
                      style={{
                        left: `${leftPct}%`,
                        width: `${Math.min(100 - leftPct, widthPct)}%`,
                      }}
                    />
                  </div>

                  <div className="flex flex-wrap gap-3 font-mono text-[10px] text-muted-foreground">
                    {Object.entries(span.attributes).map(([k, v]) => (
                      <span key={k}>
                        {k}=<span className="text-foreground/90">{v}</span>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Section: Logs (Loki) + Target SLO Matrix */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <Card className="xl:col-span-7">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-amber-400" />
                <div>
                  <CardTitle>Logs: Grafana Loki (Simulated LogQL Stream)</CardTitle>
                  <CardDescription>
                    Correlated structured logs carrying OpenTelemetry trace_id metadata.
                  </CardDescription>
                </div>
              </div>
              <Input
                value={logFilter}
                onChange={(e) => setLogFilter(e.target.value)}
                placeholder="Filter simulated logs..."
                aria-label="Filter simulated Loki logs"
                className="h-8 w-full sm:w-52"
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-2 font-mono text-[11px]">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="rounded-md border border-border bg-slate-950/80 p-2.5 space-y-1"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400">
                  <div>
                    <span className="text-slate-500">{log.timestamp}</span>{' '}
                    <span
                      className={cn(
                        'font-semibold',
                        log.severity === 'WARN' ? 'text-amber-400' : 'text-cyan-400'
                      )}
                    >
                      {log.severity}
                    </span>{' '}
                    <span className="text-slate-200">{log.service}</span>@{log.host}
                  </div>
                  <span>trace={log.traceId.slice(0, 12)}…</span>
                </div>
                <div className="text-slate-300 leading-relaxed">{log.message}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="xl:col-span-5">
          <CardHeader className="pb-3">
            <CardTitle>Planned Synthetic Probes & Availability SLOs</CardTitle>
            <CardDescription>
              Simulated service availability targets monitored by Prometheus Blackbox & health checks.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-2 pr-2 font-medium">Service</th>
                  <th className="py-2 px-2 font-medium">Probe</th>
                  <th className="py-2 pl-2 font-medium text-right">Demo SLO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {telemetry.availability.map((item) => (
                  <tr key={item.service}>
                    <td className="py-2.5 pr-2">
                      <div className="font-medium text-foreground">{item.service}</div>
                      <div className="font-mono text-[10px] text-muted-foreground">
                        {item.vmOrHost}
                      </div>
                    </td>
                    <td className="py-2.5 px-2 font-mono text-[10px] text-muted-foreground">
                      {item.probeMethod}
                    </td>
                    <td className="py-2.5 pl-2 font-mono text-[11px] text-right text-teal-400 tabular-nums">
                      {item.simulatedUptime}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
