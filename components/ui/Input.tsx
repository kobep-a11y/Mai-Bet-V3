import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'filled' | 'ghost';
  inputSize?: 'sm' | 'md' | 'lg';
  error?: boolean;
  helperText?: string;
  label?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant = 'default', inputSize = 'md', error, helperText, label, id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    const baseClasses = 'input w-full transition-all duration-200';

    const variantClasses = {
      default: 'border border-gray-300 bg-white',
      filled: 'border-0 bg-gray-100',
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
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            baseClasses,
            variantClasses[variant],
            sizeClasses[inputSize],
            errorClasses,
            className
          )}
          {...props}
        />
        {helperText && (
          <p
            className={cn(
              'mt-1.5 text-sm',
              error ? 'text-rose-600' : 'text-gray-500'
            )}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: 'default' | 'filled' | 'ghost';
  textareaSize?: 'sm' | 'md' | 'lg';
  error?: boolean;
  helperText?: string;
  label?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant = 'default', textareaSize = 'md', error, helperText, label, id, ...props }, ref) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

    const baseClasses = 'input w-full transition-all duration-200 resize-y min-h-[100px]';

    const variantClasses = {
      default: 'border border-gray-300 bg-white',
      filled: 'border-0 bg-gray-100',
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
            htmlFor={textareaId}
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            baseClasses,
            variantClasses[variant],
            sizeClasses[textareaSize],
            errorClasses,
            className
          )}
          {...props}
        />
        {helperText && (
          <p
            className={cn(
              'mt-1.5 text-sm',
              error ? 'text-rose-600' : 'text-gray-500'
            )}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Input;
