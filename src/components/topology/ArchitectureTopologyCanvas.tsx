import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowInstance,
  ReactFlowProvider,
} from '@xyflow/react';
import { toPng, toSvg } from 'html-to-image';
import {
  AlertTriangle,
  Download,
  Eye,
  EyeOff,
  Info,
  Layers,
  Maximize2,
  Minimize2,
  RotateCcw,
  Split,
} from 'lucide-react';
import {
  ArchitectureConfig,
  ArchitectureZoneId,
  ConnectionStyleType,
  InferenceMode,
  ServiceCategory,
} from '@/src/types/architecture';
import { getConnectedGraphIds } from '@/src/utils/architectureLogic';
import {
  buildArchitectureTopologyGraph,
  CONNECTION_PALETTE,
} from '@/src/utils/topologyBuilder';
import { TOPOLOGY_NODE_TYPES } from '@/src/components/topology/TopologyNodes';
import { Button } from '@/src/components/ui/button';
import { Switch } from '@/src/components/ui/switch';
import { cn } from '@/src/lib/utils';

interface ArchitectureTopologyCanvasProps {
  config: ArchitectureConfig;
  inferenceMode: InferenceMode;
  onChangeInferenceMode: (mode: InferenceMode) => void;
  selectedServiceId: string | null;
  onSelectService: (serviceId: string) => void;
  searchQuery?: string;
  compactHeight?: boolean;
  onOpenFullScreen?: () => void;
  exportTriggerRef?: React.MutableRefObject<((format: 'png' | 'svg') => Promise<void>) | null>;
}

const CATEGORY_OPTIONS: Array<{ value: ServiceCategory | 'all'; label: string }> = [
  { value: 'all', label: 'All Layers' },
  { value: ServiceCategory.Clients, label: 'Clients' },
  { value: ServiceCategory.Gateway, label: 'Gateway' },
  { value: ServiceCategory.Inference, label: 'Compute & MLX' },
  { value: ServiceCategory.Automation, label: 'Automation' },
  { value: ServiceCategory.Data, label: 'Data & Queues' },
  { value: ServiceCategory.Rag, label: 'Vector RAG' },
  { value: ServiceCategory.Mcp, label: 'MCP Tools' },
  { value: ServiceCategory.Observability, label: 'Observability' },
];

function TopologyInner({
  config,
  inferenceMode,
  onChangeInferenceMode,
  selectedServiceId,
  onSelectService,
  searchQuery = '',
  compactHeight = false,
  onOpenFullScreen,
  exportTriggerRef,
}: ArchitectureTopologyCanvasProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const rfInstanceRef = useRef<ReactFlowInstance | null>(null);

  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [showTelemetry, setShowTelemetry] = useState<boolean>(true);
  const [categoryFilter, setCategoryFilter] = useState<ServiceCategory | 'all'>('all');
  const [showLegend, setShowLegend] = useState<boolean>(true);
  const [showMiniMap, setShowMiniMap] = useState<boolean>(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [collapsedZones, setCollapsedZones] = useState<Record<string, boolean>>({});

  const activeFocusId = hoveredNodeId ?? selectedServiceId;

  const highlightData = useMemo(
    () =>
      getConnectedGraphIds(
        activeFocusId,
        config.connections,
        inferenceMode,
        showTelemetry
      ),
    [activeFocusId, config.connections, inferenceMode, showTelemetry]
  );

  const handleToggleZone = useCallback((zoneId: string) => {
    setCollapsedZones((prev) => ({
      ...prev,
      [zoneId]: !prev[zoneId],
    }));
  }, []);

  const anyZoneCollapsed = Object.values(collapsedZones).some(Boolean);

  const handleToggleAllZones = useCallback(() => {
    if (anyZoneCollapsed) {
      setCollapsedZones({});
    } else {
      setCollapsedZones({
        [ArchitectureZoneId.ZoneA]: true,
        [ArchitectureZoneId.ZoneB]: true,
        [ArchitectureZoneId.ZoneC]: true,
        [ArchitectureZoneId.ZoneD]: true,
      });
    }
  }, [anyZoneCollapsed]);

  const { nodes, edges } = useMemo(
    () =>
      buildArchitectureTopologyGraph(
        config,
        {
          inferenceMode,
          showTelemetry,
          categoryFilter,
          searchQuery,
          collapsedZones,
          highlightedNodeIds: highlightData.nodeIds,
          highlightedEdgeIds: highlightData.edgeIds,
          hasActiveHighlight: Boolean(activeFocusId),
        },
        {
          onSelectService,
          onHoverNode: setHoveredNodeId,
          onToggleZone: handleToggleZone,
        }
      ),
    [
      config,
      inferenceMode,
      showTelemetry,
      categoryFilter,
      searchQuery,
      collapsedZones,
      highlightData,
      activeFocusId,
      onSelectService,
      handleToggleZone,
    ]
  );

  const handleFitView = useCallback(() => {
    rfInstanceRef.current?.fitView({ padding: 0.08, duration: 250 });
  }, []);

  const exportDiagram = useCallback(async (format: 'png' | 'svg') => {
    const el = wrapperRef.current?.querySelector('.react-flow') as HTMLElement | null;
    if (!el) return;
    try {
      setExportStatus(`Exporting ${format.toUpperCase()}...`);
      const filter = (node: HTMLElement) => {
        const cls = node.classList;
        if (!cls) return true;
        return (
          !cls.contains('react-flow__controls') &&
          !cls.contains('react-flow__minimap') &&
          !cls.contains('no-export')
        );
      };

      const dataUrl =
        format === 'png'
          ? await toPng(el, {
              backgroundColor: '#070b12',
              pixelRatio: 2,
              filter,
            })
          : await toSvg(el, {
              backgroundColor: '#070b12',
              filter,
            });

      const link = document.createElement('a');
      link.download = `private-ai-compute-fabric-${inferenceMode}.${format}`;
      link.href = dataUrl;
      link.click();
      setExportStatus(`Saved ${format.toUpperCase()}`);
      window.setTimeout(() => setExportStatus(null), 2500);
    } catch {
      setExportStatus('Export failed');
      window.setTimeout(() => setExportStatus(null), 2500);
    }
  }, [inferenceMode]);

  useEffect(() => {
    if (!exportTriggerRef) return;
    exportTriggerRef.current = exportDiagram;
    return () => {
      if (exportTriggerRef.current === exportDiagram) exportTriggerRef.current = null;
    };
  }, [exportDiagram, exportTriggerRef]);

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card overflow-hidden">
      {/* Architecture Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-4 py-3">
        {/* Mode Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          <div
            role="group"
            aria-label="AI Inference Architecture Mode"
            className="inline-flex items-center rounded-lg border border-border bg-muted p-1"
          >
            <button
              type="button"
              onClick={() => onChangeInferenceMode(InferenceMode.Distributed)}
              aria-pressed={inferenceMode === InferenceMode.Distributed}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0',
                inferenceMode === InferenceMode.Distributed
                  ? 'bg-violet-500 text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Layers className="h-3.5 w-3.5" />
              Mode 1: Distributed Inference
            </button>
            <button
              type="button"
              onClick={() => onChangeInferenceMode(InferenceMode.Independent)}
              aria-pressed={inferenceMode === InferenceMode.Independent}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0',
                inferenceMode === InferenceMode.Independent
                  ? 'bg-cyan-400 text-slate-950 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Split className="h-3.5 w-3.5" />
              Mode 2: Independent Inference
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Switch
              id="toggle-telemetry"
              checked={showTelemetry}
              onCheckedChange={setShowTelemetry}
              aria-label="Toggle telemetry connections"
            />
            <label htmlFor="toggle-telemetry" className="cursor-pointer select-none whitespace-nowrap">
              Telemetry Links
            </label>
          </div>
        </div>

        {/* Right Canvas Actions */}
        <div className="flex items-center gap-2">
          {exportStatus && (
            <span className="font-mono text-[11px] text-cyan-400">{exportStatus}</span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleAllZones}
            aria-label={anyZoneCollapsed ? 'Expand all zones' : 'Collapse all zones'}
          >
            {anyZoneCollapsed ? (
              <>
                <Maximize2 className="h-3.5 w-3.5" />
                Expand Zones
              </>
            ) : (
              <>
                <Minimize2 className="h-3.5 w-3.5" />
                Collapse Zones
              </>
            )}
          </Button>
          {!compactHeight && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMiniMap((m) => !m)}
            >
              {showMiniMap ? 'Hide Map' : 'MiniMap'}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleFitView}>
            <RotateCcw className="h-3.5 w-3.5" />
            Fit View
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportDiagram('svg')}>
            <Download className="h-3.5 w-3.5" />
            SVG
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportDiagram('png')}>
            <Download className="h-3.5 w-3.5" />
            PNG
          </Button>
          {onOpenFullScreen && (
            <Button variant="default" size="sm" onClick={onOpenFullScreen}>
              <Maximize2 className="h-3.5 w-3.5" />
              Full Studio
            </Button>
          )}
        </div>
      </div>

      {/* Mode Engineering Advisory + Category Filter Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/40 px-4 py-2">
        <div className="flex items-center gap-2 text-xs">
          {inferenceMode === InferenceMode.Distributed ? (
            <>
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span className="text-muted-foreground">
                <strong className="text-foreground">Distributed Sharding Mode:</strong> Proposed four-rank MLX/JACCL execution on <code className="font-mono text-foreground">Cluster 1</code>. The <span className="text-cyan-400 font-medium">896 GB total</span> is a sum of assumed per-node wired budgets, not a shared-memory pool. Checkpoint compatibility, tensor partitioning, KV cache and four-rank serving need physical validation.
              </span>
            </>
          ) : (
            <>
              <Info className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
              <span className="text-muted-foreground">
                <strong className="text-foreground">Independent Replicas Mode:</strong> Each Mac could run a standalone model within its own memory limit (e.g. four candidate 70B replicas in Cluster 2). LiteLLM health checks, routing and failure recovery must be configured and tested before claiming HA.
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 overflow-x-auto py-0.5">
          {CATEGORY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setCategoryFilter(opt.value)}
              className={cn(
                'rounded px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0',
                categoryFilter === opt.value
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/35'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* React Flow Diagram Viewport */}
      <div
        ref={wrapperRef}
        data-testid="architecture-topology-canvas"
        className={cn(
          'relative w-full bg-[var(--canvas-bg)]',
          compactHeight ? 'h-[560px]' : 'h-[calc(100vh-225px)] min-h-[640px]'
        )}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={TOPOLOGY_NODE_TYPES}
          onInit={(inst) => {
            rfInstanceRef.current = inst;
          }}
          fitView
          fitViewOptions={{ padding: 0.07 }}
          minZoom={0.28}
          maxZoom={1.6}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={true}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={22}
            size={1.2}
            color="var(--canvas-dots)"
          />
          <Controls showInteractive={false} position="bottom-right" />
          {!compactHeight && showMiniMap && (
            <MiniMap
              position="bottom-right"
              style={{ marginBottom: 110 }}
              pannable
              zoomable
              nodeColor={(n) => {
                if (n.type === 'zoneGroup') return 'transparent';
                if (n.type === 'macHardware' || n.type === 'mlxRuntime') return '#8b5cf6';
                if (n.type === 'gatewayHero') return '#06b6d4';
                return '#334155';
              }}
              maskColor="rgba(7, 11, 18, 0.72)"
            />
          )}
        </ReactFlow>

        {/* Connection Legend Overlay */}
        <div className="no-export absolute bottom-3 left-3 z-10 max-w-sm rounded-lg border border-border bg-card/95 backdrop-blur-xs p-3 shadow-lg">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[11px] font-semibold text-foreground">
              Connection Legend · Click any node to inspect
            </span>
            <button
              type="button"
              onClick={() => setShowLegend((v) => !v)}
              aria-label={showLegend ? 'Hide connection legend' : 'Show connection legend'}
              className="text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
            >
              {showLegend ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
          {showLegend && (
            <div className="mt-2.5 grid grid-cols-1 gap-1.5 text-[11px]">
              {(Object.entries(CONNECTION_PALETTE) as Array<
                [ConnectionStyleType, (typeof CONNECTION_PALETTE)[ConnectionStyleType]]
              >).map(([key, item]) => (
                <div key={key} className="flex items-center gap-2.5">
                  <svg width="28" height="10" className="shrink-0" aria-hidden="true">
                    <line
                      x1="0"
                      y1="5"
                      x2="28"
                      y2="5"
                      stroke={item.stroke}
                      strokeWidth={key === ConnectionStyleType.Rdma ? 3.5 : 2}
                      strokeDasharray={item.dashArray}
                    />
                  </svg>
                  <span className="text-muted-foreground truncate">{item.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export const ArchitectureTopologyCanvas: React.FC<ArchitectureTopologyCanvasProps> = (props) => {
  return (
    <ReactFlowProvider>
      <TopologyInner {...props} />
    </ReactFlowProvider>
  );
};
