import type { ArchitectureConfig, ArchitectureService } from '@/src/types/architecture';
import { ServiceCategory } from '@/src/types/architecture';

export type MacProfileId = 'ultra-96' | 'ultra-256' | 'ultra-512';

export interface MacHardwareProfile {
  id: MacProfileId;
  name: string;
  cpuCores: number;
  superCores: number;
  performanceCores: number;
  gpuCores: number;
  neuralEngineCores: number;
  memoryGb: number;
  bandwidthTbps: number;
}

export const MAC_HARDWARE_PROFILES: readonly MacHardwareProfile[] = [
  { id: 'ultra-96', name: 'M5 Ultra · Base', cpuCores: 30, superCores: 10, performanceCores: 20, gpuCores: 64, neuralEngineCores: 32, memoryGb: 96, bandwidthTbps: 1.2 },
  { id: 'ultra-256', name: 'M5 Ultra · Upgraded', cpuCores: 36, superCores: 12, performanceCores: 24, gpuCores: 80, neuralEngineCores: 32, memoryGb: 256, bandwidthTbps: 1.2 },
  { id: 'ultra-512', name: 'M5 Ultra · Maximum Memory', cpuCores: 36, superCores: 12, performanceCores: 24, gpuCores: 80, neuralEngineCores: 32, memoryGb: 512, bandwidthTbps: 1.2 },
];

export const DEFAULT_MAC_PROFILE_ID: MacProfileId = 'ultra-256';
export const DEFAULT_MAC_STORAGE_TB = 4;
export const MAC_STORAGE_OPTIONS_TB: readonly number[] = [1, 2, 4, 8, 16];

/** Validate untrusted browser-local preference values against Apple-listed SKUs. */
export function getMacHardwareProfile(value: unknown): MacHardwareProfile {
  return MAC_HARDWARE_PROFILES.find((profile) => profile.id === value)
    ?? MAC_HARDWARE_PROFILES[1];
}

export function getMacStorageTb(value: unknown): number {
  const numeric = typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN;
  return MAC_STORAGE_OPTIONS_TB.includes(numeric) ? numeric : DEFAULT_MAC_STORAGE_TB;
}

/**
 * Illustrated Metal memory allowance. 12.5% is reserved for macOS/runtime;
 * this is a sizing heuristic, not a verified iogpu wired-limit guarantee.
 */
export function illustrativeWiredGb(memoryGb: number): number {
  return Math.floor(memoryGb * 0.875);
}

/**
 * Apply a uniform, non-mutating hardware planning scenario across the 12 Mac
 * nodes and 3 clusters. Proxmox, networking and logical dependencies stay fixed.
 */
export function applyMacHardwareScenario(
  baseline: ArchitectureConfig,
  profile: MacHardwareProfile,
  storageTb: number
): ArchitectureConfig {
  const wiredPerNodeGb = illustrativeWiredGb(profile.memoryGb);
  const memoryPerClusterGb = profile.memoryGb * 4;
  const wiredPerClusterGb = wiredPerNodeGb * 4;
  const totalMemoryGb = profile.memoryGb * 12;
  const cpuCluster = profile.cpuCores * 4;
  const cpuFleet = profile.cpuCores * 12;

  const replaceReferenceNumbers = (text: string): string => text
    .replaceAll('432 CPU cores', String(cpuFleet) + ' CPU cores')
    .replaceAll('144 CPU cores', String(cpuCluster) + ' CPU cores')
    .replaceAll('144 super + 288 performance', String(profile.superCores * 12) + ' super + ' + String(profile.performanceCores * 12) + ' performance')
    .replaceAll('48 super + 96 performance', String(profile.superCores * 4) + ' super + ' + String(profile.performanceCores * 4) + ' performance')
    .replaceAll('36-core', String(profile.cpuCores) + '-core')
    .replaceAll('80-core', String(profile.gpuCores) + '-core')
    .replaceAll('3,072 GB', totalMemoryGb.toLocaleString('en-US') + ' GB')
    .replaceAll('1,024 GB', memoryPerClusterGb.toLocaleString('en-US') + ' GB')
    .replaceAll('896 GB', String(wiredPerClusterGb) + ' GB')
    .replaceAll('256 GB', String(profile.memoryGb) + ' GB')
    .replaceAll('224 GB', String(wiredPerNodeGb) + ' GB')
    .replaceAll('4 TB NVMe', String(storageTb) + ' TB NVMe');

  const updateInferenceService = (service: ArchitectureService): ArchitectureService => {
    if (service.category !== ServiceCategory.Inference) return service;
    return {
      ...service,
      tagline: replaceReferenceNumbers(service.tagline),
      description: replaceReferenceNumbers(service.description),
      cpuAllocation: replaceReferenceNumbers(service.cpuAllocation),
      memoryAllocation: replaceReferenceNumbers(service.memoryAllocation),
      architectureNotes: service.architectureNotes.map(replaceReferenceNumbers),
      securityConsiderations: service.securityConsiderations.map(replaceReferenceNumbers),
      configSnippet: { ...service.configSnippet, content: replaceReferenceNumbers(service.configSnippet.content) },
    };
  };

  return {
    ...baseline,
    macClusters: baseline.macClusters.map((cluster) => ({
      ...cluster,
      ramPerNodeGb: profile.memoryGb,
      totalRamGb: cluster.nodeCount * profile.memoryGb,
      usableWiredGb: cluster.nodeCount * wiredPerNodeGb,
      bandwidth: String(cluster.nodeCount * profile.bandwidthTbps) + ' TB/s summed local memory bandwidth (not a shared bus)',
    })),
    physicalNodes: baseline.physicalNodes.map((node) => node.nodeType !== 'mac-studio' ? node : ({
      ...node,
      cpuSpec: String(profile.cpuCores) + '-core Apple Silicon CPU (' + profile.superCores + ' super + ' + profile.performanceCores + ' performance)',
      gpuSpec: String(profile.gpuCores) + '-core Apple Silicon GPU with hardware ray tracing & matrix engines',
      neuralEngineSpec: String(profile.neuralEngineCores) + '-core Apple Neural Engine',
      memoryGb: profile.memoryGb,
      memoryLabel: String(profile.memoryGb) + ' GB Unified Memory (Scenario)',
      memoryBandwidth: String(profile.bandwidthTbps) + ' TB/s unified memory bandwidth (Apple-rated)',
      storageSpec: String(storageTb) + ' TB NVMe SSD (planned model cache)',
      notes: node.notes.map((note) => note.replaceAll('~224 GB', '~' + wiredPerNodeGb + ' GB')),
    })),
    services: baseline.services.map(updateInferenceService),
  };
}
