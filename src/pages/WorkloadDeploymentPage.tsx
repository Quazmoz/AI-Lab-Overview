import React, { useMemo, useState } from 'react';
import { Boxes, Container, HardDrive, Network, ShieldCheck } from 'lucide-react';
import type { ArchitectureConfig } from '@/src/types/architecture';
import {
  candidateRuntime,
  RUNTIME_LABELS,
  WORKLOAD_DEPLOYMENT_OPTIONS,
  type WorkloadRuntime,
} from '@/src/data/workloadDeployment';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { cn } from '@/src/lib/utils';

interface WorkloadDeploymentPageProps {
  config: ArchitectureConfig;
  onSelectService: (serviceId: string) => void;
}

const RUNTIME_CHOICES: ReadonlyArray<{
  runtime: WorkloadRuntime;
  title: string;
  subtitle: string;
  detail: string;
  icon: typeof HardDrive;
}> = [
  {
    runtime: 'vm',
    title: 'Dedicated Linux VMs',
    subtitle: 'Current six-VM baseline',
    detail: 'Direct service processes managed within the six function-specific Proxmox guests.',
    icon: HardDrive,
  },
  {
    runtime: 'docker',
    title: 'Docker Compose on VMs',
    subtitle: 'Optional simple containerization',
    detail: 'Compose stacks inside the same Linux guests; retain per-VM VLAN, resource and backup boundaries.',
    icon: Container,
  },
  {
    runtime: 'kubernetes',
    title: 'Kubernetes on Linux VMs',
    subtitle: 'Optional orchestration tier',
    detail: 'Containerize eligible services on separately budgeted Linux control-plane and worker guests.',
    icon: Boxes,
  },
];

export const WorkloadDeploymentPage: React.FC<WorkloadDeploymentPageProps> = ({
  config,
  onSelectService,
}) => {
  const [selectedRuntime, setSelectedRuntime] = useState<WorkloadRuntime>('vm');
  const serviceMap = useMemo(() => new Map(config.services.map((service) => [service.id, service])), [config.services]);
  const workloads = WORKLOAD_DEPLOYMENT_OPTIONS.flatMap((option) => {
    const service = serviceMap.get(option.serviceId);
    return service ? [{ option, service }] : [];
  });
  const eligibleCount = workloads.filter(({ option }) => option.supportedRuntimes.includes(selectedRuntime)).length;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="text-xs font-mono text-cyan-400">Service Plane · Optional Delivery Models · Architecture Proposal</div>
        <h2 className="mt-1 text-lg font-semibold text-foreground">Docker & Kubernetes Workload Placement</h2>
        <p className="mt-2 max-w-4xl text-xs leading-relaxed text-muted-foreground">
          Compare runtime candidates for non-inference services. The six Proxmox VMs remain the documented baseline.
          Docker Compose can run inside those Linux VMs; Kubernetes is an additional, optional Linux-VM orchestration
          tier requiring its own control-plane and worker capacity. Neither option changes the bare-metal Mac Studio
          MLX inference design or creates infrastructure by selecting it here.
        </p>
      </div>

      <div role="group" aria-label="Compare service deployment runtime" className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {RUNTIME_CHOICES.map(({ runtime, title, subtitle, detail, icon: Icon }) => (
          <button
            type="button"
            key={runtime}
            aria-pressed={selectedRuntime === runtime}
            onClick={() => setSelectedRuntime(runtime)}
            className={cn(
              'rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer',
              selectedRuntime === runtime ? 'border-cyan-500/50 bg-cyan-500/10' : 'border-border bg-card hover:bg-accent/40'
            )}
          >
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-cyan-400" />
              <span className="text-sm font-semibold text-foreground">{title}</span>
            </div>
            <div className="mt-2 text-[11px] font-mono text-cyan-300">{subtitle}</div>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{detail}</p>
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Candidate Service Placement · {RUNTIME_LABELS[selectedRuntime]}</CardTitle>
          <CardDescription>
            {eligibleCount} of {workloads.length} supporting services can use this runtime in the proposed POC.
            Ineligible workloads remain VM-hosted. This is a comparison overlay, not a change to topology,
            confirmed capacity, or a deployed workload.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th scope="col" className="py-2 pr-4 font-medium">Service</th>
                  <th scope="col" className="py-2 px-4 font-medium">Existing VM baseline</th>
                  <th scope="col" className="py-2 px-4 font-medium">Candidate runtime</th>
                  <th scope="col" className="py-2 px-4 font-medium">Eligible options</th>
                  <th scope="col" className="py-2 pl-4 font-medium">Operational requirement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {workloads.map(({ service, option }) => {
                  const effective = candidateRuntime(service, selectedRuntime);
                  const usesFallback = effective !== selectedRuntime;
                  return (
                    <tr key={service.id} className="align-top">
                      <td className="py-3 pr-4">
                        <button
                          type="button"
                          onClick={() => onSelectService(service.id)}
                          className="font-semibold text-cyan-300 hover:underline text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          aria-label={'Inspect ' + service.name}
                        >
                          {service.shortName}
                        </button>
                        {option.stateful && <div className="mt-1 text-[10px] text-amber-300">Persistent state</div>}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground min-w-[165px]">{service.assignedHostOrVm}</td>
                      <td className="py-3 px-4 min-w-[125px]">
                        <span className={cn('font-semibold', usesFallback ? 'text-amber-300' : 'text-teal-300')}>
                          {effective ? RUNTIME_LABELS[effective] : 'N/A'}
                        </span>
                        {usesFallback && <div className="mt-1 text-[10px] text-muted-foreground">VM retained · not a K8s candidate</div>}
                      </td>
                      <td className="py-3 px-4 min-w-[145px]">
                        <div className="flex flex-wrap gap-1">
                          {option.supportedRuntimes.map((runtime) => (
                            <span key={runtime} className="rounded border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] text-foreground">
                              {RUNTIME_LABELS[runtime]}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 pl-4 text-muted-foreground leading-relaxed min-w-[260px]">{option.considerations}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Network className="h-4 w-4 text-cyan-400" /> Resource & network boundaries</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs leading-relaxed text-muted-foreground">
            <p>Docker Compose retains the existing Linux VM / VLAN ownership. Set memory and CPU limits, use private container networks, and keep service-to-service traffic within the documented policy.</p>
            <p>Kubernetes needs additional Linux VM sizing, control-plane and worker reservations, CNI policy, ingress/TLS, private registry, secrets management, persistent storage, and cluster monitoring. The current six-VM totals do not include these guests.</p>
            <p>A single Proxmox host remains a single failure domain; multiple Kubernetes pods or VMs on that host do not create host-level high availability.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-teal-400" /> Acceptance gates before changing runtime</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs leading-relaxed text-muted-foreground">
            <p>Validate backups/restores for PostgreSQL, Redis queues, Qdrant, Prometheus, Loki, Tempo and Grafana before moving state. Pin image digests, scan supply chain, and prove rollback to the VM baseline.</p>
            <p>Apply per-workload identities, deny-by-default ingress/egress, encrypted credentials, resource quotas and bounded queue/retry policies. Restrict MCP execution separately from API entry points.</p>
            <p>Smoke-test n8n queue recovery, LiteLLM key/budget continuity, telemetry persistence, dependency connectivity and Mac inference routing under node restart or partial outage.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
