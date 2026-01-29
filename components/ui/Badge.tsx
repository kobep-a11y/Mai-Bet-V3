import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'status' | 'odds' | 'quarter';
  status?: 'live' | 'halftime' | 'scheduled' | 'final';
  positive?: boolean;
  children?: React.ReactNode;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', status, positive, children, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center gap-1.5 font-medium rounded-full';

    const variantClasses = {
      default: 'px-2.5 py-1 text-xs bg-gray-100 text-gray-700',
      status: 'status-badge',
      odds: 'odds-badge',
      quarter: 'quarter-badge px-2 py-0.5 text-xs font-mono',
    };

    const statusClasses = status ? `status-badge ${status}` : '';
    const oddsClasses = positive ? 'text-emerald-600' : 'text-gray-600';

    return (
      <span
        ref={ref}
        className={cn(
          baseClasses,
          variant === 'status' ? statusClasses : variantClasses[variant],
          variant === 'odds' && oddsClasses,
          className
        )}
        {...props}
      >
        {variant === 'status' && status === 'live' && (
          <span className="live-indicator"></span>
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: 'live' | 'halftime' | 'scheduled' | 'final';
}

export const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status, children, ...props }, ref) => {
    return (
      <Badge ref={ref} variant="status" status={status} {...props}>
        {children || status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  }
);

StatusBadge.displayName = 'StatusBadge';

export interface OddsBadgeProps extends Omit<BadgeProps, 'variant'> {
  value: number;
  showSign?: boolean;
}

export const OddsBadge = React.forwardRef<HTMLSpanElement, OddsBadgeProps>(
  ({ value, showSign = true, children, ...props }, ref) => {
    const isPositive = value > 0;
    const displayValue = showSign && isPositive ? `+${value}` : value;

    return (
      <Badge ref={ref} variant="odds" positive={isPositive} {...props}>
        {children || displayValue}
      </Badge>
    );
  }
);

OddsBadge.displayName = 'OddsBadge';

export interface QuarterBadgeProps extends Omit<BadgeProps, 'variant'> {
  quarter: number | string;
}

export const QuarterBadge = React.forwardRef<HTMLSpanElement, QuarterBadgeProps>(
  ({ quarter, children, ...props }, ref) => {
    return (
      <Badge ref={ref} variant="quarter" {...props}>
        {children || `Q${quarter}`}
      </Badge>
    );
  }
);

QuarterBadge.displayName = 'QuarterBadge';

export default Badge;
