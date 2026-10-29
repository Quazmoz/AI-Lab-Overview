import type { ArchitectureService } from '@/src/types/architecture';

export type WorkloadRuntime = 'vm' | 'docker' | 'kubernetes';

export interface WorkloadDeploymentOption {
  serviceId: string;
  supportedRuntimes: readonly WorkloadRuntime[];
  preferredRuntime: WorkloadRuntime;
  stateful: boolean;
  considerations: string;
}

export const RUNTIME_LABELS: Record<WorkloadRuntime, string> = {
  vm: 'Linux VM',
  docker: 'Docker Compose',
  kubernetes: 'Kubernetes',
};

// Alternatives are planning candidates, not deployed resources. Docker runs inside
// Linux VMs; Kubernetes requires separately sized Linux control-plane/worker VMs.
// MLX/MLX-LM inference is intentionally absent: it remains bare-metal on macOS.
export const WORKLOAD_DEPLOYMENT_OPTIONS: readonly WorkloadDeploymentOption[] = [
  {
    serviceId: 'svc-litellm',
    supportedRuntimes: ['vm', 'docker', 'kubernetes'],
    preferredRuntime: 'docker',
    stateful: false,
    considerations: 'Expose only the authenticated gateway; retain PostgreSQL key state and Redis rate-limit counters outside ephemeral containers.',
  },
  {
    serviceId: 'svc-n8n',
    supportedRuntimes: ['vm', 'docker', 'kubernetes'],
    preferredRuntime: 'docker',
    stateful: false,
    considerations: 'Use PostgreSQL and Redis for queue mode; keep the encryption key consistent across coordinators and workers. Pin versions and test restarts.',
  },
  {
    serviceId: 'svc-postgres',
    supportedRuntimes: ['vm', 'docker'],
    preferredRuntime: 'vm',
    stateful: true,
    considerations: 'Prioritize durable volumes, WAL/PITR backup, restore drills, and separate database roles; defer Kubernetes operators until storage and recovery are qualified.',
  },
  {
    serviceId: 'svc-redis',
    supportedRuntimes: ['vm', 'docker'],
    preferredRuntime: 'vm',
    stateful: true,
    considerations: 'Isolate durable BullMQ queues from disposable cache, size memory limits explicitly, and validate persistence and restart recovery.',
  },
  {
    serviceId: 'svc-qdrant',
    supportedRuntimes: ['vm', 'docker'],
    preferredRuntime: 'vm',
    stateful: true,
    considerations: 'Use persistent block storage with backups and collection snapshots; prove index recovery before adding orchestration complexity.',
  },
  {
    serviceId: 'svc-mcp',
    supportedRuntimes: ['vm', 'docker', 'kubernetes'],
    preferredRuntime: 'docker',
    stateful: false,
    considerations: 'Use one least-privilege identity per tool, restricted egress, bounded execution, and an authenticated gateway; never expose privileged MCP endpoints publicly.',
  },
  {
    serviceId: 'svc-otel',
    supportedRuntimes: ['vm', 'docker', 'kubernetes'],
    preferredRuntime: 'docker',
    stateful: false,
    considerations: 'A gateway collector can run in a container; Kubernetes can additionally use agent/DaemonSet collectors. Limit buffering and export retries.',
  },
  {
    serviceId: 'svc-prometheus',
    supportedRuntimes: ['vm', 'docker'],
    preferredRuntime: 'vm',
    stateful: true,
    considerations: 'Keep TSDB storage persistent with retention limits; backup alert rules and scrape configuration and validate restore.',
  },
  {
    serviceId: 'svc-loki',
    supportedRuntimes: ['vm', 'docker'],
    preferredRuntime: 'vm',
    stateful: true,
    considerations: 'Plan object/block storage, indexes, retention, and bounded log ingestion; do not rely on disposable container filesystems.',
  },
  {
    serviceId: 'svc-tempo',
    supportedRuntimes: ['vm', 'docker'],
    preferredRuntime: 'vm',
    stateful: true,
    considerations: 'Size trace storage and retention, validate backend durability, and keep telemetry ingestion on restricted networks.',
  },
  {
    serviceId: 'svc-grafana',
    supportedRuntimes: ['vm', 'docker', 'kubernetes'],
    preferredRuntime: 'docker',
    stateful: true,
    considerations: 'Provision dashboards and datasources as code; persist the database/configuration or use an external backing store. Secure admin access.',
  },
];

const optionsById = new Map(WORKLOAD_DEPLOYMENT_OPTIONS.map((option) => [option.serviceId, option]));

export function getWorkloadDeploymentOption(serviceId: string): WorkloadDeploymentOption | null {
  return optionsById.get(serviceId) ?? null;
}

export function candidateRuntime(
  service: ArchitectureService,
  selected: WorkloadRuntime
): WorkloadRuntime | null {
  const option = getWorkloadDeploymentOption(service.id);
  if (!option) return null;
  return option.supportedRuntimes.includes(selected) ? selected : 'vm';
}
