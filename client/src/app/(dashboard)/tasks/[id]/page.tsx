'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Calendar as CalendarIcon, 
  Plus, 
  Paperclip, 
  Send, 
  MoreHorizontal, 
  Check, 
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Share2,
  Copy,
  Link as LinkIcon,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  UserPlus,
  Users,
  CopyCheck,
  Globe
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Popover from '@radix-ui/react-popover';
import { api } from '@/lib/api-client';
import { Task, Priority, TaskStatus } from '@/types/task.types';
import { PRIORITY_CONFIG } from '@/lib/constants';
import { PrioritySignalIcon } from '@/components/tasks/priority-badge';
import { CommentsSection } from '@/components/tasks/comments-section';
import { TaskChatbox } from '@/components/tasks/task-chatbox';
import { cn, formatDate } from '@/lib/utils';

interface WorkspaceUser {
  id: string;
  email: string;
  fullName: string;
  title?: string;
  avatarUrl?: string;
}

const allLabels = ['Research', 'Design', 'Development', 'Testing', 'Deployment'];
const priorityList: Priority[] = ['NO_PRIORITY', 'URGENT', 'HIGH', 'MEDIUM', 'LOW'];
const statusList: { label: string; value: TaskStatus }[] = [
  { label: 'Backlog', value: 'TODO' },
  { label: 'To Do', value: 'TODO' },
  { label: 'Doing', value: 'DOING' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'On Hold', value: 'ON_HOLD' },
];

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params?.id as string;

  const [task, setTask] = useState<Task | null>(null);
  const [workspaceUsers, setWorkspaceUsers] = useState<WorkspaceUser[]>([]);
  const [allProjects, setAllProjects] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Copy & Duplicate states
  const [copiedLink, setCopiedLink] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Inline inputs
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [role, setRole] = useState('');
  const [newComment, setNewComment] = useState('');

  // Subtask inputs
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [subtaskPriority, setSubtaskPriority] = useState<Priority>('MEDIUM');
  const [subtaskDate, setSubtaskDate] = useState('');

  // Resources
  const [isAddingResource, setIsAddingResource] = useState(false);
  const [resourceName, setResourceName] = useState('');
  const [resources, setResources] = useState<string[]>([]);

  // Interactive Calendar State
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      showToast('Task link copied to clipboard!');
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleDuplicateTask = async () => {
    if (!task) return;
    try {
      setIsDuplicating(true);
      const res = await api.post(`/tasks/${task.id}/duplicate`);
      showToast(`Task duplicated successfully as "${res.data.title}"!`);
      router.push(`/tasks/${res.data.id}`);
    } catch (err) {
      console.error('Failed to duplicate task:', err);
      showToast('Failed to duplicate task.');
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!task) return;
    try {
      setIsDeleting(true);
      await api.delete(`/tasks/${task.id}`);
      showToast('Task deleted successfully!');
      setTimeout(() => {
        router.push('/tasks');
      }, 500);
    } catch (err) {
      console.error('Failed to delete task:', err);
      showToast('Failed to delete task.');
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (taskId) {
      fetchTask();
      fetchUsers();
      fetchProjects();
    }
  }, [taskId]);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setAllProjects(res.data || []);
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  };

  const fetchTask = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/tasks/${taskId}`);
      setTask(res.data);
      setTitle(res.data.title || '');
      setDescription(res.data.description || '');
      setRole(res.data.role || 'Admin');
      if (res.data.dueDate) {
        setCalendarMonth(new Date(res.data.dueDate));
      }
    } catch (err) {
      console.error('Failed to load task:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setWorkspaceUsers(res.data || []);
    } catch {
      // Fallback default workspace users
      setWorkspaceUsers([
        { id: '1', fullName: 'Dexter', email: 'dexter@gmail.com', title: 'Designer' },
        { id: '2', fullName: 'Ankit Dutta', email: 'ankit@gmail.com', title: 'Developer' },
        { id: '3', fullName: 'Sarah Connor', email: 'sarah@gmail.com', title: 'Product Lead' },
      ]);
    }
  };

  const currentUserProfile = React.useMemo(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user_profile');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {}
      }
    }
    return null;
  }, []);

  const isMemberOrCreator = React.useMemo(() => {
    if (!task) return true;
    if (!currentUserProfile) return true;

    const currentEmail = (currentUserProfile.email || '').toLowerCase().trim();
    const currentName = (currentUserProfile.fullName || '').toLowerCase().trim();
    const currentId = currentUserProfile.id;

    const reporter = (task.reporter || '').toLowerCase().trim();
    if (reporter && (reporter === currentName || reporter === currentEmail)) {
      return true;
    }

    if (task.assignees && Array.isArray(task.assignees)) {
      const isAssigned = task.assignees.some((a: any) => {
        if (a.id && currentId && a.id === currentId) return true;
        if (a.email && a.email.toLowerCase().trim() === currentEmail) return true;
        if (a.fullName && a.fullName.toLowerCase().trim() === currentName) return true;
        return false;
      });
      if (isAssigned) return true;
    }

    if ((task as any).userIds && Array.isArray((task as any).userIds)) {
      if (currentId && (task as any).userIds.includes(currentId)) return true;
    }

    return false;
  }, [task, currentUserProfile]);

  const updateTask = async (payload: Record<string, any>) => {
    if (!task) return;
    if (!isMemberOrCreator) {
      showToast('🔒 Read-Only Mode: Only added task members can modify this task.');
      return;
    }
    try {
      const res = await api.patch(`/tasks/${task.id}`, payload);
      setTask(res.data);
    } catch (err: any) {
      console.error('Failed to update task:', err);
      showToast(err.response?.data?.message || 'Failed to update task.');
    }
  };

  // Toggle member assignment to task (persists in MongoDB `userIds` & `assignees`)
  const toggleAssignee = async (user: WorkspaceUser) => {
    if (!task) return;
    const currentAssigneeIds = task.assignees ? task.assignees.map((a: any) => a.id) : (task as any).userIds || [];
    const isAssigned = currentAssigneeIds.includes(user.id);
    const updatedIds = isAssigned
      ? currentAssigneeIds.filter((id: string) => id !== user.id)
      : [...currentAssigneeIds, user.id];

    await updateTask({ userIds: updatedIds });
  };

  // Toggle label
  const toggleLabel = async (lbl: string) => {
    if (!task) return;
    const current = task.labels || [];
    const updatedLabels = current.includes(lbl)
      ? current.filter((l) => l !== lbl)
      : [...current, lbl];
    await updateTask({ labels: updatedLabels });
  };

  // Subtasks
  const handleCreateSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !subtaskTitle.trim()) return;

    try {
      const res = await api.post(`/tasks/${task.id}/subtasks`, {
        title: subtaskTitle,
        priority: subtaskPriority,
        dueDate: subtaskDate ? new Date(subtaskDate).toISOString() : new Date(Date.now() + 86400000 * 3).toISOString(),
      });
      setTask({
        ...task,
        subtasks: [...(task.subtasks || []), res.data],
      });
      setSubtaskTitle('');
      setIsAddingSubtask(false);
    } catch (err) {
      console.error('Failed to add subtask:', err);
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    if (!task) return;
    try {
      await api.delete(`/tasks/${task.id}/subtasks/${subtaskId}`);
      setTask({
        ...task,
        subtasks: task.subtasks?.filter((s) => s.id !== subtaskId) || [],
      });
    } catch (err) {
      console.error('Failed to delete subtask:', err);
    }
  };

  // Comments / Chat messages
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !newComment.trim()) return;

    let author = 'Dexter';
    const userProfileStr = localStorage.getItem('user_profile');
    if (userProfileStr) {
      try {
        const u = JSON.parse(userProfileStr);
        author = u.fullName || u.email || 'Dexter';
      } catch (e) {}
    }

    try {
      const res = await api.post(`/tasks/${task.id}/comments`, {
        content: newComment,
        author,
      });
      setTask({
        ...task,
        comments: [...(task.comments || []), res.data],
      });
      setNewComment('');
    } catch (err) {
      console.error('Failed to post comment:', err);
    }
  };

  // Calendar Day Generation Helper
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handleSelectDay = (day: number) => {
    const newDate = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day, 12, 0, 0);
    updateTask({ dueDate: newDate.toISOString() });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-xs text-zinc-400">
        Loading task...
      </div>
    );
  }

  if (!task) {
    return (
      <div className="p-12 text-center space-y-4">
        <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Task Not Found</p>
        <button onClick={() => router.push('/tasks')} className="text-xs text-primary font-medium hover:underline">
          Return to Tasks
        </button>
      </div>
    );
  }

  const assignedUsers = task.assignees && task.assignees.length > 0 
    ? task.assignees 
    : workspaceUsers.filter((u) => (task as any).userIds?.includes(u.id));

  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col md:flex-row">
      {/* Left Main Content */}
      <div className="flex-1 p-8 md:p-12 overflow-y-auto border-r border-zinc-200/80 dark:border-zinc-800 space-y-7">
        
        {/* Read-Only Notice Banner for Non-Members */}
        {!isMemberOrCreator && (
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between font-medium shadow-xs">
            <div className="flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                <strong>Read-Only Mode:</strong> You are viewing this task as a non-member. Only the task creator ({task.reporter || 'Creator'}) or added task members can edit details or make changes.
              </span>
            </div>
          </div>
        )}

        {/* Navigation & Header Actions */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <button
            onClick={() => router.push('/tasks')}
            className="inline-flex items-center gap-2 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to tasks
          </button>

          <div className="flex items-center gap-2">
            {toastMessage && (
              <span className="text-xs bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-3 py-1 rounded-full shadow-md animate-in fade-in transition font-medium">
                {toastMessage}
              </span>
            )}

            <div className="flex items-center gap-1.5 text-zinc-400 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1 rounded-lg">
              {/* 1. Lock / Unlock Toggle */}
              <button
                onClick={() => {
                  const newLockedState = !task.isLocked;
                  updateTask({ isLocked: newLockedState });
                  showToast(newLockedState ? 'Task locked (Read-only)' : 'Task unlocked');
                }}
                title={task.isLocked ? 'Task is locked (Click to unlock)' : 'Task is unlocked (Click to lock)'}
                className={cn(
                  'p-1.5 rounded transition',
                  task.isLocked 
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 font-semibold' 
                    : 'hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500'
                )}
              >
                {task.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              </button>

              {/* 2. Public / Private Toggle */}
              <button
                onClick={() => {
                  const newPublicState = !task.isPublic;
                  updateTask({ isPublic: newPublicState });
                  showToast(newPublicState ? 'Task is now Public' : 'Task is now Private');
                }}
                title={task.isPublic ? 'Public - Click to make private' : 'Private - Click to make public'}
                className={cn(
                  'p-1.5 rounded transition',
                  task.isPublic 
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 font-semibold' 
                    : 'hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500'
                )}
              >
                {task.isPublic ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>

              {/* 3. Share Popover */}
              <Popover.Root>
                <Popover.Trigger asChild>
                  <button 
                    title="Share task" 
                    className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 rounded transition outline-none"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </Popover.Trigger>
                <Popover.Portal>
                  <Popover.Content 
                    align="end" 
                    sideOffset={8}
                    className="w-72 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl p-3.5 z-50 text-xs space-y-3 animate-in fade-in-50"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800 font-semibold text-zinc-800 dark:text-zinc-200">
                      <span>Share Task</span>
                      <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', task.isPublic ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400')}>
                        {task.isPublic ? 'Public Link Active' : 'Private'}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-[11px] text-zinc-500 font-medium">Task Link</p>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          readOnly
                          value={typeof window !== 'undefined' ? window.location.href : ''}
                          className="flex-1 px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 text-[11px] outline-none truncate"
                        />
                        <button
                          onClick={handleCopyLink}
                          className="px-2.5 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:opacity-90 transition shrink-0 flex items-center gap-1"
                        >
                          {copiedLink ? <CopyCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedLink ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-zinc-800 dark:text-zinc-200 text-[11px]">Public Access</p>
                        <p className="text-[10px] text-zinc-400">Anyone with link can view</p>
                      </div>
                      <button
                        onClick={() => {
                          const updated = !task.isPublic;
                          updateTask({ isPublic: updated });
                          showToast(updated ? 'Public access enabled' : 'Public access disabled');
                        }}
                        className={cn(
                          'w-9 h-5 rounded-full transition p-0.5 flex items-center',
                          task.isPublic ? 'bg-emerald-500 justify-end' : 'bg-zinc-300 dark:bg-zinc-700 justify-start'
                        )}
                      >
                        <span className="w-4 h-4 rounded-full bg-white shadow-sm" />
                      </button>
                    </div>
                  </Popover.Content>
                </Popover.Portal>
              </Popover.Root>

              {/* 4. Copy & Duplicate Menu */}
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button 
                    title="Copy / Duplicate options" 
                    className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 rounded transition outline-none"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content align="end" sideOffset={8} className="w-44 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl p-1 z-50 text-xs space-y-0.5 animate-in fade-in-50">
                    <DropdownMenu.Item
                      onClick={handleCopyLink}
                      className="px-2.5 py-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer outline-none text-zinc-700 dark:text-zinc-300 flex items-center gap-2"
                    >
                      <LinkIcon className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Copy Task Link</span>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      onClick={handleDuplicateTask}
                      disabled={isDuplicating}
                      className="px-2.5 py-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer outline-none text-zinc-700 dark:text-zinc-300 flex items-center gap-2"
                    >
                      <Copy className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{isDuplicating ? 'Duplicating...' : 'Duplicate Task'}</span>
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>

              {/* 5. Delete Task Button */}
              <button
                onClick={() => setShowDeleteConfirm(true)}
                title="Delete task"
                className="p-1.5 hover:bg-red-100 dark:hover:bg-red-950/60 text-zinc-500 hover:text-red-600 dark:hover:text-red-400 rounded transition outline-none"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal Overlay */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in-50">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-2xl max-w-sm w-full space-y-4">
              <div className="space-y-1.5 text-center">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
                  <Trash2 className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Delete Task</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Are you sure you want to delete <span className="font-semibold text-zinc-700 dark:text-zinc-300">"{task.title}"</span>? This action cannot be undone.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteTask}
                  disabled={isDeleting}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Task'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lock Banner */}
        {task.isLocked && (
          <div className="flex items-center justify-between px-4 py-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 rounded-xl text-xs font-medium shadow-sm">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>This task is locked. Unlock it to make changes.</span>
            </div>
            <button
              onClick={() => {
                updateTask({ isLocked: false });
                showToast('Task unlocked');
              }}
              className="text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:underline"
            >
              Unlock Now
            </button>
          </div>
        )}

        {/* Editable Title */}
        <div>
          <input
            type="text"
            value={title}
            disabled={task.isLocked}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => !task.isLocked && updateTask({ title })}
            placeholder="Task Title..."
            className={cn(
              "w-full text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 bg-transparent outline-none border-b border-transparent hover:border-zinc-200 focus:border-primary transition py-1",
              task.isLocked && "opacity-70 cursor-not-allowed hover:border-transparent"
            )}
          />
        </div>

        {/* Editable Description */}
        <div>
          <textarea
            value={description}
            disabled={task.isLocked}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => !task.isLocked && updateTask({ description })}
            placeholder="Add description..."
            rows={2}
            className={cn(
              "w-full text-xs text-zinc-600 dark:text-zinc-400 bg-transparent outline-none border-b border-transparent hover:border-zinc-200 focus:border-primary transition resize-none leading-relaxed",
              task.isLocked && "opacity-70 cursor-not-allowed hover:border-transparent"
            )}
          />
        </div>

        {/* Properties Metadata */}
        <div className="flex items-center gap-8 text-xs border-y border-zinc-100 dark:border-zinc-800 py-3.5">
          <span className="text-zinc-400 font-medium w-20 shrink-0">Properties</span>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              <span className="text-primary font-bold">{role ? role[0] : 'A'}</span> {role}
            </span>

            {task.project && (
              <button
                onClick={() => router.push(`/projects/${task.project!.id}`)}
                className="flex items-center gap-1.5 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 px-2.5 py-1 rounded text-xs font-semibold hover:underline"
              >
                <span>📁</span> {task.project.title}
              </button>
            )}

            {task.dueDate && (
              <span className="flex items-center gap-1.5 bg-red-50 dark:bg-red-950/40 text-red-600 px-2.5 py-1 rounded text-xs font-medium">
                <CalendarIcon className="w-3.5 h-3.5" />
                {formatDate(task.dueDate)}
              </span>
            )}
          </div>
        </div>

        {/* Labels Manager */}
        <div className="flex items-center gap-8 text-xs border-b border-zinc-100 dark:border-zinc-800 pb-3.5">
          <span className="text-zinc-400 font-medium w-20 shrink-0">Labels</span>
          <div className="flex items-center gap-2 flex-wrap">
            {allLabels.map((lbl) => {
              const active = task.labels?.includes(lbl);
              return (
                <button
                  key={lbl}
                  onClick={() => toggleLabel(lbl)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border transition',
                    active
                      ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100'
                      : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400'
                  )}
                >
                  <span className={cn('w-1.5 h-1.5 rounded-full', active ? 'bg-white dark:bg-zinc-900' : 'bg-zinc-400')} />
                  {lbl}
                </button>
              );
            })}
          </div>
        </div>

        {/* Resources Section */}
        <div className="flex items-center gap-8 text-xs border-b border-zinc-100 dark:border-zinc-800 pb-3.5">
          <span className="text-zinc-400 font-medium w-20 shrink-0">Resources</span>
          <div className="flex items-center gap-3 flex-wrap">
            {resources.map((res, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-xs text-primary">
                <LinkIcon className="w-3 h-3" /> {res}
              </span>
            ))}
            {isAddingResource ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={resourceName}
                  onChange={(e) => setResourceName(e.target.value)}
                  placeholder="https://... or doc name"
                  className="px-2.5 py-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-xs outline-none focus:ring-1 focus:ring-primary"
                  autoFocus
                />
                <button
                  onClick={() => {
                    if (resourceName.trim()) {
                      setResources([...resources, resourceName.trim()]);
                      setResourceName('');
                      setIsAddingResource(false);
                    }
                  }}
                  className="px-2 py-1 bg-primary text-white rounded text-xs font-medium"
                >
                  Add
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAddingResource(true)}
                className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition"
              >
                <LinkIcon className="w-3.5 h-3.5" /> Add document or link...
              </button>
            )}
          </div>
        </div>

        {/* Subtasks Section */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ChevronDown className="w-4 h-4 text-zinc-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                Subtasks ({task.subtasks?.length || 0})
              </h3>
            </div>
          </div>

          <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50/70 dark:bg-zinc-800/40 border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-medium">
                <tr>
                  <th className="py-3 px-4 font-normal">Task</th>
                  <th className="py-3 px-4 font-normal">Priority</th>
                  <th className="py-3 px-4 font-normal">Members</th>
                  <th className="py-3 px-4 font-normal">Due Date</th>
                  <th className="py-3 px-4 font-normal text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {task.subtasks?.map((sub) => (
                  <tr key={sub.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition">
                    <td className="py-3 px-4 font-medium text-zinc-800 dark:text-zinc-200">{sub.title}</td>
                    <td className="py-3 px-4">
                      <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded font-medium text-[11px]', PRIORITY_CONFIG[sub.priority]?.bg, PRIORITY_CONFIG[sub.priority]?.text)}>
                        <span className={cn('w-1.5 h-1.5 rounded-full', PRIORITY_CONFIG[sub.priority]?.dot)} />
                        {sub.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px]">
                        CN
                      </div>
                    </td>
                    <td className="py-3 px-4 text-zinc-500">{formatDate(sub.dueDate)}</td>
                    <td className="py-3 px-4 text-right">
                      <button onClick={() => handleDeleteSubtask(sub.id)} className="text-zinc-400 hover:text-red-500 transition">
                        <Trash2 className="w-3.5 h-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {isAddingSubtask ? (
            <form onSubmit={handleCreateSubtask} className="p-3 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 rounded-xl space-y-3">
              <input
                type="text"
                value={subtaskTitle}
                onChange={(e) => setSubtaskTitle(e.target.value)}
                placeholder="Subtask title..."
                className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <select
                    value={subtaskPriority}
                    onChange={(e) => setSubtaskPriority(e.target.value as Priority)}
                    className="px-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded text-xs outline-none"
                  >
                    {priorityList.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={subtaskDate}
                    onChange={(e) => setSubtaskDate(e.target.value)}
                    className="px-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded text-xs outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setIsAddingSubtask(false)} className="px-3 py-1 bg-zinc-200 dark:bg-zinc-700 text-xs rounded-lg">
                    Cancel
                  </button>
                  <button type="submit" className="px-3 py-1 bg-primary text-white text-xs rounded-lg font-medium">
                    Add
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsAddingSubtask(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition"
            >
              <Plus className="w-3.5 h-3.5" /> Add Subtasks
            </button>
          )}
        </div>

        {/* 1. Task Team Chatbox (For direct communication between task members) */}
        <TaskChatbox
          taskId={task.id}
          comments={task.comments}
          assignedUsers={assignedUsers}
          onCommentsUpdated={(updatedComments) => setTask({ ...task, comments: updatedComments })}
          isLocked={task.isLocked}
        />

        {/* 2. Task Comments Section (For general task feedback & discussion) */}
        <CommentsSection
          taskId={task.id}
          comments={task.comments}
          onCommentsUpdated={(updatedComments) => setTask({ ...task, comments: updatedComments })}
          isLocked={task.isLocked}
        />
      </div>

      {/* Right Sidebar: Dynamic Details Box & Live Activity */}
      <aside className="w-full md:w-96 p-8 bg-zinc-50/50 dark:bg-zinc-900/20 space-y-6 shrink-0">
        
        {/* Main Details Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">Details</span>
            <Plus className="w-3.5 h-3.5 text-zinc-400" />
          </div>

          {/* 1. Status Dropdown */}
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Status</span>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="font-medium text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded text-[11px] outline-none flex items-center gap-1 hover:bg-amber-100 transition">
                  <span>● {task.status === 'TODO' ? 'Backlog' : task.status}</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content align="end" className="w-36 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl p-1 z-50 text-xs space-y-0.5 animate-in fade-in-50">
                  {statusList.map((st) => (
                    <DropdownMenu.Item
                      key={st.label}
                      onClick={() => updateTask({ status: st.value })}
                      className="px-2.5 py-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer outline-none text-zinc-700 dark:text-zinc-300 flex items-center justify-between"
                    >
                      <span>{st.label}</span>
                      {task.status === st.value && <Check className="w-3.5 h-3.5 text-primary" />}
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>

          {/* 2. Priority Dropdown */}
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Priority</span>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-medium text-[11px] outline-none hover:opacity-90 transition', PRIORITY_CONFIG[task.priority]?.bg, PRIORITY_CONFIG[task.priority]?.text)}>
                  <PrioritySignalIcon priority={task.priority} className="w-3.5 h-3.5" />
                  <span>{task.priority.replace('_', ' ')}</span>
                  <ChevronDown className="w-3 h-3 ml-1" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content align="end" className="w-44 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl p-1.5 z-50 text-xs space-y-0.5 animate-in fade-in-50">
                  {priorityList.map((p) => (
                    <DropdownMenu.Item
                      key={p}
                      onClick={() => updateTask({ priority: p })}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer outline-none"
                    >
                      <div className="flex items-center gap-2">
                        <PrioritySignalIcon priority={p} className="w-3.5 h-3.5" />
                        <span className={PRIORITY_CONFIG[p]?.text}>{p.replace('_', ' ')}</span>
                      </div>
                      {task.priority === p && <Check className="w-3.5 h-3.5 text-primary" />}
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>

          {/* 3. Members / Assignees Popover (Add/Remove members with full visibility access) */}
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Members</span>
            <Popover.Root>
              <Popover.Trigger asChild>
                <button className="flex items-center gap-1 outline-none group">
                  {assignedUsers && assignedUsers.length > 0 ? (
                    <div className="flex items-center -space-x-1.5">
                      {assignedUsers.map((u: any, idx: number) => (
                        <div
                          key={u.id || idx}
                          title={u.fullName || u.email}
                          className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center font-bold text-[10px] ring-2 ring-white dark:ring-zinc-900"
                        >
                          {u.fullName ? u.fullName[0].toUpperCase() : 'U'}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 text-xs">
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Add members</span>
                    </div>
                  )}
                </button>
              </Popover.Trigger>

              <Popover.Portal>
                <Popover.Content
                  align="end"
                  sideOffset={6}
                  className="w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl p-2 z-50 text-xs space-y-1.5 animate-in fade-in-50"
                >
                  <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                    Assign Workspace Members
                  </div>

                  <div className="space-y-0.5 max-h-48 overflow-y-auto">
                    {workspaceUsers.map((u) => {
                      const isAssigned = (assignedUsers || []).some((au: any) => au.id === u.id);
                      return (
                        <button
                          key={u.id}
                          onClick={() => toggleAssignee(u)}
                          className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition text-left"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-bold">
                              {u.fullName ? u.fullName[0].toUpperCase() : 'U'}
                            </div>
                            <div>
                              <p className="font-medium text-zinc-800 dark:text-zinc-200 text-xs">{u.fullName}</p>
                              <p className="text-[10px] text-zinc-400">{u.title || u.email}</p>
                            </div>
                          </div>
                          {isAssigned && <Check className="w-3.5 h-3.5 text-primary" />}
                        </button>
                      );
                    })}
                  </div>
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
          </div>

          {/* 4. Calendar Dates Popover (Exact Figma Design with month navigator) */}
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Dates</span>
            <Popover.Root>
              <Popover.Trigger asChild>
                <button className="font-medium text-zinc-700 dark:text-zinc-300 hover:text-primary transition outline-none">
                  {task.dueDate ? formatDate(task.dueDate) : 'Set Date'}
                </button>
              </Popover.Trigger>

              <Popover.Portal>
                <Popover.Content
                  align="end"
                  sideOffset={6}
                  className="w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-3.5 z-50 text-xs animate-in fade-in-50"
                >
                  {/* Calendar Month Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                    <button
                      onClick={() => setCalendarMonth(new Date(year, month - 1, 1))}
                      className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition"
                    >
                      <ChevronLeft className="w-3.5 h-3.5 text-zinc-500" />
                    </button>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs">
                      {monthNames[month]} {year}
                    </span>
                    <button
                      onClick={() => setCalendarMonth(new Date(year, month + 1, 1))}
                      className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition"
                    >
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                    </button>
                  </div>

                  {/* Day of Week Labels */}
                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-zinc-400 font-medium pt-2 pb-1">
                    <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1 text-center text-xs">
                    {Array.from({ length: firstDay }).map((_, i) => (
                      <div key={`empty-${i}`} className="w-7 h-7" />
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const d = i + 1;
                      const isSelected = task.dueDate && new Date(task.dueDate).getDate() === d && new Date(task.dueDate).getMonth() === month && new Date(task.dueDate).getFullYear() === year;

                      return (
                        <button
                          key={d}
                          onClick={() => handleSelectDay(d)}
                          className={cn(
                            'w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-medium transition',
                            isSelected
                              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold'
                              : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                          )}
                        >
                          {d}
                        </button>
                      );
                    })}
                  </div>
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
          </div>

          {/* 5. Reporter Selector */}
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Reporter</span>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="font-medium text-zinc-700 dark:text-zinc-300 hover:text-primary transition outline-none">
                  {task.reporter || 'Dexter'}
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content align="end" className="w-36 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl p-1 z-50 text-xs space-y-0.5">
                  {['Dexter', 'Ankit', 'Admin'].map((rep) => (
                    <DropdownMenu.Item
                      key={rep}
                      onClick={() => updateTask({ reporter: rep })}
                      className="px-2.5 py-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer outline-none text-zinc-700 dark:text-zinc-300 flex items-center justify-between"
                    >
                      <span>{rep}</span>
                      {(task.reporter || 'Dexter') === rep && <Check className="w-3.5 h-3.5 text-primary" />}
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>

          {/* 6. Project Selector */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <span className="text-zinc-400">Project</span>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="font-medium text-purple-600 dark:text-purple-400 hover:underline transition outline-none flex items-center gap-1">
                  <span>📁 {task.project ? task.project.title : 'No Project'}</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content align="end" className="w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl p-1 z-50 text-xs space-y-0.5 animate-in fade-in-50">
                  <DropdownMenu.Item
                    onClick={() => updateTask({ projectId: null })}
                    className="px-2.5 py-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer outline-none text-zinc-700 dark:text-zinc-300 flex items-center justify-between"
                  >
                    <span>No Project</span>
                    {!task.project && <Check className="w-3.5 h-3.5 text-primary" />}
                  </DropdownMenu.Item>
                  {allProjects.map((p) => (
                    <DropdownMenu.Item
                      key={p.id}
                      onClick={() => updateTask({ projectId: p.id })}
                      className="px-2.5 py-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer outline-none text-zinc-700 dark:text-zinc-300 flex items-center justify-between"
                    >
                      <span className="truncate">📁 {p.title}</span>
                      {task.project?.id === p.id && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </div>

        {/* Live Updates Feed */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-3.5 text-xs">
          <span className="font-semibold text-zinc-800 dark:text-zinc-200 block">Updates</span>
          <div className="space-y-3.5">
            {task.updates && task.updates.length > 0 ? (
              task.updates.map((upd) => (
                <div key={upd.id} className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center text-[9px] font-bold">
                      {upd.author[0]}
                    </div>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{upd.author}</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 pl-5.5">{upd.action}</p>
                </div>
              ))
            ) : (
              <div className="space-y-1">
                <p className="font-semibold text-zinc-800 dark:text-zinc-200">You</p>
                <p className="text-[11px] text-zinc-500">created this task</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}