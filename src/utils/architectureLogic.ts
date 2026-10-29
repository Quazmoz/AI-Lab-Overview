import {
  ArchitectureService,
  InferenceMode,
  ProxmoxVM,
  RoadmapItemStatus,
  RoadmapPhase,
  ServiceCategory,
  ServiceConnection,
} from '../types/architecture';

export type QuantizationPrecision = 'FP16' | 'Q8_0' | 'Q4_K_M';

export interface ModelMemoryPlanResult {
  paramsBillion: number;
  quantization: QuantizationPrecision;
  contextTokens: number;
  mode: InferenceMode;
  nodeCount: number;
  weightsGb: number;
  kvCacheGb: number;
  runtimeOverheadGb: number;
  totalRequiredGb: number;
  usablePoolGb: number;
  perNodeAllocatedGb: number;
  perNodeUsableCapGb: number;
  utilizationPercent: number;
  fitStatus: 'comfortable' | 'tight' | 'exceeds';
  estimatedPerNodeSharePercent: number;
  /** Memory-only eligibility for redundant replicas; not a proven HA configuration. */
  replicaFailoverCandidate: boolean;
}

const BYTES_PER_PARAM: Record<QuantizationPrecision, number> = {
  FP16: 2.0,
  Q8_0: 1.06,
  Q4_K_M: 0.58,
};

const MACOS_USABLE_WIRED_GB = 224; // Illustrative budget, not a guaranteed macOS/Metal wired limit.

export function calculateModelMemoryPlan(
  paramsBillion: number,
  quantization: QuantizationPrecision,
  contextTokens: number,
  mode: InferenceMode,
  nodeCount: number = 4,
  perNodeUsableBudgetGb: number = MACOS_USABLE_WIRED_GB
): ModelMemoryPlanResult {
  const safeParams = Math.max(1, paramsBillion);
  const safeContext = Math.max(1024, contextTokens);
  const count = Math.max(1, nodeCount);

  const weightsGb = Number((safeParams * BYTES_PER_PARAM[quantization]).toFixed(1));
  // Approximate KV cache: actual size depends on layers, GQA heads, KV dtype,
  // concurrency, and the model architecture. This is not a capacity guarantee.
  const kvScaleFactor = Math.sqrt(safeParams / 70);
  const kvCacheGb = Number(((safeContext / 8192) * 2.6 * kvScaleFactor).toFixed(1));
  // Illustrative MLX activation and distributed collective buffers overhead.
  const baseOverhead = mode === InferenceMode.Distributed ? (count > 2 ? 10.5 : 8.5) : 5.0;
  const runtimeOverheadGb = Number((baseOverhead + weightsGb * 0.04).toFixed(1));

  const totalRequiredGb = Number((weightsGb + kvCacheGb + runtimeOverheadGb).toFixed(1));

  const perNodeUsableCapGb =
    Number.isFinite(perNodeUsableBudgetGb) ? Math.max(1, perNodeUsableBudgetGb) : MACOS_USABLE_WIRED_GB;
  const usablePoolGb =
    mode === InferenceMode.Distributed ? perNodeUsableCapGb * count : perNodeUsableCapGb;

  const perNodeAllocatedGb =
    mode === InferenceMode.Distributed
      ? Number((totalRequiredGb / count).toFixed(1))
      : totalRequiredGb;

  const utilizationPercent = Number(
    Math.min(999, (perNodeAllocatedGb / perNodeUsableCapGb) * 100).toFixed(1)
  );

  let fitStatus: 'comfortable' | 'tight' | 'exceeds' = 'comfortable';
  if (perNodeAllocatedGb > perNodeUsableCapGb) {
    fitStatus = 'exceeds';
  } else if (utilizationPercent >= 82) {
    fitStatus = 'tight';
  }

  const estimatedPerNodeSharePercent =
    mode === InferenceMode.Distributed ? Math.round(100 / count) : 100;

  return {
    paramsBillion: safeParams,
    quantization,
    contextTokens: safeContext,
    mode,
    nodeCount: count,
    weightsGb,
    kvCacheGb,
    runtimeOverheadGb,
    totalRequiredGb,
    usablePoolGb,
    perNodeAllocatedGb,
    perNodeUsableCapGb,
    utilizationPercent,
    fitStatus,
    estimatedPerNodeSharePercent,
    replicaFailoverCandidate: mode === InferenceMode.Independent && count >= 2 && fitStatus !== 'exceeds',
  };
}

export interface RoadmapProgressSummary {
  totalTasks: number;
  notStartedCount: number;
  conceptualCount: number;
  inProgressCount: number;
  completedCount: number;
  completionPercent: number;
  phaseBreakdown: Array<{
    phaseId: string;
    total: number;
    completed: number;
    inProgress: number;
    percent: number;
  }>;
}

export function computeRoadmapProgress(
  phases: RoadmapPhase[],
  statusOverrides: Record<string, RoadmapItemStatus>
): RoadmapProgressSummary {
  let totalTasks = 0;
  let notStartedCount = 0;
  let conceptualCount = 0;
  let inProgressCount = 0;
  let completedCount = 0;

  const phaseBreakdown = phases.map((phase) => {
    let pCompleted = 0;
    let pInProgress = 0;

    for (const task of phase.tasks) {
      totalTasks += 1;
      const status = statusOverrides[task.id] ?? task.defaultStatus;
      if (status === RoadmapItemStatus.Completed) {
        completedCount += 1;
        pCompleted += 1;
      } else if (status === RoadmapItemStatus.InProgress) {
        inProgressCount += 1;
        pInProgress += 1;
      } else if (status === RoadmapItemStatus.Conceptual) {
        conceptualCount += 1;
      } else {
        notStartedCount += 1;
      }
    }

    const pTotal = phase.tasks.length;
    const pWeighted = pTotal > 0 ? ((pCompleted + pInProgress * 0.5) / pTotal) * 100 : 0;

    return {
      phaseId: phase.id,
      total: pTotal,
      completed: pCompleted,
      inProgress: pInProgress,
      percent: Math.round(pWeighted),
    };
  });

  const weightedScore =
    totalTasks > 0 ? ((completedCount + inProgressCount * 0.5) / totalTasks) * 100 : 0;

  return {
    totalTasks,
    notStartedCount,
    conceptualCount,
    inProgressCount,
    completedCount,
    completionPercent: Math.round(weightedScore),
    phaseBreakdown,
  };
}

export interface ConnectedGraphHighlight {
  nodeIds: Set<string>;
  edgeIds: Set<string>;
  inboundConnections: ServiceConnection[];
  outboundConnections: ServiceConnection[];
}

export function getConnectedGraphIds(
  focalNodeId: string | null,
  connections: ServiceConnection[],
  activeMode: InferenceMode,
  includeTelemetry: boolean
): ConnectedGraphHighlight {
  const nodeIds = new Set<string>();
  const edgeIds = new Set<string>();
  const inboundConnections: ServiceConnection[] = [];
  const outboundConnections: ServiceConnection[] = [];

  if (!focalNodeId) {
    return { nodeIds, edgeIds, inboundConnections, outboundConnections };
  }

  nodeIds.add(focalNodeId);

  for (const conn of connections) {
    if (conn.modeSpecific && conn.modeSpecific !== activeMode) continue;
    if (!includeTelemetry && conn.isTelemetry) continue;

    if (conn.source === focalNodeId) {
      nodeIds.add(conn.target);
      edgeIds.add(conn.id);
      outboundConnections.push(conn);
      if (conn.bidirectional) {
        inboundConnections.push(conn);
      }
    } else if (conn.target === focalNodeId) {
      nodeIds.add(conn.source);
      edgeIds.add(conn.id);
      inboundConnections.push(conn);
      if (conn.bidirectional) {
        outboundConnections.push(conn);
      }
    }
  }

  return { nodeIds, edgeIds, inboundConnections, outboundConnections };
}

export function filterServices(
  services: ArchitectureService[],
  query: string,
  category: ServiceCategory | 'all'
): ArchitectureService[] {
  const normalized = query.trim().toLowerCase();

  return services.filter((svc) => {
    if (category !== 'all' && svc.category !== category) {
      return false;
    }
    if (!normalized) return true;
    const haystack = [
      svc.name,
      svc.shortName,
      svc.tagline,
      svc.description,
      svc.assignedHostOrVm,
      svc.vlanSegment,
      ...svc.portsAndProtocols,
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(normalized);
  });
}

export function calculateProxmoxTotals(vms: ProxmoxVM[]) {
  return vms.reduce(
    (acc, vm) => {
      acc.minVcpu += vm.vcpuMin;
      acc.maxVcpu += vm.vcpuMax;
      acc.minRamGb += vm.ramMinGb;
      acc.maxRamGb += vm.ramMaxGb;
      return acc;
    },
    { minVcpu: 0, maxVcpu: 0, minRamGb: 0, maxRamGb: 0 }
  );
}
