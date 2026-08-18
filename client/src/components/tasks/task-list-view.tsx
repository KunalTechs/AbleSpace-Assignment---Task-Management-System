import React from 'react';
import { Task } from '@/types/task.types';
import { TASK_COLUMNS } from '@/lib/constants';
import { PriorityBadge } from './priority-badge';
import { formatDate } from '@/lib/utils';
import { VisibleFields } from './fields-filter';
import { ChevronDown, MoreHorizontal, Eye, Copy, Link as LinkIcon, Trash2 } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { api } from '@/lib/api-client';

interface TaskListViewProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  visibleFields: VisibleFields;
  onTaskActionCompleted?: () => void;
}

export function TaskListView({ tasks, onSelectTask, visibleFields, onTaskActionCompleted }: TaskListViewProps) {
  const handleCopyLink = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(`${window.location.origin}/tasks/${taskId}`);
      alert('Task link copied to clipboard!');
    }
  };

  const handleDuplicateTask = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.post(`/tasks/${taskId}/duplicate`);
      if (onTaskActionCompleted) onTaskActionCompleted();
    } catch (err) {
      console.error('Failed to duplicate task:', err);
    }
  };

  const handleDeleteTask = async (taskId: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete task "${title}"?`)) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      if (onTaskActionCompleted) onTaskActionCompleted();
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  return (
    <div className="space-y-6">
      {TASK_COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.status);
        return (
          <div key={col.status} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-zinc-50/80 dark:bg-zinc-800/40 border-b border-zinc-200 dark:border-zinc-800">
              <ChevronDown className="w-4 h-4 text-zinc-400" />
              <span className="font-semibold text-xs text-zinc-800 dark:text-zinc-200">{col.label}</span>
              <span className="text-[11px] text-zinc-400 bg-zinc-200/60 dark:bg-zinc-700 px-1.5 py-0.2 rounded-full">
                {colTasks.length}
              </span>
            </div>

            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400">
                  <th className="py-2.5 px-4 font-normal">Task</th>
                  {visibleFields.priority && <th className="py-2.5 px-4 font-normal">Priority</th>}
                  {visibleFields.role && <th className="py-2.5 px-4 font-normal">Role</th>}
                  {visibleFields.dueDate && <th className="py-2.5 px-4 font-normal">Due Date</th>}
                  <th className="py-2.5 px-4 font-normal text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {colTasks.map((task) => (
                  <tr
                    key={task.id}
                    onClick={() => onSelectTask(task)}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition"
                  >
                    <td className="py-3 px-4 font-medium text-zinc-800 dark:text-zinc-200">
                      <div className="flex items-center gap-2">
                        <span>{task.title}</span>
                        {task.project && (
                          <span className="text-[10px] bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 px-1.5 py-0.2 rounded border border-purple-200/60 dark:border-purple-800/60 font-semibold">
                            📁 {task.project.title}
                          </span>
                        )}
                      </div>
                    </td>
                    {visibleFields.priority && (
                      <td className="py-3 px-4">
                        <PriorityBadge priority={task.priority} />
                      </td>
                    )}
                    {visibleFields.role && (
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{task.role || 'Admin'}</td>
                    )}
                    {visibleFields.dueDate && (
                      <td className="py-3 px-4 text-zinc-500">{formatDate(task.dueDate)}</td>
                    )}
                    <td className="py-3 px-4 text-right text-zinc-400">
                      <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded transition outline-none"
                          >
                            <MoreHorizontal className="w-4 h-4 inline" />
                          </button>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Portal>
                          <DropdownMenu.Content
                            align="end"
                            className="w-44 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl p-1 z-50 text-xs space-y-0.5"
                          >
                            <DropdownMenu.Item
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectTask(task);
                              }}
                              className="flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer outline-none text-zinc-700 dark:text-zinc-300"
                            >
                              <Eye className="w-3.5 h-3.5 text-zinc-400" />
                              <span>View Details</span>
                            </DropdownMenu.Item>

                            <DropdownMenu.Item
                              onClick={(e) => handleCopyLink(task.id, e as any)}
                              className="flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer outline-none text-zinc-700 dark:text-zinc-300"
                            >
                              <LinkIcon className="w-3.5 h-3.5 text-zinc-400" />
                              <span>Copy Link</span>
                            </DropdownMenu.Item>

                            <DropdownMenu.Item
                              onClick={(e) => handleDuplicateTask(task.id, e as any)}
                              className="flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer outline-none text-zinc-700 dark:text-zinc-300"
                            >
                              <Copy className="w-3.5 h-3.5 text-zinc-400" />
                              <span>Duplicate Task</span>
                            </DropdownMenu.Item>

                            <DropdownMenu.Item
                              onClick={(e) => handleDeleteTask(task.id, task.title, e as any)}
                              className="flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer outline-none text-red-600 dark:text-red-400 font-medium"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete Task</span>
                            </DropdownMenu.Item>
                          </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                      </DropdownMenu.Root>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
