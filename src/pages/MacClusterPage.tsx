import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeftRight,
  CheckCircle2,
  Cpu,
  Info,
  Layers,
  Network,
  Server,
  Split,
  Zap,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArchitectureConfig, InferenceMode, MacCluster, PhysicalNode } from '@/src/types/architecture';
import {
  calculateModelMemoryPlan,
  QuantizationPrecision,
} from '@/src/utils/architectureLogic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { cn } from '@/src/lib/utils';

interface MacClusterPageProps {
  config: ArchitectureConfig;
  inferenceMode: InferenceMode;
  onChangeInferenceMode: (mode: InferenceMode) => void;
  onSelectService: (serviceId: string) => void;
}

const MODEL_PRESETS: Array<{ label: string; paramsB: number; category: string }> = [
  { label: 'Qwen3-30B-A3B / Coder-32B (30B)', paramsB: 30, category: '8B–30B' },
  { label: 'Llama-3.3-70B-Instruct (70B)', paramsB: 70, category: '70B' },
  { label: 'Mistral-Large / Command-A (150B)', paramsB: 150, category: '100B–200B' },
  { label: 'Llama-3.1-405B (405B total)', paramsB: 405, category: '400B+' },
  { label: 'DeepSeek-V3 MoE (671B total)', paramsB: 671, category: '400B+' },
];

const CONTEXT_OPTIONS = [
  { label: '8K Tokens', value: 8192 },
  { label: '32K Tokens', value: 32768 },
  { label: '64K Tokens', value: 65536 },
  { label: '128K Tokens', value: 131072 },
];

export const MacClusterPage: React.FC<MacClusterPageProps> = ({
  config,
  inferenceMode,
  onChangeInferenceMode,
  onSelectService,
}) => {
  const allMacNodes = config.physicalNodes.filter((n) => n.nodeType === 'mac-studio');
  const clusters = config.macClusters || [];

  const [selectedClusterId, setSelectedClusterId] = useState<string>('mac-cluster-01');
  const [selectedParamsB, setSelectedParamsB] = useState<number>(671);
  const [quantization, setQuantization] = useState<QuantizationPrecision>('Q4_K_M');
  const [contextTokens, setContextTokens] = useState<number>(32768);

  const activeCluster: MacCluster | undefined = clusters.find((c) => c.id === selectedClusterId) || clusters[0];
  const isFleetOverview = selectedClusterId === 'fleet';

  // Current cluster nodes (4 nodes)
  const currentClusterNodes: PhysicalNode[] = useMemo(() => {
    if (isFleetOverview) return allMacNodes;
    return allMacNodes.filter((n) => n.clusterId === selectedClusterId);
  }, [allMacNodes, selectedClusterId, isFleetOverview]);

  // Illustrative single-model plan: distributed inference is scoped to four peers.
  const memoryPlan = useMemo(
    () =>
      calculateModelMemoryPlan(
        selectedParamsB,
        quantization,
        contextTokens,
        inferenceMode,
        4
      ),
    [selectedParamsB, quantization, contextTokens, inferenceMode]
  );

  // Bar chart data for the current 4 nodes (or all 12 nodes in fleet view)
  const chartData = useMemo(() => {
    const nodesToChart = isFleetOverview ? allMacNodes : currentClusterNodes;
    const perNodeFactor = inferenceMode === InferenceMode.Distributed ? 1 / 4 : 1;

    const weights = Number((memoryPlan.weightsGb * perNodeFactor).toFixed(1));
    const kvCache = Number((memoryPlan.kvCacheGb * perNodeFactor).toFixed(1));
    const runtime = Number((memoryPlan.runtimeOverheadGb * perNodeFactor).toFixed(1));
    const osReserved = 32;

    return nodesToChart.map((node) => ({
      node: node.hostname,
      ModelWeights: weights,
      KVCache: kvCache,
      MLXOverhead: runtime,
      macOSReserved: osReserved,
    }));
  }, [memoryPlan, inferenceMode, currentClusterNodes, allMacNodes, isFleetOverview]);

  // 16 visual blocks for 4 shards: 4 blocks per node (25% each)
  const shardBlocks = Array.from({ length: 4 }, (_, idx) => idx + 1);

  return (
    <div className="space-y-6">
      {/* Top Banner: 3 Clusters × 4 Nodes = 12 Nodes Total / 3,072 GB RAM */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-xl border border-border bg-card p-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <span className="text-violet-400 font-semibold">Zone C</span>
            <span aria-hidden="true">·</span>
            <span>Bare-Metal Apple Silicon Compute</span>
            <span aria-hidden="true">·</span>
            <span className="text-cyan-400">3 Clusters · 12 Nodes · 3,072 GB Unified Memory</span>
          </div>
          <h2 className="mt-1 text-lg font-semibold text-foreground">
            Mac Studio M5 Ultra Compute Fleet & Thunderbolt 5 RDMA Fabric
          </h2>
          <p className="mt-1 text-xs text-muted-foreground max-w-3xl leading-relaxed">
            Three proposed 4-node clusters (1,024 GB unified memory each, 256 GB per Mac). Each JACCL mesh needs six direct Thunderbolt 5 cables; model support, effective bandwidth and throughput require hardware validation.
          </p>
        </div>

        {/* Distributed vs Independent Replicas Mode Toggle */}
        <div
          role="group"
          aria-label="Cluster Execution Mode"
          className="inline-flex items-center rounded-lg border border-border bg-muted p-1 shrink-0"
        >
          <button
            type="button"
            onClick={() => onChangeInferenceMode(InferenceMode.Distributed)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap',
              inferenceMode === InferenceMode.Distributed
                ? 'bg-violet-500 text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Layers className="h-3.5 w-3.5" />
            Distributed (4 ranks)
          </button>
          <button
            type="button"
            onClick={() => onChangeInferenceMode(InferenceMode.Independent)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap',
              inferenceMode === InferenceMode.Independent
                ? 'bg-cyan-400 text-slate-950 shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Split className="h-3.5 w-3.5" />
            Independent Replicas
          </button>
        </div>
      </div>

      {/* Cluster Selector Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        {clusters.map((cluster) => {
          const active = selectedClusterId === cluster.id;
          return (
            <button
              key={cluster.id}
              type="button"
              onClick={() => setSelectedClusterId(cluster.id)}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer',
                active
                  ? 'border-violet-400 bg-violet-500/15 text-violet-200 shadow-sm'
                  : 'border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <Server className="h-3.5 w-3.5 text-violet-400" />
              <span>{cluster.name}</span>
              <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                4× 256G (1 TB)
              </span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setSelectedClusterId('fleet')}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer',
            isFleetOverview
              ? 'border-cyan-400 bg-cyan-500/15 text-cyan-200 shadow-sm'
              : 'border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground'
          )}
        >
          <Cpu className="h-3.5 w-3.5 text-cyan-400" />
          <span>Fleet Overview (All 12 Nodes)</span>
          <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            3,072 GB RAM
          </span>
        </button>
      </div>

      {/* Active Cluster Header Card */}
      {!isFleetOverview && activeCluster && (
        <Card className="border-violet-500/35 bg-violet-950/10">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-violet-500/20 px-2 py-0.5 font-mono text-xs font-semibold text-violet-300 border border-violet-400/30">
                    Cluster {activeCluster.clusterNumber}
                  </span>
                  <CardTitle className="text-base">{activeCluster.name}</CardTitle>
                </div>
                <CardDescription className="mt-1">{activeCluster.purpose}</CardDescription>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <div>
                  <span className="text-muted-foreground block text-[10px]">Total RAM</span>
                  <span className="font-semibold text-foreground text-sm">
                    {activeCluster.totalRamGb} GB (4× 256 GB)
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Wired Metal Pool</span>
                  <span className="font-semibold text-violet-300 text-sm">
                    {activeCluster.usableWiredGb} GB
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Memory Bandwidth</span>
                  <span className="font-semibold text-foreground text-sm">
                    {activeCluster.bandwidth}
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/60 text-xs">
              <span className="font-mono text-[11px] text-muted-foreground">Primary Model Roles:</span>
              {activeCluster.primaryModels.map((m) => (
                <span
                  key={m}
                  className="rounded-md border border-border bg-secondary/80 px-2 py-0.5 font-mono text-[11px] text-secondary-foreground"
                >
                  {m}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 4 Mac Studio Node Cards in the Cluster */}
      {!isFleetOverview && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {currentClusterNodes.map((node, idx) => (
            <Card key={node.id} className="flex flex-col justify-between border-slate-700/80">
              <CardHeader className="pb-3 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15 border border-violet-400/35 text-violet-300">
                      <Server className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="font-mono text-xs">{node.hostname}</CardTitle>
                      <CardDescription className="text-[11px]">Node {idx + 1} of 4</CardDescription>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectService(node.id)}
                    className="text-xs font-mono text-cyan-400 hover:text-cyan-300 cursor-pointer"
                  >
                    Specs →
                  </button>
                </div>
              </CardHeader>
              <CardContent className="pt-3.5 space-y-2 text-xs">
                <div className="flex justify-between gap-1">
                  <span className="text-muted-foreground">Memory</span>
                  <span className="font-mono font-semibold text-foreground">
                    256 GB Unified Memory
                  </span>
                </div>
                <div className="flex justify-between gap-1">
                  <span className="text-muted-foreground">Bandwidth</span>
                  <span className="font-mono text-foreground">1.2 TB/s rated</span>
                </div>
                <div className="flex justify-between gap-1">
                  <span className="text-muted-foreground">Processor</span>
                  <span className="text-right text-foreground truncate">Apple M5 Ultra (36-core)</span>
                </div>
                <div className="flex justify-between gap-1">
                  <span className="text-muted-foreground">GPU (Metal 3)</span>
                  <span className="text-right text-foreground">80-core GPU</span>
                </div>
                <div className="flex justify-between gap-1">
                  <span className="text-muted-foreground">10GbE Compute</span>
                  <span className="font-mono text-cyan-400">{node.computeIp}</span>
                </div>
                <div className="flex justify-between gap-1">
                  <span className="text-muted-foreground">TB5 RDMA Mesh</span>
                  <span className="font-mono text-sky-400">
                    {activeCluster?.tb5Subnet.replace('.0/24', `.${idx + 1}`)}
                  </span>
                </div>

                <div className="pt-2 border-t border-border">
                  <div
                    className={cn(
                      'rounded-md border p-2 font-mono text-[10px] leading-tight',
                      inferenceMode === InferenceMode.Distributed
                        ? 'border-violet-500/35 bg-violet-950/20 text-violet-200'
                        : 'border-cyan-500/35 bg-cyan-950/20 text-cyan-200'
                    )}
                  >
                    <div className="font-semibold">
                      {inferenceMode === InferenceMode.Distributed
                        ? `Shard ${idx} · Rank ${idx}`
                        : `Replica ${String.fromCharCode(65 + idx)} · Independent`}
                    </div>
                    <div className="text-muted-foreground mt-0.5">
                      {inferenceMode === InferenceMode.Distributed
                        ? 'Illustrative 25% tensor/weight allocation; model-specific'
                        : 'Complete replica; gateway failover requires testing'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Thunderbolt 5 RDMA 4-Node Mesh Fabric Panel */}
      {!isFleetOverview && activeCluster && (
        <Card className="border-sky-500/40 bg-sky-950/15">
          <CardContent className="pt-5 pb-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20 border border-sky-400/40 text-sky-300 shrink-0">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <span>Thunderbolt 5 Point-to-Point 4-Node Full Mesh</span>
                    <span className="rounded bg-sky-500/20 px-2 py-0.5 font-mono text-[10px] text-sky-300">
                      80 Gb/s nominal · RDMA TBD
                    </span>
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                    Six Thunderbolt 5 cables connect every pair of Macs in {activeCluster.name}. Each cable has its own peer interface; JACCL requires macOS 26.2+ and local Recovery-mode enablement. Effective throughput must be benchmarked.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 font-mono text-xs shrink-0 rounded-lg border border-border bg-card/80 p-2.5">
                <span className="text-sky-300 font-semibold">4 nodes · 6 direct links</span>
                <ArrowLeftRight className="h-3.5 w-3.5 text-sky-400" />
                <span className="text-muted-foreground">3 peers per node</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fleet Overview Comparison Grid (when Fleet Overview selected) */}
      {isFleetOverview && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {clusters.map((c) => (
              <Card key={c.id} className="border-border hover:border-violet-400/60 transition-colors">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-violet-500/20 px-2 py-0.5 font-mono text-xs font-semibold text-violet-300 border border-violet-400/30">
                      Cluster {c.clusterNumber}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">4 Nodes · 1,024 GB</span>
                  </div>
                  <CardTitle className="text-sm mt-1">{c.name}</CardTitle>
                  <CardDescription className="text-xs">{c.purpose}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Usable Wired Pool</span>
                    <span className="font-mono text-violet-300 font-semibold">{c.usableWiredGb} GB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">TB5 RDMA Interconnect</span>
                    <span className="font-mono text-sky-400">Full mesh · 6 cables</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">VLAN Subnet</span>
                    <span className="font-mono text-cyan-400">{c.vlanSubnet}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedClusterId(c.id)}
                    className="w-full mt-3 rounded-md border border-violet-500/40 bg-violet-500/10 py-1.5 text-center text-xs font-medium text-violet-300 hover:bg-violet-500/20 transition-colors cursor-pointer"
                  >
                    Inspect Cluster {c.clusterNumber} →
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Aggregate Fleet Summary Bar */}
          <Card className="border-cyan-500/40 bg-cyan-950/15">
            <CardContent className="pt-4 pb-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
                <div>
                  <span className="block text-[11px] text-muted-foreground">Total Mac Studios</span>
                  <span className="text-base font-bold text-foreground">12 Nodes</span>
                </div>
                <div>
                  <span className="block text-[11px] text-muted-foreground">Combined RAM</span>
                  <span className="text-base font-bold text-cyan-300">3,072 GB (3.07 TB)</span>
                </div>
                <div>
                  <span className="block text-[11px] text-muted-foreground">Usable Wired Metal</span>
                  <span className="text-base font-bold text-violet-300">2,688 GB</span>
                </div>
                <div>
                  <span className="block text-[11px] text-muted-foreground">Apple Silicon GPU</span>
                  <span className="text-base font-bold text-foreground">960 Cores</span>
                </div>
                <div>
                  <span className="block text-[11px] text-muted-foreground">Aggregate Bandwidth</span>
                  <span className="text-base font-bold text-sky-400">~9.8 TB/s</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Model Sizing Calculator & Unified Memory Allocation Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interactive Model Sizing Controls & Calculations */}
        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle>4-Node Cluster Memory Sizing & Sharding Calculator</CardTitle>
            <CardDescription>
              Model memory footprints partitioned across a 4-node Mac Studio cluster (1,024 GB total Unified Memory, 896 GB usable wired Metal pool).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Model Presets */}
            <div>
              <label className="text-xs font-semibold text-foreground">Representative Model Tier</label>
              <div className="mt-1.5 grid grid-cols-2 sm:grid-cols-4 gap-2">
                {MODEL_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setSelectedParamsB(preset.paramsB)}
                    className={cn(
                      'rounded-lg border p-2 text-left text-xs transition-colors cursor-pointer',
                      selectedParamsB === preset.paramsB
                        ? 'border-violet-400 bg-violet-500/15 text-violet-100 font-medium'
                        : 'border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground'
                    )}
                  >
                    <div className="font-semibold truncate">{preset.label}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{preset.category}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quantization & Context Length */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground">Quantization Precision</label>
                <div className="mt-1.5 flex gap-2">
                  {(['FP16', 'Q8_0', 'Q4_K_M'] as QuantizationPrecision[]).map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setQuantization(q)}
                      className={cn(
                        'flex-1 rounded-md border py-1.5 font-mono text-xs transition-colors cursor-pointer',
                        quantization === q
                          ? 'border-cyan-400 bg-cyan-400/15 text-cyan-200 font-semibold'
                          : 'border-border bg-card text-muted-foreground hover:bg-secondary'
                      )}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Target Context Length</label>
                <div className="mt-1.5 flex gap-1.5">
                  {CONTEXT_OPTIONS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setContextTokens(c.value)}
                      className={cn(
                        'flex-1 rounded-md border py-1.5 font-mono text-xs transition-colors cursor-pointer',
                        contextTokens === c.value
                          ? 'border-cyan-400 bg-cyan-400/15 text-cyan-200 font-semibold'
                          : 'border-border bg-card text-muted-foreground hover:bg-secondary'
                      )}
                    >
                      {c.label.replace(' Tokens', '')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Numerical Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-lg border border-border bg-muted/30 p-3 font-mono">
              <div>
                <div className="text-[10px] font-sans text-muted-foreground">Model Weights</div>
                <div className="mt-1 text-sm font-semibold text-violet-300 tabular-nums">
                  {memoryPlan.weightsGb} GB
                </div>
              </div>
              <div>
                <div className="text-[10px] font-sans text-muted-foreground">KV Cache Pool</div>
                <div className="mt-1 text-sm font-semibold text-cyan-300 tabular-nums">
                  {memoryPlan.kvCacheGb} GB
                </div>
              </div>
              <div>
                <div className="text-[10px] font-sans text-muted-foreground">MLX Buffer Overhead</div>
                <div className="mt-1 text-sm font-semibold text-amber-400 tabular-nums">
                  {memoryPlan.runtimeOverheadGb} GB
                </div>
              </div>
              <div>
                <div className="text-[10px] font-sans text-muted-foreground">
                  {inferenceMode === InferenceMode.Distributed ? 'Per-Node (4 ranks)' : 'Single Node Required'}
                </div>
                <div
                  className={cn(
                    'mt-1 text-sm font-semibold tabular-nums',
                    memoryPlan.fitStatus === 'exceeds'
                      ? 'text-red-400'
                      : memoryPlan.fitStatus === 'tight'
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                  )}
                >
                  {memoryPlan.perNodeAllocatedGb} / 224 GB
                </div>
              </div>
            </div>

            {/* Status Verdict */}
            <div
              className={cn(
                'flex items-start gap-2.5 rounded-lg border p-3 text-xs',
                memoryPlan.fitStatus === 'exceeds'
                  ? 'border-red-500/40 bg-red-950/20 text-red-200'
                  : memoryPlan.fitStatus === 'tight'
                    ? 'border-amber-500/40 bg-amber-950/20 text-amber-200'
                    : 'border-emerald-500/35 bg-emerald-950/15 text-emerald-200'
              )}
            >
              {memoryPlan.fitStatus === 'exceeds' ? (
                <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              ) : memoryPlan.fitStatus === 'tight' ? (
                <Info className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              )}
              <div>
                {memoryPlan.fitStatus === 'exceeds' ? (
                  <span>
                    <strong>Exceeds Usable Memory ({memoryPlan.totalRequiredGb} GB required):</strong>{' '}
                    {inferenceMode === InferenceMode.Independent
                      ? 'Switch to Distributed Mode to shard across all 4 Mac Studios (896 GB usable pool per cluster) or select Q4_K_M quantization.'
                      : 'Exceeds the 896 GB usable wired pool of the 4-node cluster. Reduce context window or select lower quantization.'}
                  </span>
                ) : (
                  <span>
                    <strong>Estimated Memory Fit ({memoryPlan.utilizationPercent}% of assumed per-node budget):</strong>{' '}
                    {inferenceMode === InferenceMode.Distributed
                      ? `An even four-way split suggests ${memoryPlan.perNodeAllocatedGb} GB per Mac Studio; actual rank placement and KV cache depend on MLX and the model.`
                      : `Each Mac Studio could host a ${memoryPlan.totalRequiredGb} GB instance if the model and concurrency fit after measurement.`}
                  </span>
                )}
              </div>
            </div>

            {/* Visual Layer / Tensor Distribution */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">
                  Illustrative 4-Node Weight Distribution
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {inferenceMode === InferenceMode.Distributed
                    ? 'Assumed equal 4× 25% shards'
                    : '100% Replicated on Each Node'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((nodeNum) => {
                  const isDist = inferenceMode === InferenceMode.Distributed;
                  return (
                    <div key={nodeNum} className="rounded-lg border border-border bg-secondary/35 p-2.5">
                      <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
                        <span className="text-foreground font-semibold">Node {nodeNum}</span>
                        <span className="text-violet-300">
                          {isDist ? `Shard ${nodeNum - 1} (25%)` : 'Full Replica'}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                        {shardBlocks.map((b) => (
                          <div
                            key={b}
                            className={cn(
                              'h-5 rounded-xs flex items-center justify-center font-mono text-[9px]',
                              !isDist || b === nodeNum
                                ? 'bg-violet-500/35 border border-violet-400/50 text-violet-100'
                                : 'bg-muted/50 border border-border text-muted-foreground/40'
                            )}
                          >
                            S{b}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Per-Node Memory Utilization Bar Chart */}
        <Card className="lg:col-span-5 flex flex-col">
          <CardHeader>
            <CardTitle>Unified Memory Allocation Per Node (GB)</CardTitle>
            <CardDescription>
              Estimated allocation against a proposed 224 GB/node usable budget; real wired limits, KV cache, and memory pressure depend on the macOS build and model.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height={300} minWidth={0} minHeight={0} debounce={50}>
              <BarChart data={chartData} margin={{ top: 16, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="node" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis domain={[0, 280]} tick={{ fill: '#94a3b8', fontSize: 11 }} unit=" GB" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f1624',
                    borderColor: '#334155',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <ReferenceLine
                  y={256}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  label={{
                    value: '256 GB Physical Ceiling',
                    fill: '#f87171',
                    fontSize: 10,
                    position: 'top',
                  }}
                />
                <Bar isAnimationActive={false} dataKey="ModelWeights" name="Weights" stackId="a" fill="#8b5cf6" />
                <Bar isAnimationActive={false} dataKey="KVCache" name="KV Cache" stackId="a" fill="#06b6d4" />
                <Bar isAnimationActive={false} dataKey="MLXOverhead" name="MLX Buffers" stackId="a" fill="#f59e0b" />
                <Bar isAnimationActive={false} dataKey="macOSReserved" name="macOS Headroom" stackId="a" fill="#334155" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Model Size Categories Inventory Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Planned Model Size Categories & Serving Matrix</CardTitle>
              <CardDescription>
                Reference sizing across 8B–30B, 70B, 100B–200B, and 400B+ parameter tiers on 3 clusters with 4 nodes each (256 GB RAM each).
              </CardDescription>
            </div>
            <Cpu className="h-4 w-4 text-violet-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-2.5 pr-4 font-medium">Size Category</th>
                  <th className="py-2.5 px-4 font-medium">Candidate Models (Examples)</th>
                  <th className="py-2.5 px-4 font-medium text-right">Est. 4-Bit</th>
                  <th className="py-2.5 px-4 font-medium text-right">Est. 8-Bit</th>
                  <th className="py-2.5 px-4 font-medium">Single Mac (256 GB)</th>
                  <th className="py-2.5 px-4 font-medium">4-Node Cluster (1,024 GB)</th>
                  <th className="py-2.5 pl-4 font-medium">Target Cluster Assignment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {config.modelCategories.map((cat, idx) => (
                  <tr key={cat.id} className="hover:bg-accent/30 transition-colors">
                    <td className="py-3 pr-4 font-mono font-semibold text-foreground whitespace-nowrap">
                      {cat.rangeLabel}
                    </td>
                    <td className="py-3 px-4 text-foreground">
                      {cat.exampleModels.join(' · ')}
                    </td>
                    <td className="py-3 px-4 font-mono text-right text-cyan-300 whitespace-nowrap tabular-nums">
                      {cat.estimatedFootprintQ4Gb}
                    </td>
                    <td className="py-3 px-4 font-mono text-right text-violet-300 whitespace-nowrap tabular-nums">
                      {cat.estimatedFootprintQ8Gb}
                    </td>
                    <td className="py-3 px-4 font-mono whitespace-nowrap">
                      {cat.singleNodeViable ? (
                        <span className="text-emerald-400">Viable (Standalone)</span>
                      ) : (
                        <span className="text-amber-400">Requires Cluster Sharding</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono whitespace-nowrap text-foreground">
                      <span className="text-amber-400 font-medium">Validate on hardware</span>
                    </td>
                    <td className="py-3 pl-4 text-muted-foreground max-w-md leading-relaxed font-mono">
                      {idx === 0
                        ? 'Cluster 2 (Throughput Replicas)'
                        : idx === 1
                          ? 'Cluster 2 (Replicas) or Cluster 3 (Vision)'
                          : idx === 2
                            ? 'Cluster 1 (Sharded) or Cluster 2'
                            : 'Cluster 1 (four-rank distributed candidate)'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
