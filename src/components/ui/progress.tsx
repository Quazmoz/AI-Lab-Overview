import * as React from 'react';
import { cn } from '@/src/lib/utils';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  indicatorClassName?: string;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, indicatorClassName, ...props }, ref) => {
    const clamped = Math.max(0, Math.min(100, value));
    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(clamped)}
        className={cn(
          'relative h-2 w-full overflow-hidden rounded-full bg-secondary',
          className
        )}
        {...props}
      >
        <div
          className={cn(
            'h-full bg-cyan-500 transition-transform duration-200 ease-out origin-left',
            indicatorClassName
          )}
          style={{ transform: `scaleX(${clamped / 100})` }}
        />
      </div>
    );
  }
);
Progress.displayName = 'Progress';

export { Progress };
