import React from 'react';
import { cn } from '@/lib/utils';

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  responsive?: boolean;
  children: React.ReactNode;
}

const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  ({ className, cols = 1, gap = 'md', responsive = true, children, ...props }, ref) => {
    const colsClasses = responsive
      ? {
          1: 'grid-cols-1',
          2: 'grid-cols-1 md:grid-cols-2',
          3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
          4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
          5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-5',
          6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-6',
          12: 'grid-cols-1 md:grid-cols-12',
        }
      : {
          1: 'grid-cols-1',
          2: 'grid-cols-2',
          3: 'grid-cols-3',
          4: 'grid-cols-4',
          5: 'grid-cols-5',
          6: 'grid-cols-6',
          12: 'grid-cols-12',
        };

    const gapClasses = {
      xs: 'gap-2',
      sm: 'gap-4',
      md: 'gap-6',
      lg: 'gap-8',
      xl: 'gap-12',
    };

    return (
      <div
        ref={ref}
        className={cn('grid', colsClasses[cols], gapClasses[gap], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Grid.displayName = 'Grid';

export default Grid;
