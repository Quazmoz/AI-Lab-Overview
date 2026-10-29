import React from 'react';
import { ArchitectureConfig, InferenceMode } from '@/src/types/architecture';
import { ArchitectureTopologyCanvas } from '@/src/components/topology/ArchitectureTopologyCanvas';

interface TopologyPageProps {
  config: ArchitectureConfig;
  inferenceMode: InferenceMode;
  onChangeInferenceMode: (mode: InferenceMode) => void;
  selectedServiceId: string | null;
  onSelectService: (serviceId: string) => void;
  searchQuery?: string;
  exportTriggerRef?: React.MutableRefObject<((format: 'png' | 'svg') => Promise<void>) | null>;
}

export const TopologyPage: React.FC<TopologyPageProps> = ({
  config,
  inferenceMode,
  onChangeInferenceMode,
  selectedServiceId,
  onSelectService,
  searchQuery,
  exportTriggerRef,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Interactive Architecture Topology Studio
          </h2>
          <p className="text-xs text-muted-foreground">
            End-to-end physical and logical connectivity across Users & Apps (Zone A), LiteLLM Gateway (Zone B), 3 Mac Studio Ultra Clusters (Zone C), and Proxmox VE VMs (Zone D).
          </p>
        </div>
        <div className="text-xs font-mono text-muted-foreground">
          Status: Planned Architecture · Click any node for 4-tab specifications
        </div>
      </div>

      <ArchitectureTopologyCanvas
        config={config}
        inferenceMode={inferenceMode}
        onChangeInferenceMode={onChangeInferenceMode}
        selectedServiceId={selectedServiceId}
        onSelectService={onSelectService}
        searchQuery={searchQuery}
        compactHeight={false}
        exportTriggerRef={exportTriggerRef}
      />
    </div>
  );
};
