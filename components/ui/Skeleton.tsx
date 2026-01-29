import React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'rectangular', width, height, lines = 1, ...props }, ref) => {
    const variantClasses = {
      text: 'rounded',
      circular: 'rounded-full',
      rectangular: 'rounded-lg',
    };

    const baseClasses = 'skeleton bg-gray-200 dark:bg-gray-700 animate-shimmer';

    const style: React.CSSProperties = {
      width: width || (variant === 'circular' ? height : '100%'),
      height: height || (variant === 'text' ? '1em' : '100%'),
    };

    if (variant === 'text' && lines > 1) {
      return (
        <div ref={ref} className={cn('space-y-2', className)} {...props}>
          {Array.from({ length: lines }).map((_, index) => (
            <div
              key={index}
              className={cn(baseClasses, variantClasses[variant])}
              style={{
                ...style,
                width: index === lines - 1 ? '80%' : style.width,
              }}
            />
          ))}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(baseClasses, variantClasses[variant], className)}
        style={style}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

export default Skeleton;
