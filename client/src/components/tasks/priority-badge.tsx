import React from 'react';
import { Priority } from '@/types/task.types';
import { PRIORITY_CONFIG } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function PrioritySignalIcon({ 
  priority, 
  className = "w-3.5 h-3.5" 
}: { 
  priority: Priority; 
  className?: string 
}) {
  const activeBars = {
    URGENT: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
    NO_PRIORITY: 0,
  }[priority] ?? 0;

  const colorClass = {
    URGENT: 'text-red-500 dark:text-red-400',
    HIGH: 'text-orange-500 dark:text-orange-400',
    MEDIUM: 'text-amber-500 dark:text-amber-400',
    LOW: 'text-zinc-400 dark:text-zinc-500',
    NO_PRIORITY: 'text-zinc-300 dark:text-zinc-600',
  }[priority] ?? 'text-zinc-300';

  if (priority === 'NO_PRIORITY') {
    return (
      <span className={cn("inline-block w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600", className)} />
    );
  }

  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      className={cn("inline-block shrink-0", className, colorClass)}
    >
      <rect x="1" y="11" width="2.5" height="4" rx="0.5" opacity={activeBars >= 1 ? 1 : 0.25} />
      <rect x="5" y="8" width="2.5" height="7" rx="0.5" opacity={activeBars >= 2 ? 1 : 0.25} />
      <rect x="9" y="5" width="2.5" height="10" rx="0.5" opacity={activeBars >= 3 ? 1 : 0.25} />
      <rect x="13" y="2" width="2.5" height="13" rx="0.5" opacity={activeBars >= 4 ? 1 : 0.25} />
    </svg>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.NO_PRIORITY;

  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium', config.bg, config.text)}>
      <PrioritySignalIcon priority={priority} className="w-3 h-3" />
      {priority.replace('_', ' ')}
    </span>
  );
}
