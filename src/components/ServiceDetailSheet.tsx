import React from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Cpu,
  ExternalLink,
  HardDrive,
  Lock,
  Network,
} from 'lucide-react';
import {
  ArchitectureConfig,
  ArchitectureService,
  ArchitectureZoneId,
  DeploymentStatus,
  InferenceMode,
  ServiceCategory,
} from '@/src/types/architecture';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/src/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { renderServiceIcon } from '@/src/components/topology/TopologyNodes';
import { getConnectedGraphIds } from '@/src/utils/architectureLogic';
import { CONNECTION_PALETTE } from '@/src/utils/topologyBuilder';

interface ServiceDetailSheetProps {
  serviceId: string | null;
  config: ArchitectureConfig;
  inferenceMode: InferenceMode;
  onClose: () => void;
  onSelectService: (serviceId: string) => void;
}

export const ServiceDetailSheet: React.FC<ServiceDetailSheetProps> = ({
  serviceId,
  config,
  inferenceMode,
  onClose,
  onSelectService,
}) => {
  const directService = config.services.find((s) => s.id === serviceId) ?? null;
  const physicalNode = config.physicalNodes.find((n) => n.id === serviceId) ?? null;
  const macCluster = config.macClusters?.find((c) => c.id === serviceId) ?? null;

  const service: ArchitectureService | null = React.useMemo(() => {
    if (directService) return directService;
    if (physicalNode) {
      return {
        id: physicalNode.id,
        name: `${physicalNode.name} (${physicalNode.vendorModel})`,
        shortName: physicalNode.hostname,
        category: ServiceCategory.Inference,
        zoneId: ArchitectureZoneId.ZoneC,
        iconName: 'Server',
        tagline: `${physicalNode.role} · ${physicalNode.memoryLabel}`,
        description: physicalNode.notes.join(' '),
        assignedHostOrVm: `Physical Chassis: ${physicalNode.hostname}`,
        cpuAllocation: physicalNode.cpuSpec,
        memoryAllocation: `${physicalNode.memoryLabel} (${physicalNode.memoryBandwidth})`,
        portsAndProtocols: [
          `10GbE Compute: ${physicalNode.computeIp} (VLAN 30)`,
          `10GbE Mgmt: ${physicalNode.managementIp} (VLAN 10)`,
          ...physicalNode.interconnects,
        ],
        vlanSegment: 'VLAN 30 AI Compute & VLAN 10 Management',
        status: physicalNode.status,
        dependencies: physicalNode.clusterId ? [physicalNode.clusterId] : [],
        securityConsiderations: [
          'FileVault full-disk encryption for local safetensors model cache.',
          'SSH restricted to admin jump-host on VLAN 10; non-privileged daemon execution.',
          'Direct point-to-point Thunderbolt 5 RDMA cable locked in rack chassis.',
        ],
        architectureNotes: physicalNode.notes,
        configSnippet: {
          filename: 'sysctl-metal-tuning.conf',
          language: 'bash',
          content: `# macOS Metal Memory Tuning for 256 GB Unified Memory\n# Wire up to 224 GB for Metal / MLX GPU buffers\nsudo sysctl iogpu.wired_limit_mb=229376\nsudo sysctl iogpu.wired_lwm_mb=196608\n\n# Configure Thunderbolt 5 Ring Interface\nsudo networksetup -setmanual "Thunderbolt Bridge" 169.254.101.${physicalNode.clusterIndex ?? 1} 255.255.255.0\nsudo ifconfig bridge0 mtu 9000`,
        },
        observabilitySignals: {
          metrics: ['darwin_gpu_utilization_ratio', 'darwin_memory_wired_bytes', 'tb5_ring_rx_tx_bytes', 'darwin_thermal_pressure_level'],
          logs: ['macOS unified log filtered for MLX/Metal & launchd daemon'],
          traces: ['Hardware telemetry span'],
        },
      };
    }
    if (macCluster) {
      return {
        id: macCluster.id,
        name: macCluster.name,
        shortName: macCluster.shortName,
        category: ServiceCategory.Inference,
        zoneId: ArchitectureZoneId.ZoneC,
        iconName: 'Cpu',
        tagline: `${macCluster.roleBadge} · ${macCluster.totalRamGb} GB RAM (${macCluster.usableWiredGb} GB Usable Pool)`,
        description: macCluster.purpose,
        assignedHostOrVm: `${macCluster.nodeCount}× Mac Studio Ultra Nodes (${macCluster.nodeIds.join(', ')})`,
        cpuAllocation: `${macCluster.nodeCount * 32} Apple Silicon Cores (${macCluster.nodeCount * 24} P-cores + ${macCluster.nodeCount * 8} E-cores)`,
        memoryAllocation: `${macCluster.totalRamGb} GB Unified Memory (${macCluster.usableWiredGb} GB wired Metal pool, ${macCluster.bandwidth})`,
        portsAndProtocols: [
          `10GbE AI Compute: ${macCluster.vlanSubnet} (VLAN 30)`,
          `Thunderbolt 5 RDMA Ring: ${macCluster.tb5Subnet} (80–120 Gbps per link)`,
        ],
        vlanSegment: `VLAN 30 (${macCluster.vlanSubnet}) + TB5 Ring (${macCluster.tb5Subnet})`,
        status: DeploymentStatus.Planned,
        dependencies: macCluster.nodeIds,
        securityConsiderations: [
          'Intra-cluster point-to-point TB5 RDMA ring without external switch exposure.',
          'Only LiteLLM AI Gateway on VLAN 20 is permitted to initiate inference requests into VLAN 30.',
        ],
        architectureNotes: [
          `Configured with 4-node Thunderbolt 5 RDMA ring with sub-microsecond all-reduce synchronization.`,
          `Combined unified memory pool of ${macCluster.totalRamGb} GB with ${macCluster.usableWiredGb} GB usable for Metal weight & KV cache allocations.`,
          `Primary staged models: ${macCluster.primaryModels.join(', ')}.`,
        ],
        configSnippet: {
          filename: `${macCluster.id}-cluster-spec.yaml`,
          language: 'yaml',
          content: `cluster_id: ${macCluster.id}\ncluster_number: ${macCluster.clusterNumber}\nnodes: ${macCluster.nodeCount}\ntotal_ram_gb: ${macCluster.totalRamGb}\nusable_pool_gb: ${macCluster.usableWiredGb}\ninterconnect: "${macCluster.rdmaInterconnect}"\ntb5_subnet: "${macCluster.tb5Subnet}"\nprimary_models:\n${macCluster.primaryModels.map((m) => `  - ${m}`).join('\n')}`,
        },
        observabilitySignals: {
          metrics: [`${macCluster.id}_tokens_per_sec`, `${macCluster.id}_wired_memory_gb`, `${macCluster.id}_ring_latency_us`],
          logs: ['Cluster coordination events, distributed barrier sync, replica heartbeats'],
          traces: ['Cluster end-to-end distributed trace'],
        },
      };
    }
    return null;
  }, [directService, physicalNode, macCluster]);

  const { inboundConnections, outboundConnections } = getConnectedGraphIds(
    serviceId,
    config.connections,
    inferenceMode,
    true
  );

  const svcMap = new Map(config.services.map((s) => [s.id, s]));

  return (
    <Sheet open={Boolean(service)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="overflow-y-auto p-6">
        {service && (
          <>
            <SheetHeader className="border-b border-border pb-4 pr-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
                  {renderServiceIcon(service.iconName, 'h-5 w-5')}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                    <span>{service.status}</span>
                    <span aria-hidden="true">·</span>
                    <span>{service.assignedHostOrVm}</span>
                  </div>
                  <SheetTitle className="mt-1">{service.name}</SheetTitle>
                  <SheetDescription className="mt-1">{service.tagline}</SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <Tabs defaultValue="overview" className="mt-5">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
                <TabsTrigger value="configuration">Configuration</TabsTrigger>
                <TabsTrigger value="observability">Observability</TabsTrigger>
              </TabsList>

              {/* TAB 1: OVERVIEW */}
              <TabsContent value="overview" className="space-y-5">
                <div>
                  <h4 className="text-xs font-semibold text-foreground">Role & Architecture Summary</h4>
                  <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                    {service.description}
                  </p>
                </div>

                {/* Host & Resource Allocation Grid */}
                <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/35 p-3.5">
                  <div>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <HardDrive className="h-3.5 w-3.5 text-cyan-400" />
                      Assigned Host / VM
                    </div>
                    <div className="mt-1 font-mono text-xs font-medium text-foreground">
                      {service.assignedHostOrVm}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 text-amber-400" />
                      Deployment Status
                    </div>
                    <div className="mt-1 font-mono text-xs font-medium text-amber-400">
                      {service.status} (POC Architecture)
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Cpu className="h-3.5 w-3.5 text-violet-400" />
                      Proposed CPU
                    </div>
                    <div className="mt-1 font-mono text-xs text-foreground">
                      {service.cpuAllocation}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Network className="h-3.5 w-3.5 text-teal-400" />
                      Proposed Memory
                    </div>
                    <div className="mt-1 font-mono text-xs text-foreground">
                      {service.memoryAllocation}
                    </div>
                  </div>
                </div>

                {/* Contextual Architecture Notes */}
                <div>
                  <h4 className="text-xs font-semibold text-foreground">
                    Contextual Architecture Notes
                  </h4>
                  <ul className="mt-2 space-y-2">
                    {service.architectureNotes.map((note, idx) => (
                      <li
                        key={idx}
                        className="rounded-md border border-border bg-secondary/40 p-3 text-xs text-secondary-foreground leading-relaxed"
                      >
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Security Considerations */}
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <Lock className="h-3.5 w-3.5 text-amber-400" />
                    Security & Isolation Considerations
                  </div>
                  <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                    {service.securityConsiderations.map((sec, idx) => (
                      <li key={idx} className="leading-relaxed">
                        · {sec}
                      </li>
                    ))}
                  </ul>
                </div>

                {service.docsUrl && (
                  <div className="pt-2 border-t border-border">
                    <a
                      href={service.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-cyan-400 hover:text-cyan-300"
                    >
                      Official {service.shortName} Documentation
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                )}
              </TabsContent>

              {/* TAB 2: DEPENDENCIES & CONNECTIONS */}
              <TabsContent value="dependencies" className="space-y-5">
                <div>
                  <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <ArrowDownLeft className="h-3.5 w-3.5 text-cyan-400" />
                    Inbound Connections ({inboundConnections.length})
                  </h4>
                  {inboundConnections.length === 0 ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      No upstream inbound connections in current topology mode.
                    </p>
                  ) : (
                    <div className="mt-2 space-y-2">
                      {inboundConnections.map((conn) => {
                        const peerId = conn.source === service.id ? conn.target : conn.source;
                        const peer = svcMap.get(peerId);
                        const styleInfo = CONNECTION_PALETTE[conn.styleType];
                        return (
                          <button
                            key={conn.id}
                            type="button"
                            onClick={() => peer && onSelectService(peer.id)}
                            className="w-full rounded-lg border border-border bg-muted/30 p-3 text-left hover:border-cyan-500/40 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-foreground">
                                {peer?.name ?? peerId}
                              </span>
                              <span
                                className="font-mono text-[10px]"
                                style={{ color: styleInfo.stroke }}
                              >
                                {conn.protocol}
                              </span>
                            </div>
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              {conn.description}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <ArrowUpRight className="h-3.5 w-3.5 text-violet-400" />
                    Outbound Connections ({outboundConnections.length})
                  </h4>
                  {outboundConnections.length === 0 ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Terminal target — no downstream service dependencies.
                    </p>
                  ) : (
                    <div className="mt-2 space-y-2">
                      {outboundConnections.map((conn) => {
                        const peerId = conn.target === service.id ? conn.source : conn.target;
                        const peer = svcMap.get(peerId);
                        const styleInfo = CONNECTION_PALETTE[conn.styleType];
                        return (
                          <button
                            key={conn.id}
                            type="button"
                            onClick={() => peer && onSelectService(peer.id)}
                            className="w-full rounded-lg border border-border bg-muted/30 p-3 text-left hover:border-cyan-500/40 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-foreground">
                                {peer?.name ?? peerId}
                              </span>
                              <span
                                className="font-mono text-[10px]"
                                style={{ color: styleInfo.stroke }}
                              >
                                {conn.protocol}
                              </span>
                            </div>
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              {conn.description}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* TAB 3: CONFIGURATION & NETWORK */}
              <TabsContent value="configuration" className="space-y-5">
                <div>
                  <h4 className="text-xs font-semibold text-foreground">
                    Network Segment & Ports
                  </h4>
                  <div className="mt-2 rounded-lg border border-border bg-muted/35 p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">VLAN Placement</span>
                      <span className="font-mono text-foreground">{service.vlanSegment}</span>
                    </div>
                    <div className="border-t border-border pt-2">
                      <span className="text-[11px] text-muted-foreground">
                        Ports & Protocols
                      </span>
                      <ul className="mt-1.5 space-y-1 font-mono text-[11px] text-foreground">
                        {service.portsAndProtocols.map((p) => (
                          <li key={p}>· {p}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-foreground">
                      Proposed Reference Configuration
                    </h4>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {service.configSnippet.filename}
                    </span>
                  </div>
                  <pre className="mt-2 overflow-x-auto rounded-lg border border-border bg-slate-950 p-3.5 font-mono text-[11px] leading-relaxed text-slate-200">
                    <code>{service.configSnippet.content}</code>
                  </pre>
                </div>
              </TabsContent>

              {/* TAB 4: OBSERVABILITY */}
              <TabsContent value="observability" className="space-y-4">
                <div className="rounded-lg border border-border bg-muted/30 p-3.5">
                  <h4 className="text-xs font-semibold text-foreground">
                    Prometheus Metrics Exported
                  </h4>
                  {service.observabilitySignals.metrics.length > 0 ? (
                    <ul className="mt-2 space-y-1 font-mono text-[11px] text-cyan-300">
                      {service.observabilitySignals.metrics.map((m) => (
                        <li key={m}>· {m}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Internal storage target.
                    </p>
                  )}
                </div>

                <div className="rounded-lg border border-border bg-muted/30 p-3.5">
                  <h4 className="text-xs font-semibold text-foreground">
                    Loki Structured Logs
                  </h4>
                  <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {service.observabilitySignals.logs.map((l) => (
                      <li key={l}>· {l}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-lg border border-border bg-muted/30 p-3.5">
                  <h4 className="text-xs font-semibold text-foreground">
                    Grafana Tempo Trace Spans
                  </h4>
                  {service.observabilitySignals.traces.length > 0 ? (
                    <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                      {service.observabilitySignals.traces.map((t) => (
                        <li key={t}>· {t}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Trace ingestion/query backend; does not emit application spans.
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};
