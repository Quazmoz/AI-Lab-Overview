import React, { useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Search } from 'lucide-react';
import {
  ArchitectureConfig,
  InferenceMode,
  ServiceCategory,
} from '@/src/types/architecture';
import {
  filterServices,
  getConnectedGraphIds,
} from '@/src/utils/architectureLogic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import { renderServiceIcon } from '@/src/components/topology/TopologyNodes';
import { getWorkloadDeploymentOption } from '@/src/data/workloadDeployment';
import { cn } from '@/src/lib/utils';

interface ServicesPageProps {
  config: ArchitectureConfig;
  inferenceMode: InferenceMode;
  onSelectService: (serviceId: string) => void;
}

const CATEGORIES: Array<{ id: ServiceCategory | 'all'; label: string }> = [
  { id: 'all', label: 'All Components' },
  { id: ServiceCategory.Gateway, label: 'AI Gateway' },
  { id: ServiceCategory.Inference, label: 'Compute & MLX' },
  { id: ServiceCategory.Automation, label: 'Automation' },
  { id: ServiceCategory.Data, label: 'Data & Queues' },
  { id: ServiceCategory.Rag, label: 'Vector & RAG' },
  { id: ServiceCategory.Mcp, label: 'MCP & APIs' },
  { id: ServiceCategory.Observability, label: 'Observability' },
  { id: ServiceCategory.Clients, label: 'Clients' },
];

export const ServicesPage: React.FC<ServicesPageProps> = ({
  config,
  inferenceMode,
  onSelectService,
}) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ServiceCategory | 'all'>('all');

  const filtered = useMemo(
    () => filterServices(config.services, query, category),
    [config.services, query, category]
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border border-border bg-card p-5">
        <div>
          <div className="text-xs font-mono text-muted-foreground">
            Platform Catalog · {config.services.length} Planned Services & Consumers
          </div>
          <h2 className="mt-1 text-lg font-semibold text-foreground">
            Services, Placement & Dependency Matrix
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Inspect baseline VM placements, optional Docker/Kubernetes eligibility, resource allocations, security notes and telemetry signals.
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by service, VM, port, or VLAN..."
            aria-label="Filter services inventory"
            className="pl-9"
          />
        </div>
      </div>

      {/* Category Filter Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setCategory(cat.id)}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0',
              category === cat.id
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/35'
                : 'border border-border bg-card text-muted-foreground hover:text-foreground'
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>
            Component Inventory ({filtered.length} of {config.services.length})
          </CardTitle>
          <CardDescription>
            Inbound and outbound dependency counts reflect active topology mode ({inferenceMode === InferenceMode.Distributed ? 'Distributed Inference' : 'Independent Inference'}).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <p className="text-xs text-muted-foreground">
                No architecture services match "{query}".
              </p>
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setCategory('all');
                }}
                className="text-xs font-medium text-cyan-400 hover:text-cyan-300 cursor-pointer"
              >
                Reset search & category filters
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="py-2.5 pr-4 font-medium">Component</th>
                    <th className="py-2.5 px-4 font-medium">Assigned Host / VM</th>
                    <th className="py-2.5 px-4 font-medium">Runtime Options</th>
                    <th className="py-2.5 px-4 font-medium">Proposed Compute / RAM</th>
                    <th className="py-2.5 px-4 font-medium">Network & Ports</th>
                    <th className="py-2.5 px-4 font-medium text-right">Connections</th>
                    <th className="py-2.5 pl-4 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70">
                  {filtered.map((svc) => {
                    const rel = getConnectedGraphIds(
                      svc.id,
                      config.connections,
                      inferenceMode,
                      true
                    );
                    const runtimePlan = getWorkloadDeploymentOption(svc.id);
                    return (
                      <tr
                        key={svc.id}
                        onClick={() => onSelectService(svc.id)}
                        className="hover:bg-accent/40 transition-colors cursor-pointer"
                      >
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-secondary text-cyan-400">
                              {renderServiceIcon(svc.iconName, 'h-3.5 w-3.5')}
                            </div>
                            <div>
                              <div className="font-semibold text-foreground">{svc.name}</div>
                              <div className="text-[11px] text-muted-foreground max-w-xs truncate">
                                {svc.tagline}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-foreground whitespace-nowrap">
                          {svc.assignedHostOrVm}
                        </td>
                        <td className="py-3 px-4 text-[11px] text-muted-foreground min-w-[150px]">
                          {runtimePlan ? (
                            <span>{runtimePlan.supportedRuntimes.map((runtime) =>
                              runtime === 'vm' ? 'VM' : runtime === 'docker' ? 'Docker' : 'K8s'
                            ).join(' · ')}</span>
                          ) : (
                            <span>{svc.category === ServiceCategory.Inference ? 'Bare-metal macOS' : 'External consumer'}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                          <div>{svc.cpuAllocation}</div>
                          <div className="text-foreground/80">{svc.memoryAllocation}</div>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground">
                          <div className="text-cyan-400">{svc.vlanSegment}</div>
                          <div className="truncate max-w-[230px]">
                            {svc.portsAndProtocols[0]}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-right whitespace-nowrap tabular-nums">
                          <span className="inline-flex items-center gap-1 text-cyan-400 mr-2.5">
                            <ArrowDownLeft className="h-3 w-3" />
                            {rel.inboundConnections.length} in
                          </span>
                          <span className="inline-flex items-center gap-1 text-violet-400">
                            <ArrowUpRight className="h-3 w-3" />
                            {rel.outboundConnections.length} out
                          </span>
                        </td>
                        <td className="py-3 pl-4 font-mono text-[11px] text-right text-amber-400 whitespace-nowrap">
                          {svc.status} →
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
