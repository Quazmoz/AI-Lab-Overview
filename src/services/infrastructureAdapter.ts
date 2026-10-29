import { ARCHITECTURE_CONFIG } from '@/src/data/architectureData';
import {
  DEMO_DISTRIBUTED_TRACES,
  DEMO_KPI_SNAPSHOT,
  DEMO_LOKI_LOGS,
  DEMO_SERVICE_AVAILABILITY,
  DEMO_TELEMETRY_SERIES,
} from '@/src/data/demoTelemetry';
import { ArchitectureConfig } from '@/src/types/architecture';

export interface ProviderEndpointsConfig {
  proxmoxApiBaseUrl?: string;
  litellmBaseUrl?: string;
  prometheusBaseUrl?: string;
  grafanaBaseUrl?: string;
}

export interface InfrastructureDataProvider {
  readonly mode: 'planning-static' | 'live-connected';
  getArchitectureConfig(): ArchitectureConfig;
  getTelemetrySnapshot(): {
    isSimulatedDemo: boolean;
    series: typeof DEMO_TELEMETRY_SERIES;
    kpis: typeof DEMO_KPI_SNAPSHOT;
    traces: typeof DEMO_DISTRIBUTED_TRACES;
    logs: typeof DEMO_LOKI_LOGS;
    availability: typeof DEMO_SERVICE_AVAILABILITY;
  };
}

/**
 * Default planning provider backed by structured static architecture specifications
 * and clearly labeled simulated telemetry. Designed so future live adapters for
 * Proxmox (/api2/json), LiteLLM (/health, /model/info), Prometheus (/api/v1/query_range),
 * and Grafana Tempo (/api/traces) can be injected without changing UI components.
 */
export class PlanningArchitectureProvider implements InfrastructureDataProvider {
  public readonly mode = 'planning-static' as const;

  constructor(private readonly _endpoints?: ProviderEndpointsConfig) {}

  getArchitectureConfig(): ArchitectureConfig {
    return ARCHITECTURE_CONFIG;
  }

  getTelemetrySnapshot() {
    return {
      isSimulatedDemo: true,
      series: DEMO_TELEMETRY_SERIES,
      kpis: DEMO_KPI_SNAPSHOT,
      traces: DEMO_DISTRIBUTED_TRACES,
      logs: DEMO_LOKI_LOGS,
      availability: DEMO_SERVICE_AVAILABILITY,
    };
  }
}

export const defaultInfrastructureProvider = new PlanningArchitectureProvider();
