import React, { useMemo, useState } from 'react';
import { Cpu, HardDrive, Network, Search, Server } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import { Input } from '@/src/components/ui/input';
import { ArchitectureConfig, NavSection } from '@/src/types/architecture';

interface CommandSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: ArchitectureConfig;
  onSelectService: (serviceId: string) => void;
  onNavigate: (section: NavSection) => void;
}

export const CommandSearchDialog: React.FC<CommandSearchDialogProps> = ({
  open,
  onOpenChange,
  config,
  onSelectService,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();

    const matchedServices = config.services.filter((s) => {
      if (!q) return true;
      return `${s.name} ${s.shortName} ${s.tagline} ${s.assignedHostOrVm}`
        .toLowerCase()
        .includes(q);
    });

    const matchedNodes = config.physicalNodes.filter((n) => {
      if (!q) return false;
      return `${n.hostname} ${n.name} ${n.role} ${n.computeIp} ${n.managementIp}`
        .toLowerCase()
        .includes(q);
    });

    const matchedClusters = (config.macClusters || []).filter((c) => {
      if (!q) return false;
      return `${c.name} ${c.shortName} ${c.purpose} ${c.roleBadge}`
        .toLowerCase()
        .includes(q);
    });

    const matchedVms = config.proxmoxVms.filter((vm) => {
      if (!q) return false;
      return `${vm.hostname} ${vm.title} ${vm.role} ${vm.ipAddress}`
        .toLowerCase()
        .includes(q);
    });

    const matchedVlans = config.vlans.filter((v) => {
      if (!q) return false;
      return `${v.name} ${v.subnet} ${v.purpose}`.toLowerCase().includes(q);
    });

    return {
      services: matchedServices.slice(0, 8),
      clusters: matchedClusters,
      nodes: matchedNodes,
      vms: matchedVms,
      vlans: matchedVlans,
    };
  }, [config, query]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden gap-0">
        <DialogHeader className="p-4 pb-2 border-b border-border">
          <DialogTitle>Search Architecture Components</DialogTitle>
          <DialogDescription>
            Jump to any physical Mac Studio node, Proxmox VM, platform service, or VLAN segment.
          </DialogDescription>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search LiteLLM, Cluster 1, mac-ai-c1-01, Redis, Qdrant, VLAN 30, RDMA..."
              aria-label="Search architecture components"
              className="pl-9"
            />
          </div>
        </DialogHeader>

        <div className="max-h-[380px] overflow-y-auto p-3 space-y-4">
          {results.clusters.length > 0 && (
            <div>
              <div className="px-2 pb-1.5 text-[11px] font-semibold text-muted-foreground">
                Mac Studio Compute Clusters
              </div>
              <div className="space-y-1">
                {results.clusters.map((cls) => (
                  <button
                    key={cls.id}
                    type="button"
                    onClick={() => {
                      onSelectService(cls.id);
                      onOpenChange(false);
                    }}
                    className="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left hover:bg-accent transition-colors cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Cpu className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                        <span className="text-xs font-medium text-foreground">
                          {cls.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate pl-5">
                        {cls.purpose}
                      </p>
                    </div>
                    <span className="font-mono text-[10px] text-muted-foreground shrink-0 ml-3">
                      {cls.totalRamGb} GB RAM
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {results.nodes.length > 0 && (
            <div>
              <div className="px-2 pb-1.5 text-[11px] font-semibold text-muted-foreground">
                Physical Compute Nodes
              </div>
              <div className="space-y-1">
                {results.nodes.map((node) => (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => {
                      onSelectService(node.id);
                      onOpenChange(false);
                    }}
                    className="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left hover:bg-accent transition-colors cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Server className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                        <span className="text-xs font-mono font-medium text-foreground">
                          {node.hostname}
                        </span>
                        <span className="text-xs text-muted-foreground truncate">
                          · {node.role}
                        </span>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] text-cyan-400 shrink-0 ml-3">
                      {node.computeIp}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {results.services.length > 0 && (
            <div>
              <div className="px-2 pb-1.5 text-[11px] font-semibold text-muted-foreground">
                Platform Services & Runtimes
              </div>
              <div className="space-y-1">
                {results.services.map((svc) => (
                  <button
                    key={svc.id}
                    type="button"
                    onClick={() => {
                      onSelectService(svc.id);
                      onOpenChange(false);
                    }}
                    className="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left hover:bg-accent transition-colors cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Cpu className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                        <span className="text-xs font-medium text-foreground">
                          {svc.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate pl-5">
                        {svc.tagline}
                      </p>
                    </div>
                    <span className="font-mono text-[10px] text-muted-foreground shrink-0 ml-3">
                      {svc.assignedHostOrVm}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {results.vms.length > 0 && (
            <div>
              <div className="px-2 pb-1.5 text-[11px] font-semibold text-muted-foreground">
                Proxmox Virtual Machines
              </div>
              <div className="space-y-1">
                {results.vms.map((vm) => (
                  <button
                    key={vm.id}
                    type="button"
                    onClick={() => {
                      onNavigate(NavSection.Proxmox);
                      onOpenChange(false);
                    }}
                    className="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left hover:bg-accent transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-3.5 w-3.5 text-amber-400" />
                      <span className="font-mono text-xs font-medium text-foreground">
                        {vm.hostname}
                      </span>
                      <span className="text-xs text-muted-foreground">· {vm.role}</span>
                    </div>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {vm.vcpuAllocation} / {vm.ramAllocation}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {results.vlans.length > 0 && (
            <div>
              <div className="px-2 pb-1.5 text-[11px] font-semibold text-muted-foreground">
                Network VLAN Segments
              </div>
              <div className="space-y-1">
                {results.vlans.map((v) => (
                  <button
                    key={v.vlanId}
                    type="button"
                    onClick={() => {
                      onNavigate(NavSection.Network);
                      onOpenChange(false);
                    }}
                    className="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left hover:bg-accent transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Network className="h-3.5 w-3.5 text-teal-400" />
                      <span className="text-xs font-medium text-foreground">{v.name}</span>
                    </div>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {v.subnet}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {results.services.length === 0 &&
            results.vms.length === 0 &&
            results.vlans.length === 0 && (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No architecture components matched "{query}".
              </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
