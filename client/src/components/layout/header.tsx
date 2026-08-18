'use client';

import React from 'react';
import { Search, Plus, List as ListIcon, Kanban } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotificationBell } from '@/components/notifications/notification-bell';

interface HeaderProps {
  title: string;
  search: string;
  onSearchChange: (value: string) => void;
  viewMode?: 'board' | 'list';
  onViewModeChange?: (mode: 'board' | 'list') => void;
  onAddTaskClick: () => void;
  fieldsAction?: React.ReactNode;
  filterAction?: React.ReactNode;
}

export function Header({
  title,
  search,
  onSearchChange,
  viewMode,
  onViewModeChange,
  onAddTaskClick,
  fieldsAction,
  filterAction,
}: HeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{title}</h1>

      <div className="flex items-center gap-2.5 flex-wrap">
        {/* Global Notification Bell */}
        <NotificationBell />

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search..."
            className="pl-9 pr-12 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none focus:ring-2 focus:ring-primary w-52 text-zinc-800 dark:text-zinc-200"
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">
            ⌘F
          </span>
        </div>

        {/* View Mode Toggle */}
        {viewMode && onViewModeChange && (
          <div className="flex items-center p-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <button
              onClick={() => onViewModeChange('list')}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded transition',
                viewMode === 'list'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              )}
            >
              <ListIcon className="w-3.5 h-3.5" /> List
            </button>
            <button
              onClick={() => onViewModeChange('board')}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded transition',
                viewMode === 'board'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              )}
            >
              <Kanban className="w-3.5 h-3.5" /> Board
            </button>
          </div>
        )}

        {/* Separate Buttons */}
        {fieldsAction}
        {filterAction}

        {/* Add Task Button */}
        <button
          onClick={onAddTaskClick}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:opacity-90 transition shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" /> Add Task
        </button>
      </div>
    </div>
  );
}
