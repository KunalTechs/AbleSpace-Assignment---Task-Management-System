'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, User, Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api-client';
import { Project } from '@/types/project.types';
import { Task } from '@/types/task.types';
import { PriorityBadge } from '@/components/tasks/priority-badge';
import { CreateTaskModal } from '@/components/tasks/create-task-modal';
import { formatDate } from '@/lib/utils';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/projects/${projectId}`);
      setProject(res.data);
      setTasks(res.data.tasks || []);
    } catch (err) {
      console.error('Failed to load project:', err);
      setProject(null);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskCreated = (newTask: Task) => {
    setTasks((prev) => [newTask, ...prev]);
  };

  const handleDeleteProject = async () => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await api.delete(`/projects/${projectId}`);
      router.push('/projects');
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-xs text-zinc-400">
        Loading project details...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-12 text-center space-y-4 max-w-md mx-auto">
        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Project Not Found</p>
        <p className="text-xs text-zinc-500">
          The requested project ID does not exist or has an invalid format.
        </p>
        <button
          onClick={() => router.push('/projects')}
          className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold rounded-lg hover:opacity-90 transition"
        >
          Return to Projects
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 md:p-12 max-w-6xl mx-auto space-y-8 min-h-screen">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/projects')}
          className="inline-flex items-center gap-2 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to projects
        </button>

        <button
          onClick={handleDeleteProject}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/60 rounded-lg transition"
        >
          <Trash2 className="w-3.5 h-3.5" /> Delete Project
        </button>
      </div>

      {/* Project Overview Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{project.title}</h1>
            <PriorityBadge priority={project.priority} />
          </div>
          <p className="text-xs text-zinc-500">Workspace Project Details & Scope</p>
        </div>

        <div className="flex items-center gap-6 text-xs text-zinc-600 dark:text-zinc-400">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            <span>Lead: <strong className="text-zinc-800 dark:text-zinc-200">{project.leadName || 'Dexter'}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>Due: <strong className="text-zinc-800 dark:text-zinc-200">{formatDate(project.dueDate)}</strong></span>
          </div>
        </div>
      </div>

      {/* Associated Tasks Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
            Project Tasks ({tasks.length})
          </h2>
          <button
            onClick={() => setIsTaskModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold rounded-lg hover:opacity-90 transition shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Add Task to Project
          </button>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/70 dark:bg-zinc-800/40 border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-medium">
              <tr>
                <th className="py-3 px-4 font-normal">Task</th>
                <th className="py-3 px-4 font-normal">Status</th>
                <th className="py-3 px-4 font-normal">Priority</th>
                <th className="py-3 px-4 font-normal">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-zinc-400">
                    No tasks added to this project yet. Click &quot;Add Task to Project&quot; above to create one.
                  </td>
                </tr>
              ) : (
                tasks.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => router.push(`/tasks/${t.id}`)}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer transition"
                  >
                    <td className="py-3.5 px-4 font-medium text-zinc-800 dark:text-zinc-200">{t.title}</td>
                    <td className="py-3.5 px-4 text-zinc-500 font-medium">{t.status}</td>
                    <td className="py-3.5 px-4"><PriorityBadge priority={t.priority} /></td>
                    <td className="py-3.5 px-4 text-zinc-500">{formatDate(t.dueDate)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Task Creation Modal Attached Directly to this Project */}
      <CreateTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onTaskCreated={handleTaskCreated}
        defaultStatus="TODO"
        projectId={projectId}
      />
    </div>
  );
}