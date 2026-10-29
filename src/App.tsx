import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Boxes,
  CheckSquare,
  Cpu,
  Download,
  HardDrive,
  LayoutGrid,
  Menu,
  Moon,
  Network,
  Printer,
  Search,
  Share2,
  Sun,
} from 'lucide-react';
import { defaultInfrastructureProvider } from '@/src/services/infrastructureAdapter';
import {
  InferenceMode,
  NavSection,
  RoadmapItemStatus,
} from '@/src/types/architecture';
import { computeRoadmapProgress } from '@/src/utils/architectureLogic';
import { OverviewPage } from '@/src/pages/OverviewPage';
const TopologyPage = React.lazy(() => import('@/src/pages/TopologyPage').then((m) => ({ default: m.TopologyPage })));
const MacClusterPage = React.lazy(() => import('@/src/pages/MacClusterPage').then((m) => ({ default: m.MacClusterPage })));
const ProxmoxPage = React.lazy(() => import('@/src/pages/ProxmoxPage').then((m) => ({ default: m.ProxmoxPage })));
const ServicesPage = React.lazy(() => import('@/src/pages/ServicesPage').then((m) => ({ default: m.ServicesPage })));
const ObservabilityPage = React.lazy(() => import('@/src/pages/ObservabilityPage').then((m) => ({ default: m.ObservabilityPage })));
const NetworkPage = React.lazy(() => import('@/src/pages/NetworkPage').then((m) => ({ default: m.NetworkPage })));
const RoadmapPage = React.lazy(() => import('@/src/pages/RoadmapPage').then((m) => ({ default: m.RoadmapPage })));
import { ServiceDetailSheet } from '@/src/components/ServiceDetailSheet';
import { CommandSearchDialog } from '@/src/components/CommandSearchDialog';
import { Button } from '@/src/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/src/components/ui/sheet';
import { cn } from '@/src/lib/utils';

const ROADMAP_STORAGE_KEY = 'pacf_roadmap_statuses_v1';
const THEME_STORAGE_KEY = 'pacf_theme_v1';

const NAV_ITEMS: Array<{
  id: NavSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: NavSection.Overview, label: 'Overview', icon: LayoutGrid },
  { id: NavSection.Topology, label: 'Architecture Topology', icon: Share2 },
  { id: NavSection.MacCluster, label: 'Mac Studio Cluster', icon: Cpu },
  { id: NavSection.Proxmox, label: 'Proxmox Infrastructure', icon: HardDrive },
  { id: NavSection.Services, label: 'Services & Dependencies', icon: Boxes },
  { id: NavSection.Observability, label: 'Observability', icon: Activity },
  { id: NavSection.Network, label: 'Network Architecture', icon: Network },
  { id: NavSection.Roadmap, label: 'Deployment Roadmap', icon: CheckSquare },
];

export function App() {
  const config = useMemo(
    () => defaultInfrastructureProvider.getArchitectureConfig(),
    []
  );

  const [activeNav, setActiveNav] = useState<NavSection>(NavSection.Overview);
  const [inferenceMode, setInferenceMode] = useState<InferenceMode>(
    InferenceMode.Distributed
  );
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [globalExportError, setGlobalExportError] = useState<string | null>(null);

  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
      return saved ? saved === 'dark' : true;
    } catch {
      return true;
    }
  });

  const [roadmapOverrides, setRoadmapOverrides] = useState<
    Record<string, RoadmapItemStatus>
  >(() => {
    try {
      const raw = window.localStorage.getItem(ROADMAP_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Record<string, RoadmapItemStatus>) : {};
    } catch {
      return {};
    }
  });

  const exportTriggerRef = useRef<((format: 'png' | 'svg') => Promise<void>) | null>(
    null
  );

  // Sync dark/light class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
    } catch {
      // Ignore storage errors in restricted environments
    }
  }, [isDark]);

  // Persist roadmap status overrides
  useEffect(() => {
    try {
      window.localStorage.setItem(
        ROADMAP_STORAGE_KEY,
        JSON.stringify(roadmapOverrides)
      );
    } catch {
      // Ignore storage errors
    }
  }, [roadmapOverrides]);

  // Keyboard shortcut Cmd/Ctrl + K for Architecture Search
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const roadmapProgress = useMemo(
    () => computeRoadmapProgress(config.roadmapPhases, roadmapOverrides),
    [config.roadmapPhases, roadmapOverrides]
  );

  const handleUpdateRoadmapTask = useCallback(
    (taskId: string, status: RoadmapItemStatus) => {
      setRoadmapOverrides((prev) => ({
        ...prev,
        [taskId]: status,
      }));
    },
    []
  );

  const handleResetRoadmap = useCallback(() => {
    setRoadmapOverrides({});
  }, []);

  const handleGlobalExport = useCallback(
    async (format: 'png' | 'svg') => {
      setGlobalExportError(null);
      if (
        activeNav !== NavSection.Overview &&
        activeNav !== NavSection.Topology
      ) {
        setActiveNav(NavSection.Topology);
      }

      // Route chunks load asynchronously: wait for the mounted canvas to install
      // its export handler, instead of racing it with a fixed 450 ms timeout.
      for (let attempt = 0; attempt < 50; attempt++) {
        if (exportTriggerRef.current) {
          await exportTriggerRef.current(format);
          return;
        }
        await new Promise<void>((resolve) => window.setTimeout(resolve, 100));
      }
      setGlobalExportError('Topology is still loading. Please retry the export.');
    },
    [activeNav]
  );

  const renderSidebarLinks = (onAfterClick?: () => void) => (
    <nav aria-label="Primary Architecture Navigation" className="space-y-1 px-3 py-4 flex-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = activeNav === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setActiveNav(item.id);
              onAfterClick?.();
            }}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap',
              active
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground border border-transparent'
            )}
          >
            <Icon
              className={cn(
                'h-4 w-4 shrink-0',
                active ? 'text-cyan-400' : 'text-muted-foreground'
              )}
            />
            <span className="truncate">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-border bg-card z-30">
        <div className="flex h-15 items-center gap-2.5 border-b border-border px-5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-cyan-500/15 border border-cyan-400/40 text-cyan-400 shrink-0">
            <Share2 className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold tracking-tight text-foreground truncate">
              Compute Fabric
            </div>
            <div className="font-mono text-[10px] text-muted-foreground truncate">
              Architecture Explorer
            </div>
          </div>
        </div>

        {renderSidebarLinks()}

        {/* Sidebar Architecture Context Footer */}
        <div className="border-t border-border p-4 space-y-2.5 text-xs">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Inference Topology</span>
            <span className="font-mono text-cyan-400">
              {inferenceMode === InferenceMode.Distributed ? 'Distributed' : 'Independent'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1 rounded-md border border-border bg-muted p-0.5">
            <button
              type="button"
              onClick={() => setInferenceMode(InferenceMode.Distributed)}
              aria-pressed={inferenceMode === InferenceMode.Distributed}
              className={cn(
                'rounded px-2 py-1 text-[10px] font-medium transition-colors cursor-pointer',
                inferenceMode === InferenceMode.Distributed
                  ? 'bg-card text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Sharded
            </button>
            <button
              type="button"
              onClick={() => setInferenceMode(InferenceMode.Independent)}
              aria-pressed={inferenceMode === InferenceMode.Independent}
              className={cn(
                'rounded px-2 py-1 text-[10px] font-medium transition-colors cursor-pointer',
                inferenceMode === InferenceMode.Independent
                  ? 'bg-card text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Replicas
            </button>
          </div>
          <div className="text-[10px] font-mono text-muted-foreground leading-relaxed pt-1">
            Spec {config.metadata.version} · {config.metadata.environment}
          </div>
        </div>
      </aside>

      {/* Mobile Navigation Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="p-0 flex flex-col">
          <SheetHeader className="p-4 border-b border-border">
            <SheetTitle className="text-sm">{config.metadata.projectName}</SheetTitle>
          </SheetHeader>
          {renderSidebarLinks(() => setMobileMenuOpen(false))}
        </SheetContent>
      </Sheet>

      {/* Main Content Shell */}
      <div className="flex flex-1 flex-col lg:pl-64 min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-20 flex h-15 items-center justify-between gap-4 border-b border-border bg-card/95 backdrop-blur-xs px-4 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu className="h-4 w-4" />
            </Button>

            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-sm font-bold tracking-tight text-foreground whitespace-nowrap">
                  {config.metadata.projectName}
                </h1>
                <span className="hidden md:inline text-muted-foreground" aria-hidden="true">
                  ·
                </span>
                <span className="hidden md:inline text-xs text-muted-foreground whitespace-nowrap">
                  {config.metadata.subtitle}
                </span>
                <span className="hidden xl:inline text-muted-foreground" aria-hidden="true">
                  ·
                </span>
                <span className="hidden xl:inline font-mono text-[11px] text-cyan-400 whitespace-nowrap">
                  {config.metadata.version}
                </span>
                <span className="hidden xl:inline text-muted-foreground" aria-hidden="true">
                  ·
                </span>
                <span className="hidden xl:inline font-mono text-[11px] text-amber-400/90 whitespace-nowrap">
                  {config.metadata.environment}
                </span>
              </div>
            </div>
          </div>

          {/* Right Header Controls: Architecture Search, Theme Toggle, Export Diagram */}
          <div className="flex items-center gap-2 shrink-0">
            {globalExportError && <span role="alert" className="text-xs text-amber-400">{globalExportError}</span>}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchOpen(true)}
              aria-label="Search architecture components"
              className="text-muted-foreground hover:text-foreground"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Search Architecture</span>
              <kbd className="hidden md:inline-block ml-1.5 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                ⌘K
              </kbd>
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsDark((d) => !d)}
              aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default" size="sm">
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Export Diagram</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleGlobalExport('png')}>
                  <Download className="h-3.5 w-3.5 text-cyan-400" />
                  Export Topology as PNG
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleGlobalExport('svg')}>
                  <Download className="h-3.5 w-3.5 text-violet-400" />
                  Export Topology as SVG
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => window.print()}>
                  <Printer className="h-3.5 w-3.5 text-muted-foreground" />
                  Print Architecture View
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Active Page Viewport */}
        <main className="flex-1 p-4 sm:p-6 max-w-[1680px] w-full mx-auto">
          <motion.div
            key={activeNav}
            initial={{ opacity: 0.85, y: 2 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
          >
            <React.Suspense fallback={<div role="status" className="p-6 text-sm text-muted-foreground">Loading architecture view…</div>}>
              {activeNav === NavSection.Overview && (
                <OverviewPage
                  config={config}
                  inferenceMode={inferenceMode}
                  onChangeInferenceMode={setInferenceMode}
                  selectedServiceId={selectedServiceId}
                  onSelectService={setSelectedServiceId}
                  roadmapProgress={roadmapProgress}
                  onNavigate={setActiveNav}
                  exportTriggerRef={exportTriggerRef}
                />
              )}

              {activeNav === NavSection.Topology && (
                <TopologyPage
                  config={config}
                  inferenceMode={inferenceMode}
                  onChangeInferenceMode={setInferenceMode}
                  selectedServiceId={selectedServiceId}
                  onSelectService={setSelectedServiceId}
                  exportTriggerRef={exportTriggerRef}
                />
              )}

              {activeNav === NavSection.MacCluster && (
                <MacClusterPage
                  config={config}
                  inferenceMode={inferenceMode}
                  onChangeInferenceMode={setInferenceMode}
                  onSelectService={setSelectedServiceId}
                />
              )}

              {activeNav === NavSection.Proxmox && (
                <ProxmoxPage
                  config={config}
                  onSelectService={setSelectedServiceId}
                />
              )}

              {activeNav === NavSection.Services && (
                <ServicesPage
                  config={config}
                  inferenceMode={inferenceMode}
                  onSelectService={setSelectedServiceId}
                />
              )}

              {activeNav === NavSection.Observability && (
                <ObservabilityPage onSelectService={setSelectedServiceId} />
              )}

              {activeNav === NavSection.Network && (
                <NetworkPage
                  config={config}
                  onSelectService={setSelectedServiceId}
                />
              )}

              {activeNav === NavSection.Roadmap && (
                <RoadmapPage
                  config={config}
                  statusOverrides={roadmapOverrides}
                  roadmapProgress={roadmapProgress}
                  onUpdateTaskStatus={handleUpdateRoadmapTask}
                  onResetRoadmap={handleResetRoadmap}
                />
              )}
            </React.Suspense>
          </motion.div>
        </main>
      </div>

      {/* Interactive Slide-Over Service Details Sheet */}
      <ServiceDetailSheet
        serviceId={selectedServiceId}
        config={config}
        inferenceMode={inferenceMode}
        onClose={() => setSelectedServiceId(null)}
        onSelectService={setSelectedServiceId}
      />

      {/* Global Architecture Search Modal */}
      <CommandSearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        config={config}
        onSelectService={setSelectedServiceId}
        onNavigate={setActiveNav}
      />
    </div>
  );
}

export default App;
