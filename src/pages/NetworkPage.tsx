import React, { useMemo } from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  Edge,
  MarkerType,
  Node,
  Position,
  ReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import { Network, ShieldAlert, Zap } from 'lucide-react';
import { ArchitectureConfig } from '@/src/types/architecture';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';

interface NetworkPageProps {
  config: ArchitectureConfig;
  onSelectService: (serviceId: string) => void;
}

export const NetworkPage: React.FC<NetworkPageProps> = ({ config }) => {
  const { nodes, edges } = useMemo(() => {
    const netNodes: Node[] = [
      {
        id: 'net-firewall',
        position: { x: 40, y: 195 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: {
          label: (
            <div className="text-left space-y-1">
              <div className="text-[10px] font-mono text-amber-400">Security Boundary</div>
              <div className="text-xs font-semibold text-slate-100">
                Internal L3 Firewall / ACL Router
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                Inter-VLAN Policy Enforcement
              </div>
            </div>
          ),
        },
        style: {
          width: 225,
          background: '#0f1624',
          border: '1px solid #f59e0b',
          borderRadius: 10,
          padding: 10,
        },
      },
      {
        id: 'net-core-switch',
        position: { x: 345, y: 185 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: {
          label: (
            <div className="text-left space-y-1">
              <div className="text-[10px] font-mono text-cyan-400">802.1Q VLAN Trunking</div>
              <div className="text-xs font-semibold text-slate-100">
                Managed 25GbE / 10GbE Core Switch
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                VLAN 10 · 20 · 30 · 40 (Ethernet)
              </div>
            </div>
          ),
        },
        style: {
          width: 250,
          background: '#0f1624',
          border: '1px solid #06b6d4',
          borderRadius: 10,
          padding: 12,
        },
      },
      {
        id: 'vlan-10',
        position: { x: 690, y: 20 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: {
          label: (
            <div className="text-left space-y-1">
              <div className="text-xs font-semibold text-amber-300">
                VLAN 10: Management (10.10.10.0/24)
              </div>
              <div className="text-[10px] font-mono text-slate-300">
                pve-ai-host-01 Admin · Mac SSH · ai-monitoring-01
              </div>
            </div>
          ),
        },
        style: {
          width: 315,
          background: '#131c2e',
          border: '1px solid rgba(245, 158, 11, 0.5)',
          borderRadius: 10,
          padding: 10,
        },
      },
      {
        id: 'vlan-20',
        position: { x: 690, y: 125 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: {
          label: (
            <div className="text-left space-y-1">
              <div className="text-xs font-semibold text-cyan-300">
                VLAN 20: Application Services (10.10.20.0/24)
              </div>
              <div className="text-[10px] font-mono text-slate-300">
                ai-gateway-01 · ai-automation-01 · ai-data-01 · ai-rag-01 · ai-mcp-01
              </div>
            </div>
          ),
        },
        style: {
          width: 315,
          background: '#131c2e',
          border: '1px solid rgba(6, 182, 212, 0.5)',
          borderRadius: 10,
          padding: 10,
        },
      },
      {
        id: 'vlan-30',
        position: { x: 690, y: 245 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: {
          label: (
            <div className="text-left space-y-1">
              <div className="text-xs font-semibold text-violet-300">
                VLAN 30: AI Compute (10.10.30.0/24)
              </div>
              <div className="text-[10px] font-mono text-slate-300">
                10GbE Inference Ingress (Allowed ONLY from ai-gateway-01)
              </div>
            </div>
          ),
        },
        style: {
          width: 315,
          background: '#131c2e',
          border: '1px solid rgba(139, 92, 246, 0.55)',
          borderRadius: 10,
          padding: 10,
        },
      },
      {
        id: 'vlan-40',
        position: { x: 690, y: 365 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: {
          label: (
            <div className="text-left space-y-1">
              <div className="text-xs font-semibold text-teal-300">
                VLAN 40: Storage & Backups (10.10.40.0/24)
              </div>
              <div className="text-[10px] font-mono text-slate-300">
                Air-Gapped ZFS Replication · PBS Vault · MTU 9000
              </div>
            </div>
          ),
        },
        style: {
          width: 315,
          background: '#131c2e',
          border: '1px solid rgba(20, 184, 166, 0.5)',
          borderRadius: 10,
          padding: 10,
        },
      },
      {
        id: 'net-pve-host',
        position: { x: 1110, y: 70 },
        sourcePosition: Position.Left,
        targetPosition: Position.Left,
        data: {
          label: (
            <div className="text-left space-y-1">
              <div className="text-xs font-semibold text-slate-100 font-mono">
                pve-ai-host-01 (Proxmox VE)
              </div>
              <div className="text-[10px] font-mono text-amber-300">
                25GbE LACP Trunk (vmbr0 VLAN-Aware)
              </div>
              <div className="text-[10px] text-slate-400">
                Hosts VMs 101–106 + ZFS Backup NIC
              </div>
            </div>
          ),
        },
        style: {
          width: 280,
          background: '#0f1624',
          border: '1px solid #475569',
          borderRadius: 10,
          padding: 12,
        },
      },
      {
        id: 'net-cluster-01',
        position: { x: 1110, y: 175 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: {
          label: (
            <div className="text-left space-y-1">
              <div className="text-xs font-semibold text-slate-100 font-mono">
                Cluster 1: Reasoning & MoE (4 Nodes)
              </div>
              <div className="text-[10px] font-mono text-cyan-300">
                10GbE: mac-ai-c1-01..04 (10.10.30.11–14)
              </div>
              <div className="text-[10px] font-mono text-sky-400">
                TB5 4-Node Ring: 169.254.101.1–4/24 (80–120 Gbps)
              </div>
            </div>
          ),
        },
        style: {
          width: 320,
          background: '#0f1624',
          border: '1px solid #8b5cf6',
          borderRadius: 10,
          padding: 12,
        },
      },
      {
        id: 'net-cluster-02',
        position: { x: 1110, y: 285 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: {
          label: (
            <div className="text-left space-y-1">
              <div className="text-xs font-semibold text-slate-100 font-mono">
                Cluster 2: High-Throughput (4 Nodes)
              </div>
              <div className="text-[10px] font-mono text-cyan-300">
                10GbE: mac-ai-c2-01..04 (10.10.30.21–24)
              </div>
              <div className="text-[10px] font-mono text-sky-400">
                TB5 4-Node Ring: 169.254.102.1–4/24 (80–120 Gbps)
              </div>
            </div>
          ),
        },
        style: {
          width: 320,
          background: '#0f1624',
          border: '1px solid #8b5cf6',
          borderRadius: 10,
          padding: 12,
        },
      },
      {
        id: 'net-cluster-03',
        position: { x: 1110, y: 395 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: {
          label: (
            <div className="text-left space-y-1">
              <div className="text-xs font-semibold text-slate-100 font-mono">
                Cluster 3: Multimodal & RAG (4 Nodes)
              </div>
              <div className="text-[10px] font-mono text-cyan-300">
                10GbE: mac-ai-c3-01..04 (10.10.30.31–34)
              </div>
              <div className="text-[10px] font-mono text-sky-400">
                TB5 4-Node Ring: 169.254.103.1–4/24 (80–120 Gbps)
              </div>
            </div>
          ),
        },
        style: {
          width: 320,
          background: '#0f1624',
          border: '1px solid #8b5cf6',
          borderRadius: 10,
          padding: 12,
        },
      },
      {
        id: 'net-rdma-isolated',
        position: { x: 1515, y: 265 },
        targetPosition: Position.Left,
        sourcePosition: Position.Left,
        data: {
          label: (
            <div className="text-left space-y-1">
              <div className="text-[10px] font-mono font-semibold text-sky-300">
                Physically Isolated TB5 RDMA Rings
              </div>
              <div className="text-xs font-semibold text-white">
                3× Intra-Cluster 4-Node Fabrics
              </div>
              <div className="text-[10px] font-mono text-sky-200/80">
                80–120 Gbps Direct Cable · Bypasses Core Switch
              </div>
            </div>
          ),
        },
        style: {
          width: 265,
          background: '#082f49',
          border: '2px solid #38bdf8',
          borderRadius: 10,
          padding: 12,
        },
      },
    ];

    const netEdges: Edge[] = [
      {
        id: 'ne-fw-sw',
        source: 'net-firewall',
        target: 'net-core-switch',
        label: 'Routed ACLs',
        type: 'smoothstep',
        style: { stroke: '#f59e0b', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#f59e0b' },
      },
      {
        id: 'ne-sw-v10',
        source: 'net-core-switch',
        target: 'vlan-10',
        type: 'smoothstep',
        style: { stroke: '#f59e0b', strokeWidth: 1.8 },
      },
      {
        id: 'ne-sw-v20',
        source: 'net-core-switch',
        target: 'vlan-20',
        type: 'smoothstep',
        style: { stroke: '#06b6d4', strokeWidth: 2 },
      },
      {
        id: 'ne-sw-v30',
        source: 'net-core-switch',
        target: 'vlan-30',
        type: 'smoothstep',
        style: { stroke: '#8b5cf6', strokeWidth: 2 },
      },
      {
        id: 'ne-sw-v40',
        source: 'net-core-switch',
        target: 'vlan-40',
        type: 'smoothstep',
        style: { stroke: '#14b8a6', strokeWidth: 1.8, strokeDasharray: '5 4' },
      },
      {
        id: 'ne-v10-pve',
        source: 'vlan-10',
        target: 'net-pve-host',
        type: 'smoothstep',
        style: { stroke: '#f59e0b', strokeWidth: 1.6 },
      },
      {
        id: 'ne-v20-pve',
        source: 'vlan-20',
        target: 'net-pve-host',
        label: '25GbE Trunk',
        type: 'smoothstep',
        style: { stroke: '#06b6d4', strokeWidth: 2.2 },
      },
      {
        id: 'ne-v40-pve',
        source: 'vlan-40',
        target: 'net-pve-host',
        type: 'smoothstep',
        style: { stroke: '#14b8a6', strokeWidth: 1.6, strokeDasharray: '5 4' },
      },
      {
        id: 'ne-v30-c1',
        source: 'vlan-30',
        target: 'net-cluster-01',
        label: '10GbE',
        type: 'smoothstep',
        style: { stroke: '#8b5cf6', strokeWidth: 2 },
      },
      {
        id: 'ne-v30-c2',
        source: 'vlan-30',
        target: 'net-cluster-02',
        label: '10GbE',
        type: 'smoothstep',
        style: { stroke: '#8b5cf6', strokeWidth: 2 },
      },
      {
        id: 'ne-v30-c3',
        source: 'vlan-30',
        target: 'net-cluster-03',
        label: '10GbE',
        type: 'smoothstep',
        style: { stroke: '#8b5cf6', strokeWidth: 2 },
      },
      {
        id: 'ne-c1-rdma-callout',
        source: 'net-cluster-01',
        target: 'net-rdma-isolated',
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#38bdf8', strokeWidth: 2, strokeDasharray: '4 3' },
      },
      {
        id: 'ne-c2-rdma-callout',
        source: 'net-cluster-02',
        target: 'net-rdma-isolated',
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#38bdf8', strokeWidth: 2, strokeDasharray: '4 3' },
      },
      {
        id: 'ne-c3-rdma-callout',
        source: 'net-cluster-03',
        target: 'net-rdma-isolated',
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#38bdf8', strokeWidth: 2, strokeDasharray: '4 3' },
      },
    ];

    return { nodes: netNodes, edges: netEdges };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header & Isolation Highlight */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-xl border border-border bg-card p-5">
        <div className="space-y-1 max-w-3xl">
          <div className="text-xs font-mono text-muted-foreground">
            Network Segmentation & Security Boundaries · Status: Planned Topology
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            Segmented Ethernet VLANs + Dedicated Out-of-Band Thunderbolt 5 RDMA
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Standard management, service APIs, inference requests, and storage backups traverse four firewall-enforced 802.1Q Ethernet VLANs, whereas inter-Mac distributed tensor traffic runs over a physically separate point-to-point Thunderbolt 5 RDMA link.
          </p>
        </div>

        <div className="flex items-center gap-2.5 rounded-lg border border-sky-500/40 bg-sky-950/25 px-4 py-3 text-xs text-sky-200 shrink-0">
          <Zap className="h-4 w-4 text-sky-400 shrink-0" />
          <div>
            <div className="font-semibold">Separate RDMA Fabric</div>
            <div className="font-mono text-[11px] text-sky-300/90">
              Zero Ethernet Switch Hop · Zero VLAN Contention
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Network Topology Diagram */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Network className="h-4 w-4 text-cyan-400" />
              <CardTitle>Interactive L2/L3 VLAN & RDMA Network Topology</CardTitle>
            </div>
            <span className="font-mono text-[11px] text-muted-foreground">
              Pan & Zoom Enabled
            </span>
          </div>
        </CardHeader>
        <div
          data-testid="network-topology-canvas"
          className="h-[490px] w-full bg-[var(--canvas-bg)]"
        >
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              fitView
              fitViewOptions={{ padding: 0.08 }}
              nodesDraggable={false}
              nodesConnectable={false}
            >
              <Background
                variant={BackgroundVariant.Dots}
                gap={22}
                size={1.2}
                color="var(--canvas-dots)"
              />
              <Controls showInteractive={false} position="bottom-right" />
            </ReactFlow>
          </ReactFlowProvider>
        </div>
      </Card>

      {/* VLAN & Security Policy Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {config.vlans.map((vlan) => (
          <Card key={vlan.vlanId}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm" style={{ color: vlan.accentColor }}>
                  {vlan.name}
                </CardTitle>
                <span className="font-mono text-xs text-foreground">{vlan.subnet}</span>
              </div>
              <CardDescription>{vlan.purpose}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs">
              <div className="rounded-md bg-muted/45 p-2.5 font-mono text-[11px] space-y-1">
                <div className="text-muted-foreground">
                  Gateway: <span className="text-foreground">{vlan.gateway}</span> · Zone:{' '}
                  <span className="text-foreground">{vlan.securityZone}</span>
                </div>
                <div className="text-muted-foreground">
                  Endpoints: <span className="text-cyan-300">{vlan.connectedHosts.join(', ')}</span>
                </div>
              </div>
              <div className="flex items-start gap-2 text-muted-foreground leading-relaxed">
                <ShieldAlert className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>{vlan.firewallPolicy}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
