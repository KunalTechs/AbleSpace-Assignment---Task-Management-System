'use client';

import React, { useState } from 'react';
import { Task, TaskStatus } from '@/types/task.types';
import { TASK_COLUMNS } from '@/lib/constants';
import { TaskBoardCard } from './task-board-card';
import { VisibleFields } from './fields-filter';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskBoardViewProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onAddTask: (status: TaskStatus) => void;
  onTaskDrop: (taskId: string, targetStatus: TaskStatus) => void;
  visibleFields: VisibleFields;
}

export function TaskBoardView({
  tasks,
  onSelectTask,
  onAddTask,
  onTaskDrop,
  visibleFields,
}: TaskBoardViewProps) {
  const [activeDragColumn, setActiveDragColumn] = useState<TaskStatus | null>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, status: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (activeDragColumn !== status) {
      setActiveDragColumn(status);
    }
  };

  const handleDragLeave = () => {
    setActiveDragColumn(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetStatus: TaskStatus) => {
    e.preventDefault();
    setActiveDragColumn(null);
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      onTaskDrop(taskId, targetStatus);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
      {TASK_COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.status);
        const isHovered = activeDragColumn === col.status;

        return (
          <div
            key={col.status}
            onDragOver={(e) => handleDragOver(e, col.status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.status)}
            className={cn(
              'rounded-2xl p-3.5 border transition-all duration-200 min-h-[420px] flex flex-col',
              isHovered
                ? 'bg-zinc-200/80 dark:bg-zinc-800/80 border-primary/60 scale-[1.01]'
                : 'bg-zinc-100/60 dark:bg-zinc-900/40 border-zinc-200/80 dark:border-zinc-800/80'
            )}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                  {col.label}
                </h3>
                <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 bg-zinc-200/70 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                  {colTasks.length}
                </span>
              </div>
              <button
                onClick={() => onAddTask(col.status)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 rounded-md transition"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Task Card Stack */}
            <div className="space-y-3 flex-1">
              {colTasks.map((task) => (
                <TaskBoardCard
                  key={task.id}
                  task={task}
                  onClick={() => onSelectTask(task)}
                  visibleFields={visibleFields}
                />
              ))}

              {/* Add Task Button */}
              <button
                onClick={() => onAddTask(col.status)}
                className="w-full py-2 flex items-center justify-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600 rounded-xl transition bg-white/40 dark:bg-zinc-900/30"
              >
                <Plus className="w-3.5 h-3.5" /> Add Task
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
