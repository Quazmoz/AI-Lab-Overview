import { Edge, MarkerType, Node, Position } from '@xyflow/react';
import {
  ArchitectureConfig,
  ArchitectureZoneId,
  ConnectionStyleType,
  InferenceMode,
  ServiceCategory,
} from '@/src/types/architecture';

export interface BuildTopologyOptions {
  inferenceMode: InferenceMode;
  showTelemetry: boolean;
  categoryFilter: ServiceCategory | 'all';
  searchQuery: string;
  collapsedZones: Record<string, boolean>;
  highlightedNodeIds: Set<string>;
  highlightedEdgeIds: Set<string>;
  hasActiveHighlight: boolean;
}

export const CONNECTION_PALETTE: Record<
  ConnectionStyleType,
  { stroke: string; strokeWidth: number; dashArray?: string; label: string }
> = {
  [ConnectionStyleType.Api]: {
    stroke: '#06b6d4', // Cyan solid: API communication
    strokeWidth: 2,
    label: 'API Communication (HTTPS / REST / gRPC)',
  },
  [ConnectionStyleType.Inference]: {
    stroke: '#a855f7', // Violet: model inference
    strokeWidth: 2.4,
    label: 'Model Inference (MLX / SSE)',
  },
  [ConnectionStyleType.Data]: {
    stroke: '#f59e0b', // Amber: database and queue communication
    strokeWidth: 2,
    label: 'Database & Queue (PostgreSQL / Redis)',
  },
  [ConnectionStyleType.Telemetry]: {
    stroke: '#14b8a6', // Teal dashed: telemetry
    strokeWidth: 1.6,
    dashArray: '6 4',
    label: 'Telemetry (OTLP / Metrics / Logs / Traces)',
  },
  [ConnectionStyleType.Rdma]: {
    stroke: '#38bdf8', // Bright blue high-bandwidth: Thunderbolt RDMA
    strokeWidth: 4,
    label: 'Thunderbolt 5 JACCL full-mesh links (nominal 80 Gb/s)',
  },
};

export function buildArchitectureTopologyGraph(
  config: ArchitectureConfig,
  options: BuildTopologyOptions,
  callbacks: {
    onSelectService: (serviceId: string) => void;
    onHoverNode: (serviceId: string | null) => void;
    onToggleZone: (zoneId: string) => void;
  }
): { nodes: Node[]; edges: Edge[] } {
  const {
    inferenceMode,
    showTelemetry,
    categoryFilter,
    searchQuery,
    collapsedZones,
    highlightedNodeIds,
    highlightedEdgeIds,
    hasActiveHighlight,
  } = options;

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const svcMap = new Map(config.services.map((s) => [s.id, s]));
  const macNodes = config.physicalNodes.filter((node) => node.nodeType === 'mac-studio');
  const fleetMemoryGb = macNodes.reduce((sum, node) => sum + node.memoryGb, 0);
  const clusterById = new Map(config.macClusters.map((cluster) => [cluster.id, cluster]));

  const isServiceMatched = (id: string) => {
    const svc = svcMap.get(id);
    if (!svc) return true;
    if (categoryFilter !== 'all' && svc.category !== categoryFilter) {
      return false;
    }
    if (!normalizedQuery) return true;
    const text = `${svc.name} ${svc.shortName} ${svc.tagline} ${svc.assignedHostOrVm}`.toLowerCase();
    return text.includes(normalizedQuery);
  };

  const isDimmed = (id: string) => {
    if (!isServiceMatched(id)) return true;
    if (hasActiveHighlight && !highlightedNodeIds.has(id)) return true;
    return false;
  };

  const nodes: Node[] = [];

  const zACollapsed = Boolean(collapsedZones[ArchitectureZoneId.ZoneA]);
  const zBCollapsed = Boolean(collapsedZones[ArchitectureZoneId.ZoneB]);
  const zCCollapsed = Boolean(collapsedZones[ArchitectureZoneId.ZoneC]);
  const zDCollapsed = Boolean(collapsedZones[ArchitectureZoneId.ZoneD]);

  // 1. Zone Containers
  nodes.push(
    {
      id: ArchitectureZoneId.ZoneA,
      type: 'zoneGroup',
      position: { x: 15, y: 40 },
      draggable: false,
      selectable: false,
      style: { width: 300, height: zACollapsed ? 74 : 600, zIndex: -10 },
      data: {
        zoneCode: 'Zone A',
        title: 'Users & Applications',
        subtitle: '5 Consumer & Agent Personas',
        accent: 'cyan',
        collapsed: zACollapsed,
        onToggle: () => callbacks.onToggleZone(ArchitectureZoneId.ZoneA),
      },
    },
    {
      id: ArchitectureZoneId.ZoneB,
      type: 'zoneGroup',
      position: { x: 350, y: 40 },
      draggable: false,
      selectable: false,
      style: { width: 335, height: zBCollapsed ? 74 : 430, zIndex: -10 },
      data: {
        zoneCode: 'Zone B',
        title: 'AI Gateway',
        subtitle: 'Central Inference Entry Point',
        accent: 'cyan',
        collapsed: zBCollapsed,
        onToggle: () => callbacks.onToggleZone(ArchitectureZoneId.ZoneB),
      },
    },
    {
      id: ArchitectureZoneId.ZoneC,
      type: 'zoneGroup',
      position: { x: 735, y: 40 },
      draggable: false,
      selectable: false,
      style: { width: 1440, height: zCCollapsed ? 74 : 450, zIndex: -10 },
      data: {
        zoneCode: 'Zone C',
        title: 'Mac Studio AI Compute Fleet (' + config.macClusters.length + ' Clusters · ' + macNodes.length + ' Nodes · ' + fleetMemoryGb.toLocaleString() + ' GB Unified Memory)',
        subtitle:
          inferenceMode === InferenceMode.Distributed
            ? 'Mode 1: Distributed Candidate (4-Node TB5 JACCL Mesh · ' + (config.macClusters[0]?.usableWiredGb ?? 896) + ' GB Estimated Budget per Cluster)'
            : 'Mode 2: Independent Inference (' + macNodes.length + '× ' + (macNodes[0]?.memoryGb ?? 256) + ' GB Replicas · Multi-Cluster Gateway Balancing)',
        accent: 'violet',
        collapsed: zCCollapsed,
        onToggle: () => callbacks.onToggleZone(ArchitectureZoneId.ZoneC),
      },
    },
    {
      id: ArchitectureZoneId.ZoneD,
      type: 'zoneGroup',
      position: { x: 350, y: 520 },
      draggable: false,
      selectable: false,
      style: { width: 1825, height: zDCollapsed ? 74 : 565, zIndex: -10 },
      data: {
        zoneCode: 'Zone D',
        title: 'Proxmox Virtualization Platform (pve-ai-host-01)',
        subtitle: '6 Planned KVM Virtual Machines · VLAN-Segmented Service Plane',
        accent: 'amber',
        collapsed: zDCollapsed,
        onToggle: () => callbacks.onToggleZone(ArchitectureZoneId.ZoneD),
      },
    }
  );

  // Zone A Nodes
  if (!zACollapsed) {
    const zoneAClients = [
      { id: 'client-developers', y: 112 },
      { id: 'client-automation', y: 208 },
      { id: 'client-api', y: 304 },
      { id: 'client-agents', y: 400 },
      { id: 'client-apps', y: 496 },
    ];

    for (const item of zoneAClients) {
      const svc = svcMap.get(item.id)!;
      nodes.push({
        id: svc.id,
        type: 'serviceCard',
        position: { x: 40, y: item.y },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: {
          service: svc,
          dimmed: isDimmed(svc.id),
          highlighted: highlightedNodeIds.has(svc.id) && hasActiveHighlight,
          onSelect: callbacks.onSelectService,
          onHover: callbacks.onHoverNode,
        },
      });
    }
  }

  // Zone B: Central LiteLLM Gateway Node
  if (!zBCollapsed) {
    const litellm = svcMap.get('svc-litellm')!;
    nodes.push({
      id: litellm.id,
      type: 'gatewayHero',
      position: { x: 374, y: 122 },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      data: {
        service: litellm,
        inferenceMode,
        dimmed: isDimmed(litellm.id),
        highlighted: highlightedNodeIds.has(litellm.id) && hasActiveHighlight,
        onSelect: callbacks.onSelectService,
        onHover: callbacks.onHoverNode,
      },
    });
  }

  // Zone C: MLX Server + three four-node Mac Studio clusters
  if (!zCCollapsed) {
    const mlxSvc = svcMap.get('svc-mlx-server')!;

    nodes.push({
      id: mlxSvc.id,
      type: 'mlxRuntime',
      position: { x: 755, y: 145 },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      data: {
        service: mlxSvc,
        inferenceMode,
        dimmed: isDimmed(mlxSvc.id),
        highlighted: highlightedNodeIds.has(mlxSvc.id) && hasActiveHighlight,
        onSelect: callbacks.onSelectService,
        onHover: callbacks.onHoverNode,
      },
    });

    // Cluster 1: Reasoning & MoE (selected Mac hardware scenario)
    nodes.push({
      id: 'cluster-c1',
      type: 'macClusterGroup',
      position: { x: 1010, y: 80 },
      draggable: false,
      selectable: false,
      data: {
        clusterId: 'mac-cluster-01',
        clusterNumber: 1,
        title: 'Reasoning & MoE Cluster',
        purpose: 'DeepSeek-V3 MoE / Llama-405B Frontier Models',
        totalRamGb: clusterById.get('mac-cluster-01')?.totalRamGb ?? 1024,
        usablePoolGb: clusterById.get('mac-cluster-01')?.usableWiredGb ?? 896,
        bandwidth: clusterById.get('mac-cluster-01')?.bandwidth ?? '4.8 TB/s summed local',
        roleBadge: '4-Way TP Sharded (TB5 RDMA)',
        inferenceMode,
        nodes: [
          {
            id: 'mac-ai-c1-01',
            hostname: 'mac-ai-c1-01',
            role: 'Rank 0 Coord',
            ip: 'redacted',
            tb5Ip: 'redacted',
            serviceId: 'mac-ai-c1-01',
          },
          {
            id: 'mac-ai-c1-02',
            hostname: 'mac-ai-c1-02',
            role: 'Rank 1 Worker',
            ip: 'redacted',
            tb5Ip: 'redacted',
            serviceId: 'mac-ai-c1-02',
          },
          {
            id: 'mac-ai-c1-03',
            hostname: 'mac-ai-c1-03',
            role: 'Rank 2 Worker',
            ip: 'redacted',
            tb5Ip: 'redacted',
            serviceId: 'mac-ai-c1-03',
          },
          {
            id: 'mac-ai-c1-04',
            hostname: 'mac-ai-c1-04',
            role: 'Rank 3 Worker',
            ip: 'redacted',
            tb5Ip: 'redacted',
            serviceId: 'mac-ai-c1-04',
          },
        ],
        dimmed: isDimmed(mlxSvc.id),
        highlighted: highlightedNodeIds.has('svc-cluster-01') && hasActiveHighlight,
        onSelectNode: callbacks.onSelectService,
        onSelectCluster: () => callbacks.onSelectService('svc-cluster-01'),
      },
    });

    // Cluster 2: High-Throughput Replicas (selected Mac hardware scenario)
    nodes.push({
      id: 'cluster-c2',
      type: 'macClusterGroup',
      position: { x: 1390, y: 80 },
      draggable: false,
      selectable: false,
      data: {
        clusterId: 'mac-cluster-02',
        clusterNumber: 2,
        title: 'High-Throughput & Swarms',
        purpose: 'Llama-3.3-70B / Qwen-32B Planned Replicas',
        totalRamGb: clusterById.get('mac-cluster-02')?.totalRamGb ?? 1024,
        usablePoolGb: clusterById.get('mac-cluster-02')?.usableWiredGb ?? 896,
        bandwidth: clusterById.get('mac-cluster-02')?.bandwidth ?? '4.8 TB/s summed local',
        roleBadge: '4× Active-Active Replicas',
        inferenceMode,
        nodes: [
          {
            id: 'mac-ai-c2-01',
            hostname: 'mac-ai-c2-01',
            role: 'Replica A',
            ip: 'redacted',
            tb5Ip: 'redacted',
            serviceId: 'mac-ai-c2-01',
          },
          {
            id: 'mac-ai-c2-02',
            hostname: 'mac-ai-c2-02',
            role: 'Replica B',
            ip: 'redacted',
            tb5Ip: 'redacted',
            serviceId: 'mac-ai-c2-02',
          },
          {
            id: 'mac-ai-c2-03',
            hostname: 'mac-ai-c2-03',
            role: 'Replica C',
            ip: 'redacted',
            tb5Ip: 'redacted',
            serviceId: 'mac-ai-c2-03',
          },
          {
            id: 'mac-ai-c2-04',
            hostname: 'mac-ai-c2-04',
            role: 'Replica D',
            ip: 'redacted',
            tb5Ip: 'redacted',
            serviceId: 'mac-ai-c2-04',
          },
        ],
        dimmed: isDimmed(mlxSvc.id),
        highlighted: highlightedNodeIds.has('svc-cluster-02') && hasActiveHighlight,
        onSelectNode: callbacks.onSelectService,
        onSelectCluster: () => callbacks.onSelectService('svc-cluster-02'),
      },
    });

    // Cluster 3: Multimodal, RAG & Fine-Tuning (selected Mac hardware scenario)
    nodes.push({
      id: 'cluster-c3',
      type: 'macClusterGroup',
      position: { x: 1770, y: 80 },
      draggable: false,
      selectable: false,
      data: {
        clusterId: 'mac-cluster-03',
        clusterNumber: 3,
        title: 'Multimodal, RAG & LoRA',
        purpose: 'BGE-M3 / Qwen-VL / ColPali & Fine-Tuning',
        totalRamGb: clusterById.get('mac-cluster-03')?.totalRamGb ?? 1024,
        usablePoolGb: clusterById.get('mac-cluster-03')?.usableWiredGb ?? 896,
        bandwidth: clusterById.get('mac-cluster-03')?.bandwidth ?? '4.8 TB/s summed local',
        roleBadge: 'Specialized Vector & Vision',
        inferenceMode,
        nodes: [
          {
            id: 'mac-ai-c3-01',
            hostname: 'mac-ai-c3-01',
            role: 'BGE-M3 Embed',
            ip: 'redacted',
            tb5Ip: 'redacted',
            serviceId: 'mac-ai-c3-01',
          },
          {
            id: 'mac-ai-c3-02',
            hostname: 'mac-ai-c3-02',
            role: 'Vision-Language',
            ip: 'redacted',
            tb5Ip: 'redacted',
            serviceId: 'mac-ai-c3-02',
          },
          {
            id: 'mac-ai-c3-03',
            hostname: 'mac-ai-c3-03',
            role: 'Cross-Reranker',
            ip: 'redacted',
            tb5Ip: 'redacted',
            serviceId: 'mac-ai-c3-03',
          },
          {
            id: 'mac-ai-c3-04',
            hostname: 'mac-ai-c3-04',
            role: 'LoRA Trainer',
            ip: 'redacted',
            tb5Ip: 'redacted',
            serviceId: 'mac-ai-c3-04',
          },
        ],
        dimmed: isDimmed(mlxSvc.id),
        highlighted: highlightedNodeIds.has('svc-cluster-03') && hasActiveHighlight,
        onSelectNode: callbacks.onSelectService,
        onSelectCluster: () => callbacks.onSelectService('svc-cluster-03'),
      },
    });
  }

  // Zone D: Proxmox VE Virtual Machines + Contained Services
  if (!zDCollapsed) {
    // VM 1: ai-gateway-01
    nodes.push({
      id: 'vm-gateway-box',
      type: 'vmContainer',
      position: { x: 375, y: 590 },
      draggable: false,
      selectable: false,
      style: { width: 290, height: 205, zIndex: -5 },
      data: {
        vmHostname: 'ai-gateway-01',
        vmLabel: 'VM 1',
        allocation: '4 vCPU / 8 GB RAM',
        bullets: ['LiteLLM Runtime Host', 'TLS Reverse Proxy', 'API Access Controls'],
        clickableServiceId: 'svc-litellm',
        onSelect: callbacks.onSelectService,
      },
    });

    // VM 4: ai-rag-01 + Qdrant node
    nodes.push({
      id: 'vm-rag-box',
      type: 'vmContainer',
      position: { x: 375, y: 820 },
      draggable: false,
      selectable: false,
      style: { width: 290, height: 240, zIndex: -5 },
      data: {
        vmHostname: 'ai-rag-01',
        vmLabel: 'VM 4',
        allocation: '4–8 vCPU / 16–32 GB RAM',
        bullets: ['Document Ingestion', 'HNSW Vector Search & RAG'],
      },
    });
    const qdrantSvc = svcMap.get('svc-qdrant')!;
    nodes.push({
      id: qdrantSvc.id,
      type: 'serviceCard',
      position: { x: 395, y: 902 },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      data: {
        service: qdrantSvc,
        compact: false,
        dimmed: isDimmed(qdrantSvc.id),
        highlighted: highlightedNodeIds.has(qdrantSvc.id) && hasActiveHighlight,
        onSelect: callbacks.onSelectService,
        onHover: callbacks.onHoverNode,
      },
    });

    // VM 2: ai-automation-01 + n8n node
    nodes.push({
      id: 'vm-automation-box',
      type: 'vmContainer',
      position: { x: 695, y: 590 },
      draggable: false,
      selectable: false,
      style: { width: 300, height: 205, zIndex: -5 },
      data: {
        vmHostname: 'ai-automation-01',
        vmLabel: 'VM 2',
        allocation: '4–8 vCPU / 8–16 GB RAM',
        bullets: ['Workflow Execution & Optional Workers'],
      },
    });
    const n8nSvc = svcMap.get('svc-n8n')!;
    nodes.push({
      id: n8nSvc.id,
      type: 'serviceCard',
      position: { x: 715, y: 668 },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      data: {
        service: n8nSvc,
        dimmed: isDimmed(n8nSvc.id),
        highlighted: highlightedNodeIds.has(n8nSvc.id) && hasActiveHighlight,
        onSelect: callbacks.onSelectService,
        onHover: callbacks.onHoverNode,
      },
    });

    // VM 5: ai-mcp-01 + MCP Servers node
    nodes.push({
      id: 'vm-mcp-box',
      type: 'vmContainer',
      position: { x: 695, y: 820 },
      draggable: false,
      selectable: false,
      style: { width: 300, height: 240, zIndex: -5 },
      data: {
        vmHostname: 'ai-mcp-01',
        vmLabel: 'VM 5',
        allocation: '4 vCPU / 8 GB RAM',
        bullets: ['Tool Integrations & External Connectors'],
      },
    });
    const mcpSvc = svcMap.get('svc-mcp')!;
    nodes.push({
      id: mcpSvc.id,
      type: 'serviceCard',
      position: { x: 715, y: 902 },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
      data: {
        service: mcpSvc,
        dimmed: isDimmed(mcpSvc.id),
        highlighted: highlightedNodeIds.has(mcpSvc.id) && hasActiveHighlight,
        onSelect: callbacks.onSelectService,
        onHover: callbacks.onHoverNode,
      },
    });

    // Authorized Infrastructure APIs Target below VM 5
    const extInfraSvc = svcMap.get('ext-infra-apis')!;
    nodes.push({
      id: extInfraSvc.id,
      type: 'serviceCard',
      position: { x: 715, y: 1120 },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
      data: {
        service: extInfraSvc,
        dimmed: isDimmed(extInfraSvc.id),
        highlighted: highlightedNodeIds.has(extInfraSvc.id) && hasActiveHighlight,
        onSelect: callbacks.onSelectService,
        onHover: callbacks.onHoverNode,
      },
    });

    // VM 3: ai-data-01 + PostgreSQL & Redis nodes
    nodes.push({
      id: 'vm-data-box',
      type: 'vmContainer',
      position: { x: 1025, y: 590 },
      draggable: false,
      selectable: false,
      style: { width: 310, height: 470, zIndex: -5 },
      data: {
        vmHostname: 'ai-data-01',
        vmLabel: 'VM 3',
        allocation: '4–8 vCPU / 16–32 GB RAM',
        bullets: ['Persistent Application State', 'BullMQ Workflow Queues & Cache'],
      },
    });
    const pgSvc = svcMap.get('svc-postgres')!;
    const redisSvc = svcMap.get('svc-redis')!;
    nodes.push(
      {
        id: pgSvc.id,
        type: 'serviceCard',
        position: { x: 1048, y: 695 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: {
          service: pgSvc,
          dimmed: isDimmed(pgSvc.id),
          highlighted: highlightedNodeIds.has(pgSvc.id) && hasActiveHighlight,
          onSelect: callbacks.onSelectService,
          onHover: callbacks.onHoverNode,
        },
      },
      {
        id: redisSvc.id,
        type: 'serviceCard',
        position: { x: 1048, y: 845 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: {
          service: redisSvc,
          dimmed: isDimmed(redisSvc.id),
          highlighted: highlightedNodeIds.has(redisSvc.id) && hasActiveHighlight,
          onSelect: callbacks.onSelectService,
          onHover: callbacks.onHoverNode,
        },
      }
    );

    // VM 6: ai-monitoring-01 + OTel, Prometheus, Loki, Tempo, Grafana
    nodes.push({
      id: 'vm-monitoring-box',
      type: 'vmContainer',
      position: { x: 1365, y: 590 },
      draggable: false,
      selectable: false,
      style: { width: 580, height: 470, zIndex: -5 },
      data: {
        vmHostname: 'ai-monitoring-01',
        vmLabel: 'VM 6',
        allocation: '4 vCPU / 8–16 GB RAM',
        bullets: ['Full-Stack Telemetry Ingestion, TSDB, Logs & Distributed Tracing'],
      },
    });

    const otelSvc = svcMap.get('svc-otel')!;
    const promSvc = svcMap.get('svc-prometheus')!;
    const lokiSvc = svcMap.get('svc-loki')!;
    const tempoSvc = svcMap.get('svc-tempo')!;
    const grafanaSvc = svcMap.get('svc-grafana')!;

    nodes.push(
      {
        id: otelSvc.id,
        type: 'serviceCard',
        position: { x: 1390, y: 695 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: {
          service: otelSvc,
          compact: true,
          dimmed: isDimmed(otelSvc.id),
          highlighted: highlightedNodeIds.has(otelSvc.id) && hasActiveHighlight,
          onSelect: callbacks.onSelectService,
          onHover: callbacks.onHoverNode,
        },
      },
      {
        id: grafanaSvc.id,
        type: 'serviceCard',
        position: { x: 1390, y: 885 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: {
          service: grafanaSvc,
          compact: true,
          dimmed: isDimmed(grafanaSvc.id),
          highlighted: highlightedNodeIds.has(grafanaSvc.id) && hasActiveHighlight,
          onSelect: callbacks.onSelectService,
          onHover: callbacks.onHoverNode,
        },
      },
      {
        id: promSvc.id,
        type: 'serviceCard',
        position: { x: 1685, y: 675 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: {
          service: promSvc,
          compact: true,
          dimmed: isDimmed(promSvc.id),
          highlighted: highlightedNodeIds.has(promSvc.id) && hasActiveHighlight,
          onSelect: callbacks.onSelectService,
          onHover: callbacks.onHoverNode,
        },
      },
      {
        id: lokiSvc.id,
        type: 'serviceCard',
        position: { x: 1685, y: 795 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: {
          service: lokiSvc,
          compact: true,
          dimmed: isDimmed(lokiSvc.id),
          highlighted: highlightedNodeIds.has(lokiSvc.id) && hasActiveHighlight,
          onSelect: callbacks.onSelectService,
          onHover: callbacks.onHoverNode,
        },
      },
      {
        id: tempoSvc.id,
        type: 'serviceCard',
        position: { x: 1685, y: 915 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: {
          service: tempoSvc,
          compact: true,
          dimmed: isDimmed(tempoSvc.id),
          highlighted: highlightedNodeIds.has(tempoSvc.id) && hasActiveHighlight,
          onSelect: callbacks.onSelectService,
          onHover: callbacks.onHoverNode,
        },
      }
    );
  }

  // Visible Node Set
  const renderedNodeIds = new Set(nodes.map((n) => n.id));

  // Build Directional Edges
  const edges: Edge[] = [];
  for (const conn of config.connections) {
    if (conn.modeSpecific && conn.modeSpecific !== inferenceMode) continue;
    if (!showTelemetry && conn.isTelemetry) continue;

    let sourceId = conn.source;
    let targetId = conn.target;
    if (sourceId === 'node-mac-01' || sourceId === 'svc-cluster-01' || sourceId === 'mac-cluster-01') sourceId = 'cluster-c1';
    if (sourceId === 'node-mac-02' || sourceId === 'svc-cluster-02' || sourceId === 'mac-cluster-02') sourceId = 'cluster-c2';
    if (sourceId === 'svc-cluster-03' || sourceId === 'mac-cluster-03') sourceId = 'cluster-c3';
    if (targetId === 'node-mac-01' || targetId === 'svc-cluster-01' || targetId === 'mac-cluster-01') targetId = 'cluster-c1';
    if (targetId === 'node-mac-02' || targetId === 'svc-cluster-02' || targetId === 'mac-cluster-02') targetId = 'cluster-c2';
    if (targetId === 'svc-cluster-03' || targetId === 'mac-cluster-03') targetId = 'cluster-c3';

    if (!renderedNodeIds.has(sourceId) || !renderedNodeIds.has(targetId)) continue;

    const palette = CONNECTION_PALETTE[conn.styleType];
    const edgeHighlighted = highlightedEdgeIds.has(conn.id);
    const edgeDimmed = hasActiveHighlight && !edgeHighlighted;

    const isRdma = conn.styleType === ConnectionStyleType.Rdma;
    const rdmaActive = isRdma && inferenceMode === InferenceMode.Distributed;

    // Assign explicit handle IDs where multi-direction routing avoids crossing
    let sourceHandle: string | undefined;
    let targetHandle: string | undefined;

    if (conn.id === 'conn-n8n-litellm') {
      sourceHandle = 'top';
      targetHandle = 'bottom';
    } else if (conn.id === 'conn-n8n-mcp') {
      sourceHandle = 'bottom';
      targetHandle = 'top';
    } else if (conn.id === 'conn-mcp-infra') {
      sourceHandle = 'bottom';
      targetHandle = 'top';
    } else if (conn.id === 'conn-mac01-mac02-rdma') {
      sourceHandle = 'rdma-right';
      targetHandle = 'rdma-left';
    } else if (conn.id === 'conn-litellm-postgres' || conn.id === 'conn-litellm-redis') {
      sourceHandle = 'bottom';
      targetHandle = 'left';
    }

    const showEdgeLabel =
      isRdma ||
      edgeHighlighted ||
      (!conn.isTelemetry &&
        [
          'conn-litellm-mlx',
          'conn-mlx-mac01-dist',
          'conn-mlx-mac02-dist',
          'conn-mlx-mac01-ind',
          'conn-mlx-mac02-ind',
          'conn-n8n-litellm',
          'conn-n8n-postgres',
          'conn-n8n-redis',
          'conn-n8n-mcp',
          'conn-apps-qdrant',
          'conn-mcp-infra',
        ].includes(conn.id));

    edges.push({
      id: conn.id,
      source: conn.source,
      target: conn.target,
      sourceHandle,
      targetHandle,
      type: 'smoothstep',
      animated:
        rdmaActive ||
        edgeHighlighted ||
        conn.styleType === ConnectionStyleType.Inference ||
        conn.id === 'conn-litellm-mlx',
      className: isRdma ? 'edge-rdma' : undefined,
      label: showEdgeLabel
        ? isRdma
          ? inferenceMode === InferenceMode.Distributed
            ? 'TB5 JACCL mesh'
            : 'Standby Link'
          : conn.label
        : undefined,
      labelStyle: {
        fill: '#e2e8f0',
        fontSize: 10,
        fontWeight: 500,
        fontFamily: 'JetBrains Mono, monospace',
      },
      labelBgStyle: {
        fill: '#0f172a',
        fillOpacity: 0.92,
        stroke: isRdma ? '#38bdf8' : '#334155',
        strokeWidth: 1,
      },
      labelBgPadding: [6, 3],
      labelBgBorderRadius: 4,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: isRdma ? 14 : 15,
        height: isRdma ? 14 : 15,
        color: palette.stroke,
      },
      markerStart: conn.bidirectional
        ? {
            type: MarkerType.ArrowClosed,
            width: 14,
            height: 14,
            color: palette.stroke,
          }
        : undefined,
      style: {
        stroke: palette.stroke,
        strokeWidth: edgeHighlighted
          ? palette.strokeWidth + 1.2
          : isRdma && !rdmaActive
            ? 2.2
            : palette.strokeWidth,
        strokeDasharray:
          isRdma && !rdmaActive ? '6 4' : palette.dashArray,
        opacity: edgeDimmed ? 0.14 : isRdma && !rdmaActive ? 0.55 : 0.9,
      },
    });
  }

  // Connect MLX runtime to Cluster 3 (Multimodal & RAG)
  if (renderedNodeIds.has('svc-mlx-server') && renderedNodeIds.has('cluster-c3')) {
    edges.push({
      id: 'conn-mlx-cluster-c3',
      source: 'svc-mlx-server',
      target: 'cluster-c3',
      type: 'smoothstep',
      animated: true,
      label: 'Embeddings & Vision',
      labelStyle: {
        fill: '#e2e8f0',
        fontSize: 10,
        fontWeight: 500,
        fontFamily: 'JetBrains Mono, monospace',
      },
      labelBgStyle: {
        fill: '#0f172a',
        fillOpacity: 0.92,
        stroke: '#8b5cf6',
        strokeWidth: 1,
      },
      labelBgPadding: [6, 3],
      labelBgBorderRadius: 4,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 15,
        height: 15,
        color: '#8b5cf6',
      },
      style: {
        stroke: '#8b5cf6',
        strokeWidth: 2.2,
        opacity: 0.9,
      },
    });
  }

  return { nodes, edges };
}
