import React from 'react';
import { HardDrive, Layers, Network, Server, ShieldCheck } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArchitectureConfig, NavSection } from '@/src/types/architecture';
import { calculateProxmoxTotals } from '@/src/utils/architectureLogic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';

interface ProxmoxPageProps {
  config: ArchitectureConfig;
  onSelectService: (serviceId: string) => void;
  onNavigate: (section: NavSection) => void;
}

export const ProxmoxPage: React.FC<ProxmoxPageProps> = ({
  config,
  onSelectService,
  onNavigate,
}) => {
  const host = config.physicalNodes.find((n) => n.nodeType === 'proxmox-host')!;
  const totals = calculateProxmoxTotals(config.proxmoxVms);
  const svcMap = new Map(config.services.map((s) => [s.id, s]));

  const vmChartData = config.proxmoxVms.map((vm) => ({
    name: vm.hostname.replace('ai-', ''),
    MinRAM_GB: vm.ramMinGb,
    MaxRAM_GB: vm.ramMaxGb,
    MaxvCPU: vm.vcpuMax,
  }));

  return (
    <div className="space-y-6">
      {/* Proxmox Host Header */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-mono text-muted-foreground">
              Zone D · Virtualization Platform · Status: Planned Infrastructure
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              Proxmox VE Environment ({host.hostname})
            </h2>
            <p className="text-xs text-muted-foreground max-w-3xl leading-relaxed">
              Six function-specific KVM VMs define the non-inference Linux service baseline. Docker Compose can run inside these guests; an optional Kubernetes tier would run on separately sized Linux VMs, not on the bare-metal Mac Studio inference nodes.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 rounded-lg border border-border bg-muted/40 px-4 py-3 font-mono shrink-0">
            <div>
              <div className="text-[10px] font-sans text-muted-foreground">Planned VMs</div>
              <div className="text-sm font-semibold text-foreground tabular-nums">6 KVM Guests</div>
            </div>
            <div>
              <div className="text-[10px] font-sans text-muted-foreground">vCPU Budget</div>
              <div className="text-sm font-semibold text-cyan-400 tabular-nums">
                {totals.minVcpu}–{totals.maxVcpu} vCPU
              </div>
            </div>
            <div>
              <div className="text-[10px] font-sans text-muted-foreground">RAM Budget</div>
              <div className="text-sm font-semibold text-amber-400 tabular-nums">
                {totals.minRamGb}–{totals.maxRamGb} GB
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-cyan-500/25 bg-cyan-500/5 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Optional Docker Compose / Kubernetes service plane</h3>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            The chart below budgets the six baseline VMs only. Container memory, storage, Kubernetes control-plane/worker nodes,
            high availability, and extra guest capacity require separate sizing and validation before deployment.
          </p>
        </div>
        <button type="button" onClick={() => onNavigate(NavSection.Workloads)}
          className="shrink-0 rounded-md border border-cyan-500/40 px-3 py-2 text-xs font-medium text-cyan-300 hover:bg-cyan-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer">
          Compare runtime options
        </button>
      </div>

      {/* Host Specs + VM Resource Allocation Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <Card className="lg:col-span-5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-amber-400" />
              <CardTitle>Hypervisor Host Baseline ({host.hostname})</CardTitle>
            </div>
            <CardDescription>{host.vendorModel}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex justify-between gap-2 border-b border-border/60 pb-2">
              <span className="text-muted-foreground">Hypervisor OS</span>
              <span className="font-mono text-foreground">{host.osRuntime}</span>
            </div>
            <div className="flex justify-between gap-2 border-b border-border/60 pb-2">
              <span className="text-muted-foreground">Host CPU</span>
              <span className="text-right text-foreground">{host.cpuSpec}</span>
            </div>
            <div className="flex justify-between gap-2 border-b border-border/60 pb-2">
              <span className="text-muted-foreground">Host Memory</span>
              <span className="font-mono text-foreground">{host.memoryLabel}</span>
            </div>
            <div className="flex justify-between gap-2 border-b border-border/60 pb-2">
              <span className="text-muted-foreground">Local Storage</span>
              <span className="text-right text-foreground">{host.storageSpec}</span>
            </div>
            <div className="flex justify-between gap-2 border-b border-border/60 pb-2">
              <span className="text-muted-foreground">Network Trunk</span>
              <span className="font-mono text-cyan-400">vmbr0 · VLAN 10/20/30/40</span>
            </div>
            <div className="pt-1 space-y-1.5 text-muted-foreground">
              {host.notes.map((n, i) => (
                <p key={i} className="leading-relaxed">
                  · {n}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle>Proposed Memory & vCPU Allocation Across 6 VMs</CardTitle>
            <CardDescription>
              Baseline vs burst RAM sizing (GB) and upper vCPU core allocation per virtual machine.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[290px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={50}>
              <BarChart data={vmChartData} margin={{ top: 10, right: 16, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f1624',
                    borderColor: '#334155',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar isAnimationActive={false} dataKey="MinRAM_GB" name="Min RAM (GB)" fill="#06b6d4" radius={[3, 3, 0, 0]} />
                <Bar isAnimationActive={false} dataKey="MaxRAM_GB" name="Max RAM (GB)" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                <Bar isAnimationActive={false} dataKey="MaxvCPU" name="Max vCPU" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 6 Virtual Machine Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {config.proxmoxVms.map((vm) => (
          <Card key={vm.id} className="flex flex-col justify-between">
            <CardHeader className="pb-3 border-b border-border">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-amber-400 shrink-0" />
                  <div>
                    <CardTitle className="font-mono text-sm">{vm.hostname}</CardTitle>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{vm.title}</p>
                  </div>
                </div>
                <span className="font-mono text-[10px] text-muted-foreground">
                  VMID {vm.vmid} · {vm.status}
                </span>
              </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-3.5 text-xs flex-1 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 rounded-md bg-muted/40 p-2.5 font-mono text-[11px]">
                  <div>
                    <span className="block text-[10px] font-sans text-muted-foreground">
                      Proposed Compute
                    </span>
                    <span className="text-foreground font-semibold">{vm.vcpuAllocation}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-sans text-muted-foreground">
                      Proposed Memory
                    </span>
                    <span className="text-amber-300 font-semibold">{vm.ramAllocation}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-sans text-muted-foreground">
                      VLAN & IP
                    </span>
                    <span className="text-cyan-400">
                      VLAN {vm.vlanId} · {vm.ipAddress}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-sans text-muted-foreground">
                      NVMe Disk
                    </span>
                    <span className="text-foreground">{vm.storageAllocation}</span>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-medium text-foreground mb-1">
                    Responsibilities
                  </div>
                  <ul className="space-y-1 text-muted-foreground">
                    {vm.featureBullets.map((b) => (
                      <li key={b}>· {b}</li>
                    ))}
                  </ul>
                </div>

                <div className="text-[11px] text-muted-foreground leading-relaxed border-t border-border/60 pt-2.5">
                  <ShieldCheck className="inline h-3.5 w-3.5 text-teal-400 mr-1 -mt-0.5" />
                  {vm.isolationNotes}
                </div>
              </div>

              {/* Contained Clickable Services */}
              <div className="pt-2 border-t border-border">
                <div className="text-[10px] font-mono text-muted-foreground mb-1.5 flex items-center gap-1">
                  <Layers className="h-3 w-3" />
                  Contained Services (Click to inspect):
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {vm.serviceIds.map((sid) => {
                    const s = svcMap.get(sid);
                    if (!s) return null;
                    return (
                      <button
                        key={sid}
                        type="button"
                        onClick={() => onSelectService(sid)}
                        className="inline-flex items-center gap-1 rounded border border-border bg-secondary px-2.5 py-1 text-[11px] font-medium text-secondary-foreground hover:border-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                      >
                        <Network className="h-3 w-3 text-cyan-400" />
                        {s.shortName}
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
