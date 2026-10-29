import React from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  Lightbulb,
  RotateCcw,
} from 'lucide-react';
import {
  ArchitectureConfig,
  RoadmapItemStatus,
} from '@/src/types/architecture';
import { RoadmapProgressSummary } from '@/src/utils/architectureLogic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Progress } from '@/src/components/ui/progress';
import { cn } from '@/src/lib/utils';

interface RoadmapPageProps {
  config: ArchitectureConfig;
  statusOverrides: Record<string, RoadmapItemStatus>;
  roadmapProgress: RoadmapProgressSummary;
  onUpdateTaskStatus: (taskId: string, status: RoadmapItemStatus) => void;
  onResetRoadmap: () => void;
}

const STATUS_SEQUENCE: RoadmapItemStatus[] = [
  RoadmapItemStatus.NotStarted,
  RoadmapItemStatus.Conceptual,
  RoadmapItemStatus.InProgress,
  RoadmapItemStatus.Completed,
];

export const RoadmapPage: React.FC<RoadmapPageProps> = ({
  config,
  statusOverrides,
  roadmapProgress,
  onUpdateTaskStatus,
  onResetRoadmap,
}) => {
  const cycleStatus = (current: RoadmapItemStatus) => {
    const idx = STATUS_SEQUENCE.indexOf(current);
    return STATUS_SEQUENCE[(idx + 1) % STATUS_SEQUENCE.length];
  };

  return (
    <div className="space-y-6">
      {/* Overall Roadmap Header & Progress */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-xl border border-border bg-card p-5">
        <div className="space-y-1 max-w-3xl">
          <div className="text-xs font-mono text-muted-foreground">
            Phased Implementation Plan · Local Interactive Planning State
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            5-Phase Private AI Compute Fabric Deployment Roadmap
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            All deliverables default to <strong className="text-foreground">Not Started</strong> to reflect pre-deployment architecture planning. Click any task or status selector below to simulate planning milestones locally.
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="w-48 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-muted-foreground">POC Progress</span>
              <span className="font-semibold text-cyan-400 tabular-nums">
                {roadmapProgress.completionPercent}%
              </span>
            </div>
            <Progress value={roadmapProgress.completionPercent} />
            <div className="text-[10px] font-mono text-muted-foreground tabular-nums">
              {roadmapProgress.completedCount} done · {roadmapProgress.inProgressCount} active ·{' '}
              {roadmapProgress.notStartedCount} not started
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onResetRoadmap}
            disabled={Object.keys(statusOverrides).length === 0}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset All
          </Button>
        </div>
      </div>

      {/* 5 Phases */}
      <div className="space-y-5">
        {config.roadmapPhases.map((phase, idx) => {
          const phaseStats = roadmapProgress.phaseBreakdown[idx];
          return (
            <Card key={phase.id}>
              <CardHeader className="pb-3 border-b border-border">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
                      <span>{phase.targetMilestone}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-muted-foreground">
                        Prerequisites: {phase.dependencies}
                      </span>
                    </div>
                    <CardTitle className="mt-1 text-base">{phase.title}</CardTitle>
                    <CardDescription className="mt-0.5">{phase.subtitle}</CardDescription>
                  </div>

                  <div className="w-full sm:w-44 space-y-1 shrink-0">
                    <div className="flex justify-between font-mono text-xs tabular-nums">
                      <span className="text-muted-foreground">
                        {phaseStats.completed}/{phaseStats.total} complete
                      </span>
                      <span className="text-foreground font-semibold">
                        {phaseStats.percent}%
                      </span>
                    </div>
                    <Progress value={phaseStats.percent} className="h-1.5" />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {phase.tasks.map((task) => {
                    const status = statusOverrides[task.id] ?? task.defaultStatus;

                    return (
                      <div
                        key={task.id}
                        className={cn(
                          'flex items-start justify-between gap-3 rounded-lg border p-3.5 transition-colors',
                          status === RoadmapItemStatus.Completed
                            ? 'border-emerald-500/35 bg-emerald-950/15'
                            : status === RoadmapItemStatus.InProgress
                              ? 'border-cyan-500/40 bg-cyan-950/15'
                              : status === RoadmapItemStatus.Conceptual
                                ? 'border-violet-500/35 bg-violet-950/15'
                                : 'border-border bg-muted/25'
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => onUpdateTaskStatus(task.id, cycleStatus(status))}
                          aria-label={`Toggle status for ${task.title}`}
                          className="flex items-start gap-2.5 text-left flex-1 cursor-pointer focus-visible:outline-none"
                        >
                          <span className="mt-0.5 shrink-0">
                            {status === RoadmapItemStatus.Completed ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            ) : status === RoadmapItemStatus.InProgress ? (
                              <Clock className="h-4 w-4 text-cyan-400" />
                            ) : status === RoadmapItemStatus.Conceptual ? (
                              <Lightbulb className="h-4 w-4 text-violet-400" />
                            ) : (
                              <Circle className="h-4 w-4 text-muted-foreground" />
                            )}
                          </span>
                          <div>
                            <div className="text-xs font-semibold text-foreground">
                              {task.title}
                            </div>
                            <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                              {task.detail}
                            </p>
                          </div>
                        </button>

                        <select
                          aria-label={`Status for ${task.title}`}
                          value={status}
                          onChange={(e) =>
                            onUpdateTaskStatus(task.id, e.target.value as RoadmapItemStatus)
                          }
                          className="h-7 rounded border border-input bg-background px-2 font-mono text-[10px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring shrink-0 cursor-pointer"
                        >
                          {STATUS_SEQUENCE.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
