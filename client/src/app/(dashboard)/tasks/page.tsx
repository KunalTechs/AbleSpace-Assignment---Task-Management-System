'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { TaskBoardView } from '@/components/tasks/task-board-view';
import { TaskListView } from '@/components/tasks/task-list-view';
import { CreateTaskModal } from '@/components/tasks/create-task-modal';
import { 
  FieldsDropdown, 
  FilterDropdown, 
  VisibleFields, 
  TaskFilters 
} from '@/components/tasks/fields-filter';
import { useDebounce } from '@/hooks/use-debounce';
import { api } from '@/lib/api-client';
import { Task, TaskStatus } from '@/types/task.types';

export default function TasksPage() {
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Field toggles
  const [visibleFields, setVisibleFields] = useState<VisibleFields>({
    priority: true,
    role: true,
    dueDate: true,
    labels: true,
  });

  // Filter criteria
  const [filters, setFilters] = useState<TaskFilters>({
    priority: 'ALL',
    status: 'ALL',
    role: 'ALL',
    dueDateRange: 'ALL',
    team: 'ALL',
    label: 'ALL',
    reporter: 'ALL',
  });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createDefaultStatus, setCreateDefaultStatus] = useState<TaskStatus>('TODO');

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    fetchTasks();
  }, [debouncedSearch]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/tasks${debouncedSearch ? `?search=${encodeURIComponent(debouncedSearch)}` : ''}`);
      setTasks(res.data);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const availableRoles = useMemo(() => {
    const roles = new Set<string>();
    tasks.forEach((t) => {
      if (t.role) roles.add(t.role);
    });
    return Array.from(roles);
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (filters.priority !== 'ALL' && t.priority !== filters.priority) return false;
      if (filters.status !== 'ALL' && t.status !== filters.status) return false;
      if (filters.role !== 'ALL' && t.role !== filters.role) return false;
      if (filters.label !== 'ALL' && (!t.labels || !t.labels.includes(filters.label))) return false;

      if (filters.dueDateRange !== 'ALL') {
        if (!t.dueDate) return false;
        const due = new Date(t.dueDate).getTime();
        const startOfDay = new Date().setHours(0, 0, 0, 0);
        const endOfDay = new Date().setHours(23, 59, 59, 999);
        const oneWeekOut = Date.now() + 7 * 86400000;

        if (filters.dueDateRange === 'OVERDUE' && due >= startOfDay) return false;
        if (filters.dueDateRange === 'TODAY' && (due < startOfDay || due > endOfDay)) return false;
        if (filters.dueDateRange === 'THIS_WEEK' && (due < startOfDay || due > oneWeekOut)) return false;
      }

      return true;
    });
  }, [tasks, filters]);

  // Drag and drop task stage handler
  const handleTaskDrop = async (taskId: string, targetStatus: TaskStatus) => {
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask || targetTask.status === targetStatus) return;

    // Optimistic UI state update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: targetStatus } : t))
    );

    // Persist status change to MongoDB backend
    try {
      await api.patch(`/tasks/${taskId}`, { status: targetStatus });
    } catch (err) {
      console.error('Failed to update task status:', err);
      // Revert on failure
      fetchTasks();
    }
  };

  const handleOpenCreateModal = (status: TaskStatus = 'TODO') => {
    setCreateDefaultStatus(status);
    setIsCreateModalOpen(true);
  };

  const handleSelectTask = (task: Task) => {
    router.push(`/tasks/${task.id}`);
  };

  const handleTaskCreated = (newTask: Task) => {
    setTasks((prev) => [newTask, ...prev]);
  };

  const handleResetFilters = () => {
    setFilters({
      priority: 'ALL',
      status: 'ALL',
      role: 'ALL',
      dueDateRange: 'ALL',
      team: 'ALL',
      label: 'ALL',
      reporter: 'ALL',
    });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen">
      <Header
        title="Tasks"
        search={search}
        onSearchChange={setSearch}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onAddTaskClick={() => handleOpenCreateModal('TODO')}
        fieldsAction={
          <FieldsDropdown
            visibleFields={visibleFields}
            onVisibleFieldsChange={setVisibleFields}
          />
        }
        filterAction={
          <FilterDropdown
            filters={filters}
            onFiltersChange={setFilters}
            availableRoles={availableRoles}
          />
        }
      />

      <div className="mt-6">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-xs text-zinc-400">
            Loading tasks...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white/50 dark:bg-zinc-900/50">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">No matching tasks found</p>
            <p className="text-xs text-zinc-400 mb-4">Try clearing filters or search terms.</p>
            <button
              onClick={handleResetFilters}
              className="px-3.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
            >
              Reset Filters
            </button>
          </div>
        ) : viewMode === 'board' ? (
          <TaskBoardView
            tasks={filteredTasks}
            onSelectTask={handleSelectTask}
            onAddTask={handleOpenCreateModal}
            onTaskDrop={handleTaskDrop}
            visibleFields={visibleFields}
          />
        ) : (
          <TaskListView
            tasks={filteredTasks}
            onSelectTask={handleSelectTask}
            visibleFields={visibleFields}
            onTaskActionCompleted={fetchTasks}
          />
        )}
      </div>

      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        defaultStatus={createDefaultStatus}
        onTaskCreated={handleTaskCreated}
      />
    </div>
  );
}
