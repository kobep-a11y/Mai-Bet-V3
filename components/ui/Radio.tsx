import React from 'react';
import { cn } from '@/lib/utils';

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  helperText?: string;
  error?: boolean;
}

const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, helperText, error, id, ...props }, ref) => {
    const radioId = id || `radio-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="flex items-start gap-3">
        <div className="relative flex items-center">
          <input
            ref={ref}
            type="radio"
            id={radioId}
            className={cn(
              'peer h-5 w-5 shrink-0 rounded-full border border-gray-300 dark:border-gray-600',
              'bg-white dark:bg-gray-800',
              'focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'checked:border-sky-600 checked:border-[6px]',
              'transition-all duration-200',
              error && 'border-rose-500',
              className
            )}
            {...props}
          />
        </div>
        {(label || helperText) && (
          <div className="flex flex-col">
            {label && (
              <label
                htmlFor={radioId}
                className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
              >
                {label}
              </label>
            )}
            {helperText && (
              <p
                className={cn(
                  'text-sm mt-0.5',
                  error ? 'text-rose-600' : 'text-gray-500 dark:text-gray-400'
                )}
              >
                {helperText}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Radio.displayName = 'Radio';

export interface RadioGroupProps {
  children: React.ReactNode;
  label?: string;
  error?: boolean;
  helperText?: string;
  className?: string;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  children,
  label,
  error,
  helperText,
  className,
}) => {
  return (
    <div className={cn('space-y-3', className)}>
      {label && (
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </div>
      )}
      <div className="space-y-2">{children}</div>
      {helperText && (
        <p
          className={cn(
            'text-sm mt-1.5',
            error ? 'text-rose-600' : 'text-gray-500 dark:text-gray-400'
          )}
        >
          {helperText}
        </p>
      )}
    </div>
  );
};

export default Radio;
