'use client';

import React from 'react';
import { Task } from '@/types/task.types';
import { Calendar, User as UserIcon } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { VisibleFields } from './fields-filter';
import { PriorityBadge } from './priority-badge';

interface TaskBoardCardProps {
  task: Task;
  onClick: () => void;
  visibleFields: VisibleFields;
}

export function TaskBoardCard({ task, onClick, visibleFields }: TaskBoardCardProps) {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('taskId', task.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={onClick}
      className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-all select-none space-y-3 group"
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-semibold text-xs text-zinc-800 dark:text-zinc-200 group-hover:text-primary transition-colors">
          {task.title}
        </h4>
        {visibleFields.priority && <PriorityBadge priority={task.priority} />}
      </div>

      <div className="flex items-center justify-between text-xs text-zinc-500 flex-wrap gap-2">
        {visibleFields.role && (
          <span className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-[10px] font-medium text-zinc-600 dark:text-zinc-300">
            <UserIcon className="w-3 h-3 text-primary" />
            {task.role || 'Admin'}
          </span>
        )}

        {visibleFields.dueDate && task.dueDate && (
          <span className="flex items-center gap-1 text-red-500 text-[10px] font-medium ml-auto">
            <Calendar className="w-3 h-3" />
            {formatDate(task.dueDate)}
          </span>
        )}
      </div>

      {visibleFields.labels && task.labels && task.labels.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          {task.project && (
            <span className="text-[10px] bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded border border-purple-200/60 dark:border-purple-800/60 font-semibold flex items-center gap-1">
              📁 {task.project.title}
            </span>
          )}
          {task.labels.map((lbl, idx) => (
            <span
              key={idx}
              className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded border border-zinc-200/60 dark:border-zinc-700/60 font-medium"
            >
              {lbl}
            </span>
          ))}
        </div>
      )}
      {!visibleFields.labels && task.project && (
        <div className="pt-1">
          <span className="text-[10px] bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded border border-purple-200/60 dark:border-purple-800/60 font-semibold inline-flex items-center gap-1">
            📁 {task.project.title}
          </span>
        </div>
      )}
    </div>
  );
}
