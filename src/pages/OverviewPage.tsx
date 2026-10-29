import React from 'react';
import {
  ArrowRight,
  CheckSquare,
  Cpu,
  HardDrive,
  Layers,
  Network,
  Server,
  Shield,
  Zap,
} from 'lucide-react';
import {
  ArchitectureConfig,
  InferenceMode,
  NavSection,
} from '@/src/types/architecture';
import {
  calculateProxmoxTotals,
  RoadmapProgressSummary,
} from '@/src/utils/architectureLogic';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Progress } from '@/src/components/ui/progress';
const ArchitectureTopologyCanvas = React.lazy(() =>
  import('@/src/components/topology/ArchitectureTopologyCanvas').then((m) => ({ default: m.ArchitectureTopologyCanvas }))
);

interface OverviewPageProps {
  config: ArchitectureConfig;
  inferenceMode: InferenceMode;
  onChangeInferenceMode: (mode: InferenceMode) => void;
  selectedServiceId: string | null;
  onSelectService: (serviceId: string) => void;
  roadmapProgress: RoadmapProgressSummary;
  onNavigate: (section: NavSection) => void;
  exportTriggerRef?: React.MutableRefObject<((format: 'png' | 'svg') => Promise<void>) | null>;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  config,
  inferenceMode,
  onChangeInferenceMode,
  selectedServiceId,
  onSelectService,
  roadmapProgress,
  onNavigate,
  exportTriggerRef,
}) => {
  const vmTotals = calculateProxmoxTotals(config.proxmoxVms);

  const summaryCards = [
    {
      title: 'Mac Studio Ultra Fleet',
      value: '12 Nodes (3 Clusters)',
      detail: '3 Clusters × 4 Nodes · 3,072 GB Combined Unified Memory',
      status: 'Planned · Bare-Metal Compute',
      icon: Server,
      targetNav: NavSection.MacCluster,
    },
    {
      title: 'Proxmox Infrastructure',
      value: '1 Environment',
      detail: 'pve-ai-host-01 · KVM + ZFS NVMe',
      status: 'Planned · Virtualization Host',
      icon: HardDrive,
      targetNav: NavSection.Proxmox,
    },
    {
      title: 'Planned Service VMs',
      value: '6 VMs',
      detail: `${vmTotals.minVcpu}–${vmTotals.maxVcpu} vCPU · ${vmTotals.minRamGb}–${vmTotals.maxRamGb} GB RAM`,
      status: 'Planned · VLAN Segmented',
      icon: Cpu,
      targetNav: NavSection.Proxmox,
    },
    {
      title: 'AI Inference Modes',
      value: '2 Modes',
      detail: 'TB5 RDMA Sharded vs Independent HA',
      status: 'Conceptual · Switchable',
      icon: Layers,
      targetNav: NavSection.MacCluster,
    },
    {
      title: 'Service Inventory',
      value: `${config.services.length} Components`,
      detail: `${config.connections.length} Directional Connections`,
      status: 'Planned · 4 Architecture Zones',
      icon: Network,
      targetNav: NavSection.Services,
    },
    {
      title: 'POC Implementation',
      value: `${roadmapProgress.completionPercent}%`,
      detail: `${roadmapProgress.completedCount}/${roadmapProgress.totalTasks} Deliverables Completed`,
      status:
        roadmapProgress.completionPercent === 0
          ? 'Not Started · 5 Phases'
          : 'Planning Active · 5 Phases',
      icon: CheckSquare,
      targetNav: NavSection.Roadmap,
      showProgress: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Architecture Status Framing Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border bg-card p-5">
        <div className="space-y-1 max-w-3xl">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <span className="text-cyan-400 font-medium">Architecture Proposal</span>
            <span aria-hidden="true">·</span>
            <span>Status: Planned / Conceptual POC</span>
            <span aria-hidden="true">·</span>
            <span>No Live Deployment Connected</span>
          </div>
          <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-foreground">
            Hybrid Bare-Metal Apple Silicon Compute + Proxmox Virtualized Control Plane
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Proposes separating LLM inference onto 12 Mac Studio M5 Ultra nodes across three 4-node clusters (3,072 GB total unified memory), with a JACCL-compatible Thunderbolt 5 mesh per cluster. Stateful databases, vector search, automation queues, MCP tooling, and OpenTelemetry observability run on six planned Proxmox VMs.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <Button variant="outline" onClick={() => onNavigate(NavSection.Roadmap)}>
            View 5-Phase Roadmap
          </Button>
          <Button variant="default" onClick={() => onNavigate(NavSection.Topology)}>
            Open Full Topology
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* 6 Required Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-3.5">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.title}
              type="button"
              onClick={() => onNavigate(card.targetNav)}
              className="group rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-cyan-500/50 hover:bg-accent/30 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground truncate">
                  {card.title}
                </span>
                <Icon className="h-4 w-4 text-cyan-400 shrink-0" />
              </div>
              <div className="mt-2 font-mono text-xl font-semibold text-foreground tabular-nums">
                {card.value}
              </div>
              <div className="mt-1 text-[11px] text-foreground/85 truncate">
                {card.detail}
              </div>
              {card.showProgress && (
                <Progress value={roadmapProgress.completionPercent} className="mt-2 h-1.5" />
              )}
              <div className="mt-2 pt-2 border-t border-border/70 text-[10px] font-mono text-muted-foreground">
                {card.status}
              </div>
            </button>
          );
        })}
      </div>

      {/* Centerpiece Interactive Architecture Topology */}
      <section aria-label="Interactive Architecture Topology">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Interactive Infrastructure Topology Explorer
            </h3>
            <p className="text-xs text-muted-foreground">
              Pan, zoom, hover nodes to highlight communication paths, switch inference modes, or click any component to open technical specifications.
            </p>
          </div>
        </div>

        <React.Suspense fallback={<div role="status" className="h-64 rounded-lg border border-border p-6 text-sm text-muted-foreground">Loading interactive topology…</div>}>
          <ArchitectureTopologyCanvas
            config={config}
            inferenceMode={inferenceMode}
            onChangeInferenceMode={onChangeInferenceMode}
            selectedServiceId={selectedServiceId}
            onSelectService={onSelectService}
            compactHeight={true}
            onOpenFullScreen={() => onNavigate(NavSection.Topology)}
            exportTriggerRef={exportTriggerRef}
          />
        </React.Suspense>
      </section>

      {/* Architectural Separation & Core Design Decisions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-sky-400" />
              <CardTitle>Compute Plane: Mac Studio + TB5 RDMA</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2.5 text-xs text-muted-foreground leading-relaxed">
            <p>
              Three proposed clusters of four <strong className="text-foreground">Mac Studio M5 Ultra</strong> nodes (12 nodes total) provide{' '}
              <span className="font-mono text-foreground">12 × 256 GB = 3,072 GB</span> aggregate unified memory running bare-metal macOS with <strong className="text-foreground">MLX / MLX-LM</strong>.
            </p>
            <p>
              Dedicated intra-cluster <strong className="text-sky-300">Thunderbolt 5 RDMA 4-node full meshes</strong> are proposed for JACCL. Four-rank model support and performance remain hardware acceptance tests; each mesh requires six peer cables.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-amber-400" />
              <CardTitle>Service Plane: Proxmox VE Isolation</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2.5 text-xs text-muted-foreground leading-relaxed">
            <p>
              Six KVM virtual machines on <code className="font-mono text-foreground">pve-ai-host-01</code> segregate ingress (<strong className="text-foreground">LiteLLM</strong>), orchestration (<strong className="text-foreground">n8n</strong>), relational/queue state (<strong className="text-foreground">PostgreSQL + Redis</strong>), RAG (<strong className="text-foreground">Qdrant</strong>), tool connectors (<strong className="text-foreground">MCP</strong>), and monitoring.
            </p>
            <p>
              Keeping Docker/Linux stateful workloads on Proxmox preserves 100% of Mac Studio memory for model weights and KV caches.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-teal-400" />
              <CardTitle>Governance, Security & Telemetry</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2.5 text-xs text-muted-foreground leading-relaxed">
            <p>
              All client, agent, and n8n inference traffic traverses <strong className="text-foreground">LiteLLM</strong> on VLAN 20 before reaching VLAN 30 compute nodes—enforcing virtual API keys, budgets, and rate limits.
            </p>
            <p>
              <strong className="text-foreground">OpenTelemetry Collector</strong> unifies metrics, logs, and traces into Prometheus, Loki, Tempo, and Grafana on VLAN 10.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
