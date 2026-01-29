import React from 'react';
import { cn } from '@/lib/utils';

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'white';
}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = 'md', color = 'primary', ...props }, ref) => {
    const sizeClasses = {
      xs: 'w-3 h-3 border',
      sm: 'w-4 h-4 border-2',
      md: 'w-6 h-6 border-2',
      lg: 'w-8 h-8 border-[3px]',
      xl: 'w-12 h-12 border-4',
    };

    const colorClasses = {
      default: 'border-gray-300 border-t-gray-600',
      primary: 'border-sky-200 dark:border-sky-900 border-t-sky-600 dark:border-t-sky-400',
      secondary: 'border-indigo-200 dark:border-indigo-900 border-t-indigo-600 dark:border-t-indigo-400',
      success: 'border-emerald-200 dark:border-emerald-900 border-t-emerald-600 dark:border-t-emerald-400',
      warning: 'border-amber-200 dark:border-amber-900 border-t-amber-500 dark:border-t-amber-400',
      danger: 'border-rose-200 dark:border-rose-900 border-t-rose-600 dark:border-t-rose-400',
      white: 'border-white/30 border-t-white',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'inline-block rounded-full animate-spin',
          sizeClasses[size],
          colorClasses[color],
          className
        )}
        role="status"
        aria-label="Loading"
        {...props}
      >
        <span className="sr-only">Loading...</span>
      </div>
    );
  }
);

Spinner.displayName = 'Spinner';

export interface LoadingProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

export const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  text,
  fullScreen = false,
  className,
}) => {
  const content = (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <Spinner size={size} />
      {text && <p className="text-sm text-gray-600 dark:text-gray-400">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
};

Loading.displayName = 'Loading';

export default Spinner;
