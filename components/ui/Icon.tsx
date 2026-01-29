import React from 'react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

export interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {
  icon: LucideIcon;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'muted';
}

const Icon = React.forwardRef<HTMLSpanElement, IconProps>(
  ({ className, icon: IconComponent, size = 'md', color = 'default', ...props }, ref) => {
    const sizeClasses = {
      xs: 'w-3 h-3',
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
      xl: 'w-8 h-8',
    };

    const colorClasses = {
      default: 'text-current',
      primary: 'text-sky-600 dark:text-sky-400',
      secondary: 'text-indigo-600 dark:text-indigo-400',
      success: 'text-emerald-600 dark:text-emerald-400',
      warning: 'text-amber-500 dark:text-amber-400',
      danger: 'text-rose-600 dark:text-rose-400',
      muted: 'text-gray-500 dark:text-gray-400',
    };

    return (
      <span ref={ref} className={cn('inline-flex items-center justify-center', className)} {...props}>
        <IconComponent className={cn(sizeClasses[size], colorClasses[color])} />
      </span>
    );
  }
);

Icon.displayName = 'Icon';

export default Icon;
