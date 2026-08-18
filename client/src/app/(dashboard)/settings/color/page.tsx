'use client';

import React from 'react';
import { useThemeCustom } from '@/components/providers/theme-provider';
import { COLOR_ACCENTS } from '@/lib/constants';
import { Check } from 'lucide-react';

export default function ColorSettingsPage() {
  const { color, setColor } = useThemeCustom();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Color Mode</h1>
        <p className="text-xs text-zinc-500">Pick your workspace primary accent tone.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-lg">
        {COLOR_ACCENTS.map((c) => (
          <button
            key={c.value}
            onClick={() => setColor(c.value)}
            className={`flex items-center justify-between p-3 rounded-xl border transition ${
              color === c.value
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className={`w-4 h-4 rounded-full ${c.bgClass}`} />
              <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">{c.name}</span>
            </div>
            {color === c.value && <Check className="w-4 h-4 text-primary" />}
          </button>
        ))}
      </div>
    </div>
  );
}