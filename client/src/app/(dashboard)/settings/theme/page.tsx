'use client';

import React from 'react';
import { Sun, Moon, Check } from 'lucide-react';
import { useThemeCustom } from '@/components/providers/theme-provider';

export default function ThemeSettingsPage() {
  const { theme, setTheme } = useThemeCustom();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Theme</h1>
        <p className="text-xs text-zinc-500">Choose how the interface appears to you.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-md">
        <button
          onClick={() => setTheme('light')}
          className={`flex items-center justify-between p-4 rounded-xl border transition ${
            theme === 'light'
              ? 'border-primary bg-primary/5 shadow-sm'
              : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
          }`}
        >
          <div className="flex items-center gap-3">
            <Sun className="w-5 h-5 text-amber-500" />
            <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Light Mode</span>
          </div>
          {theme === 'light' && <Check className="w-4 h-4 text-primary" />}
        </button>

        <button
          onClick={() => setTheme('dark')}
          className={`flex items-center justify-between p-4 rounded-xl border transition ${
            theme === 'dark'
              ? 'border-primary bg-primary/5 shadow-sm'
              : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
          }`}
        >
          <div className="flex items-center gap-3">
            <Moon className="w-5 h-5 text-indigo-400" />
            <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Dark Mode</span>
          </div>
          {theme === 'dark' && <Check className="w-4 h-4 text-primary" />}
        </button>
      </div>
    </div>
  );
}