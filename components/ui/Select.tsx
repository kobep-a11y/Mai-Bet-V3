import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  variant?: 'default' | 'filled' | 'ghost';
  selectSize?: 'sm' | 'md' | 'lg';
  error?: boolean;
  helperText?: string;
  label?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, variant = 'default', selectSize = 'md', error, helperText, label, id, options, ...props }, ref) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

    const baseClasses = 'input w-full appearance-none transition-all duration-200 pr-10';

    const variantClasses = {
      default: 'border border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600',
      filled: 'border-0 bg-gray-100 dark:bg-gray-800',
      ghost: 'border-0 bg-transparent',
    };

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2.5 text-base',
      lg: 'px-5 py-3 text-lg',
    };

    const errorClasses = error
      ? 'border-rose-500 focus:border-rose-600 focus:ring-rose-500'
      : '';

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              baseClasses,
              variantClasses[variant],
              sizeClasses[selectSize],
              errorClasses,
              className
            )}
            {...props}
          >
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
        {helperText && (
          <p
            className={cn(
              'mt-1.5 text-sm',
              error ? 'text-rose-600' : 'text-gray-500 dark:text-gray-400'
            )}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
