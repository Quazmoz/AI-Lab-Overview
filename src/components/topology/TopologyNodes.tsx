import React from 'react';
import { Handle, NodeProps, Position } from '@xyflow/react';
import {
  Activity,
  AppWindow,
  Bot,
  ChevronDown,
  ChevronRight,
  Code2,
  Cpu,
  Database,
  FileText,
  GitCommitHorizontal,
  HardDrive,
  Layers,
  LayoutDashboard,
  LineChart,
  Network,
  PlugZap,
  SearchCode,
  Server,
  ShieldCheck,
  Terminal,
  Webhook,
  Workflow,
  Zap,
} from 'lucide-react';
import { ArchitectureService, InferenceMode, ServiceCategory } from '@/src/types/architecture';
import { cn } from '@/src/lib/utils';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Terminal,
  AppWindow,
  Bot,
  Webhook,
  Code2,
  Network,
  Cpu,
  Server,
  Workflow,
  Database,
  Layers,
  SearchCode,
  PlugZap,
  ShieldCheck,
  Activity,
  LineChart,
  FileText,
  GitCommitHorizontal,
  LayoutDashboard,
  HardDrive,
};

const CATEGORY_ACCENT: Record<ServiceCategory, string> = {
  [ServiceCategory.Clients]: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/25',
  [ServiceCategory.Gateway]: 'text-cyan-300 bg-cyan-500/15 border-cyan-400/35',
  [ServiceCategory.Inference]: 'text-violet-300 bg-violet-500/15 border-violet-400/35',
  [ServiceCategory.Automation]: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/25',
  [ServiceCategory.Data]: 'text-amber-300 bg-amber-500/10 border-amber-500/25',
  [ServiceCategory.Rag]: 'text-teal-300 bg-teal-500/10 border-teal-500/25',
  [ServiceCategory.Mcp]: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/25',
  [ServiceCategory.Observability]: 'text-teal-300 bg-teal-500/10 border-teal-500/25',
};

export function renderServiceIcon(iconName: string, className = 'h-4 w-4') {
  const IconComp = ICON_MAP[iconName] ?? Server;
  return <IconComp className={className} />;
}

export const ZoneGroupNode: React.FC<NodeProps> = ({ data }) => {
  const d = data as {
    zoneCode: string;
    title: string;
    subtitle: string;
    accent: 'cyan' | 'violet' | 'amber';
    collapsed: boolean;
    onToggle: () => void;
  };

  const borderClasses =
    d.accent === 'violet'
      ? 'border-violet-500/30 bg-violet-950/10 dark:bg-violet-950/15'
      : d.accent === 'amber'
        ? 'border-slate-700/70 bg-slate-900/25 dark:bg-slate-900/40'
        : 'border-cyan-500/25 bg-cyan-950/10 dark:bg-slate-900/35';

  return (
    <div
      className={cn(
        'h-full w-full rounded-xl border border-dashed p-3.5 transition-colors select-none',
        borderClasses
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
            <span className="font-semibold text-foreground whitespace-nowrap shrink-0">
              {d.zoneCode}
            </span>
            <span aria-hidden="true" className="shrink-0">·</span>
            <span className="font-sans font-semibold text-xs text-foreground truncate">
              {d.title}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{d.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            d.onToggle();
          }}
          aria-label={`${d.collapsed ? 'Expand' : 'Collapse'} ${d.title}`}
          className="pointer-events-auto inline-flex items-center gap-1 rounded-md border border-border bg-card/90 px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer shrink-0"
        >
          {d.collapsed ? (
            <>
              <ChevronRight className="h-3.5 w-3.5" />
              Expand
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" />
              Collapse
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export const VmContainerNode: React.FC<NodeProps> = ({ data }) => {
  const d = data as {
    vmHostname: string;
    vmLabel: string;
    allocation: string;
    bullets: string[];
    clickableServiceId?: string;
    onSelect?: (id: string) => void;
  };

  const InteractiveTag = d.clickableServiceId ? 'button' : 'div';

  return (
    <InteractiveTag
      type={d.clickableServiceId ? 'button' : undefined}
      onClick={
        d.clickableServiceId && d.onSelect
          ? () => d.onSelect!(d.clickableServiceId!)
          : undefined
      }
      className={cn(
        'h-full w-full rounded-lg border border-border bg-card/65 p-3 text-left flex flex-col justify-between',
        d.clickableServiceId &&
          'cursor-pointer hover:border-cyan-500/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
      )}
    >
      <div>
        <div className="flex items-center justify-between gap-2 border-b border-border/80 pb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <HardDrive className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span className="font-mono text-xs font-semibold text-foreground truncate">
              {d.vmHostname}
            </span>
          </div>
          <span className="font-mono text-[10px] text-muted-foreground shrink-0">
            {d.vmLabel} · Planned
          </span>
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[11px] font-mono text-amber-400/90">
          <span>Proposed: {d.allocation}</span>
        </div>
        {d.bullets.length > 0 && (
          <ul className="mt-2 space-y-0.5 text-[11px] text-muted-foreground">
            {d.bullets.map((b) => (
              <li key={b} className="truncate">
                · {b}
              </li>
            ))}
          </ul>
        )}
      </div>
      {d.clickableServiceId && (
        <div className="mt-2 pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-cyan-400 font-medium">
          <span>Hosts Zone B LiteLLM Gateway</span>
          <span>Inspect →</span>
        </div>
      )}
    </InteractiveTag>
  );
};

export const ServiceCardNode: React.FC<NodeProps> = ({ data }) => {
  const d = data as {
    service: ArchitectureService;
    compact?: boolean;
    dimmed?: boolean;
    highlighted?: boolean;
    onSelect: (id: string) => void;
    onHover: (id: string | null) => void;
  };

  const { service, compact, dimmed, highlighted } = d;

  return (
    <div
      onMouseEnter={() => d.onHover(service.id)}
      onMouseLeave={() => d.onHover(null)}
      className={cn(
        'relative transition-opacity duration-150',
        compact ? 'w-[235px]' : 'w-[248px]',
        dimmed && 'opacity-25'
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2 !w-2 !bg-slate-400 !border-slate-800"
      />
      <Handle
        id="left"
        type="target"
        position={Position.Left}
        className="!h-2 !w-2 !bg-slate-400 !border-slate-800"
      />
      <Handle
        id="top"
        type="target"
        position={Position.Top}
        className="!h-2 !w-2 !bg-slate-400 !border-slate-800"
      />
      <Handle
        id="top"
        type="source"
        position={Position.Top}
        className="!h-2 !w-2 !bg-cyan-400 !border-slate-900"
      />
      <button
        type="button"
        onClick={() => d.onSelect(service.id)}
        aria-label={`Inspect ${service.name}`}
        className={cn(
          'w-full rounded-lg border bg-card px-3 py-2.5 text-left transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          highlighted
            ? 'border-cyan-400 ring-1 ring-cyan-400/40 bg-accent/60'
            : 'border-border hover:border-cyan-500/50 hover:bg-accent/40'
        )}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border',
              CATEGORY_ACCENT[service.category]
            )}
          >
            {renderServiceIcon(service.iconName, 'h-3.5 w-3.5')}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-xs font-semibold text-foreground truncate">
                {service.shortName}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                {service.status}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
              {service.tagline}
            </p>
          </div>
        </div>
      </button>
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2 !w-2 !bg-cyan-400 !border-slate-900"
      />
      <Handle
        id="bottom"
        type="source"
        position={Position.Bottom}
        className="!h-2 !w-2 !bg-cyan-400 !border-slate-900"
      />
    </div>
  );
};

export const GatewayHeroNode: React.FC<NodeProps> = ({ data }) => {
  const d = data as {
    service: ArchitectureService;
    inferenceMode: InferenceMode;
    dimmed?: boolean;
    highlighted?: boolean;
    onSelect: (id: string) => void;
    onHover: (id: string | null) => void;
  };

  const capabilities = [
    'Unified OpenAI API',
    'Model Routing & LB',
    'API Keys & Rate Limits',
    'Health & Fallback Checks',
  ];

  return (
    <div
      onMouseEnter={() => d.onHover(d.service.id)}
      onMouseLeave={() => d.onHover(null)}
      className={cn(
        'relative w-[286px] transition-opacity duration-150',
        d.dimmed && 'opacity-25'
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2.5 !w-2.5 !bg-cyan-400 !border-slate-950"
      />
      <Handle
        id="bottom"
        type="target"
        position={Position.Bottom}
        className="!h-2.5 !w-2.5 !bg-cyan-400 !border-slate-950"
      />
      <Handle
        id="bottom"
        type="source"
        position={Position.Bottom}
        className="!h-2.5 !w-2.5 !bg-amber-400 !border-slate-950"
      />
      <button
        type="button"
        onClick={() => d.onSelect(d.service.id)}
        aria-label="Inspect LiteLLM AI Gateway"
        className={cn(
          'w-full rounded-xl border bg-card p-4 text-left transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          d.highlighted
            ? 'border-cyan-400 ring-1 ring-cyan-400/50'
            : 'border-cyan-500/45 hover:border-cyan-400'
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-400/40 bg-cyan-500/15 text-cyan-300">
              <Network className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">LiteLLM</h4>
              <p className="text-[11px] font-mono text-cyan-400">
                ai-gateway-01 · Planned
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground">
            :443 / :4000
          </span>
        </div>

        <p className="mt-2.5 text-[11px] text-muted-foreground leading-relaxed">
          Central OpenAI-compatible inference gateway authenticating consumers and routing to MLX.
        </p>

        <div className="mt-3 grid grid-cols-2 gap-1.5 border-t border-border pt-2.5">
          {capabilities.map((cap) => (
            <div
              key={cap}
              className="rounded bg-secondary/70 px-2 py-1 text-[10px] font-medium text-secondary-foreground truncate"
            >
              {cap}
            </div>
          ))}
        </div>

        <div className="mt-2.5 pt-2 border-t border-border/70 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
          <span>
            Policy:{' '}
            {d.inferenceMode === InferenceMode.Distributed
              ? 'Sharded Primary'
              : 'Least-Busy Replica'}
          </span>
          <span className="text-cyan-400">Details →</span>
        </div>
      </button>
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2.5 !w-2.5 !bg-violet-400 !border-slate-950"
      />
    </div>
  );
};

export const MlxRuntimeNode: React.FC<NodeProps> = ({ data }) => {
  const d = data as {
    service: ArchitectureService;
    inferenceMode: InferenceMode;
    dimmed?: boolean;
    highlighted?: boolean;
    onSelect: (id: string) => void;
    onHover: (id: string | null) => void;
  };

  return (
    <div
      onMouseEnter={() => d.onHover(d.service.id)}
      onMouseLeave={() => d.onHover(null)}
      className={cn(
        'relative w-[235px] transition-opacity duration-150',
        d.dimmed && 'opacity-25'
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2.5 !w-2.5 !bg-violet-400 !border-slate-950"
      />
      <button
        type="button"
        onClick={() => d.onSelect(d.service.id)}
        aria-label="Inspect MLX Inference Server"
        className={cn(
          'w-full rounded-xl border bg-card p-3.5 text-left transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          d.highlighted
            ? 'border-violet-400 ring-1 ring-violet-400/50'
            : 'border-violet-500/40 hover:border-violet-400'
        )}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-violet-400/40 bg-violet-500/15 text-violet-300">
            <Cpu className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-foreground truncate">
              MLX Inference Server
            </div>
            <div className="text-[10px] font-mono text-violet-300">
              macOS Metal 3 · MLX-LM
            </div>
          </div>
        </div>
        <div className="mt-2.5 rounded-md bg-secondary/70 px-2.5 py-1.5 text-[11px] text-secondary-foreground">
          {d.inferenceMode === InferenceMode.Distributed ? (
            <span>
              <strong className="text-violet-300">Distributed Coordinator:</strong> Shards 1 large model across both Macs
            </span>
          ) : (
            <span>
              <strong className="text-cyan-300">Independent Endpoints:</strong> Routes requests to either Mac replica
            </span>
          )}
        </div>
      </button>
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2.5 !w-2.5 !bg-violet-400 !border-slate-950"
      />
    </div>
  );
};

export const MacHardwareNode: React.FC<NodeProps> = ({ data }) => {
  const d = data as {
    service: ArchitectureService;
    hostname: string;
    hardwareModel: string;
    memorySpec: string;
    runtimeSpec: string;
    roleBadge: string;
    inferenceMode: InferenceMode;
    isRightPeer?: boolean;
    dimmed?: boolean;
    highlighted?: boolean;
    onSelect: (id: string) => void;
    onHover: (id: string | null) => void;
  };

  return (
    <div
      onMouseEnter={() => d.onHover(d.service.id)}
      onMouseLeave={() => d.onHover(null)}
      className={cn(
        'relative w-[330px] transition-opacity duration-150',
        d.dimmed && 'opacity-25'
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2.5 !w-2.5 !bg-violet-400 !border-slate-950"
      />
      {/* Dedicated RDMA handles between mac-ai-01 and mac-ai-02 */}
      {!d.isRightPeer ? (
        <Handle
          id="rdma-right"
          type="source"
          position={Position.Right}
          style={{ top: '54%' }}
          className="!h-3 !w-3 !bg-sky-400 !border-2 !border-slate-950"
        />
      ) : (
        <Handle
          id="rdma-left"
          type="target"
          position={Position.Left}
          style={{ top: '54%' }}
          className="!h-3 !w-3 !bg-sky-400 !border-2 !border-slate-950"
        />
      )}

      <button
        type="button"
        onClick={() => d.onSelect(d.service.id)}
        aria-label={`Inspect ${d.hostname} hardware node`}
        className={cn(
          'w-full rounded-xl border bg-card p-4 text-left transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          d.highlighted
            ? 'border-violet-400 ring-1 ring-violet-400/50'
            : 'border-slate-700 hover:border-violet-400/70'
        )}
      >
        <div className="flex items-center justify-between gap-2 border-b border-border pb-2.5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-800 border border-slate-600 text-slate-100">
              <Server className="h-4 w-4 text-violet-300" />
            </div>
            <div>
              <div className="font-mono text-xs font-semibold text-foreground">
                {d.hostname}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {d.hardwareModel}
              </div>
            </div>
          </div>
          <span className="font-mono text-[10px] text-muted-foreground">
            Planned
          </span>
        </div>

        <div className="mt-2.5 space-y-1.5 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Memory</span>
            <span className="font-mono font-medium text-foreground">
              {d.memorySpec}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Runtime</span>
            <span className="font-mono text-foreground">{d.runtimeSpec}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Role</span>
            <span className="text-foreground">AI Inference & Distributed Compute</span>
          </div>
        </div>

        <div
          className={cn(
            'mt-3 rounded-md border px-2.5 py-1.5 font-mono text-[10px] font-medium',
            d.inferenceMode === InferenceMode.Distributed
              ? 'border-sky-500/35 bg-sky-500/10 text-sky-300'
              : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300'
          )}
        >
          {d.roleBadge}
        </div>
      </button>
    </div>
  );
};

export const MacClusterGroupNode: React.FC<NodeProps> = ({ data }) => {
  const d = data as {
    clusterId: string;
    clusterNumber: number;
    title: string;
    purpose: string;
    totalRamGb: number;
    usablePoolGb: number;
    bandwidth: string;
    roleBadge: string;
    inferenceMode: InferenceMode;
    nodes: Array<{
      id: string;
      hostname: string;
      role: string;
      ip: string;
      tb5Ip: string;
      serviceId: string;
    }>;
    dimmed?: boolean;
    highlighted?: boolean;
    onSelectNode: (serviceId: string) => void;
    onSelectCluster: (clusterId: string) => void;
  };

  return (
    <div
      className={cn(
        'relative w-[360px] rounded-xl border bg-card/95 backdrop-blur-xs p-3.5 transition-all select-none',
        d.highlighted
          ? 'border-violet-400 ring-2 ring-violet-400/40 shadow-lg shadow-violet-950/40'
          : 'border-violet-500/40 hover:border-violet-400',
        d.dimmed && 'opacity-25'
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2.5 !w-2.5 !bg-violet-400 !border-slate-950"
      />
      <Handle
        id="top"
        type="target"
        position={Position.Top}
        className="!h-2.5 !w-2.5 !bg-violet-400 !border-slate-950"
      />

      {/* Cluster Header */}
      <div className="flex items-start justify-between gap-2 border-b border-border pb-2.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-violet-500/20 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-violet-300 border border-violet-400/30">
              Cluster {d.clusterNumber}
            </span>
            <h4 className="text-xs font-semibold text-foreground truncate">{d.title}</h4>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground line-clamp-1">{d.purpose}</p>
        </div>
        <div className="text-right shrink-0">
          <div className="font-mono text-[11px] font-bold text-violet-300">
            {d.totalRamGb} GB RAM
          </div>
          <div className="text-[9px] font-mono text-muted-foreground">
            {d.usablePoolGb} GB Usable
          </div>
        </div>
      </div>

      {/* 4 Mac Studio Node Cards */}
      <div className="mt-2.5 grid grid-cols-2 gap-1.5">
        {d.nodes.map((node, idx) => (
          <button
            key={node.id}
            type="button"
            onClick={() => d.onSelectNode(node.serviceId)}
            className="rounded-lg border border-border bg-secondary/50 p-2 text-left hover:border-violet-400/70 hover:bg-secondary transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1 font-mono text-[11px] font-semibold text-foreground group-hover:text-violet-300">
                <Server className="h-3 w-3 text-violet-400 shrink-0" />
                <span className="truncate">{node.hostname}</span>
              </div>
              <span className="text-[9px] font-mono text-muted-foreground">
                256G
              </span>
            </div>
            <div className="mt-1 text-[9px] font-mono text-muted-foreground truncate">
              {node.ip}
            </div>
            <div className="text-[9px] text-sky-400/90 font-mono truncate">
              TB5: {node.tb5Ip}
            </div>
            <div className="mt-1 text-[9px] font-medium text-secondary-foreground truncate">
              {d.inferenceMode === InferenceMode.Distributed
                ? `Shard ${idx} (25% Layers)`
                : `Replica ${String.fromCharCode(65 + idx)} (Standalone)`}
            </div>
          </button>
        ))}
      </div>

      {/* Thunderbolt 5 JACCL 4-node full-mesh interconnect callout */}
      <div className="mt-2.5 flex items-center justify-between rounded-md border border-sky-500/30 bg-sky-950/20 px-2.5 py-1.5 text-[10px]">
        <div className="flex items-center gap-1.5 text-sky-300 font-medium">
          <Zap className="h-3 w-3 text-sky-400 shrink-0" />
          <span>TB5 full mesh · 6 links · RDMA planned</span>
        </div>
        <span className="font-mono text-[9px] text-sky-400">
          {d.inferenceMode === InferenceMode.Distributed ? 'JACCL Planned' : 'Links Reserved'}
        </span>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!h-2.5 !w-2.5 !bg-violet-400 !border-slate-950"
      />
      <Handle
        id="bottom"
        type="source"
        position={Position.Bottom}
        className="!h-2.5 !w-2.5 !bg-violet-400 !border-slate-950"
      />
    </div>
  );
};

export const RdmaCalloutNode: React.FC<NodeProps> = ({ data }) => {
  const d = data as {
    inferenceMode: InferenceMode;
    onSelect: () => void;
  };

  const active = d.inferenceMode === InferenceMode.Distributed;

  return (
    <button
      type="button"
      onClick={d.onSelect}
      aria-label="Inspect Thunderbolt 5 RDMA interconnect details"
      className={cn(
        'w-[180px] rounded-lg border p-2.5 text-left transition-all cursor-pointer',
        active
          ? 'border-sky-400/60 bg-sky-950/75 text-sky-100'
          : 'border-border bg-card/90 text-muted-foreground'
      )}
    >
      <div className="flex items-center gap-1.5 text-[11px] font-semibold">
        <Zap className={cn('h-3.5 w-3.5 shrink-0', active ? 'text-sky-400' : 'text-slate-400')} />
        <span className="truncate">Thunderbolt 5 · RDMA</span>
      </div>
      <div className="mt-1.5 space-y-0.5 font-mono text-[10px] leading-tight">
        <div>· MLX Distributed</div>
        <div>· Tensor Parallelism</div>
        <div>· Pipeline Parallelism</div>
      </div>
    </button>
  );
};

export const TOPOLOGY_NODE_TYPES = {
  zoneGroup: ZoneGroupNode,
  vmContainer: VmContainerNode,
  serviceCard: ServiceCardNode,
  gatewayHero: GatewayHeroNode,
  mlxRuntime: MlxRuntimeNode,
  macHardware: MacHardwareNode,
  macClusterGroup: MacClusterGroupNode,
  rdmaCallout: RdmaCalloutNode,
};

