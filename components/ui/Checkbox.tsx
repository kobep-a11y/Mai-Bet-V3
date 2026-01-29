import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  helperText?: string;
  error?: boolean;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, helperText, error, id, ...props }, ref) => {
    const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="flex items-start gap-3">
        <div className="relative flex items-center">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            className={cn(
              'peer h-5 w-5 shrink-0 rounded border border-gray-300 dark:border-gray-600',
              'bg-white dark:bg-gray-800',
              'focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'checked:bg-sky-600 checked:border-sky-600',
              'transition-all duration-200',
              error && 'border-rose-500',
              className
            )}
            {...props}
          />
          <Check className="absolute left-0.5 top-0.5 h-4 w-4 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
        </div>
        {(label || helperText) && (
          <div className="flex flex-col">
            {label && (
              <label
                htmlFor={checkboxId}
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

Checkbox.displayName = 'Checkbox';

export default Checkbox;
