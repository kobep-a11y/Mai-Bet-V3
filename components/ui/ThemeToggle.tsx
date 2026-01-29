'use client';

import React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { cn } from '@/lib/utils';

export interface ThemeToggleProps {
  variant?: 'icon' | 'full';
  className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ variant = 'icon', className }) => {
  const { theme, setTheme, actualTheme } = useTheme();

  if (variant === 'icon') {
    return (
      <button
        onClick={() => setTheme(actualTheme === 'dark' ? 'light' : 'dark')}
        className={cn(
          'btn-icon relative overflow-hidden',
          'hover:bg-gray-100 dark:hover:bg-gray-800',
          'transition-all duration-300',
          className
        )}
        aria-label="Toggle theme"
      >
        <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      </button>
    );
  }

  return (
    <div className={cn('flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg', className)}>
      <button
        onClick={() => setTheme('light')}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all',
          theme === 'light'
            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
        )}
        aria-label="Light mode"
      >
        <Sun className="h-4 w-4" />
        <span>Light</span>
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all',
          theme === 'dark'
            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
        )}
        aria-label="Dark mode"
      >
        <Moon className="h-4 w-4" />
        <span>Dark</span>
      </button>
      <button
        onClick={() => setTheme('system')}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all',
          theme === 'system'
            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
        )}
        aria-label="System theme"
      >
        <Monitor className="h-4 w-4" />
        <span>System</span>
      </button>
    </div>
  );
};

export default ThemeToggle;
