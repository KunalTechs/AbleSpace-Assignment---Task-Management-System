'use client';

import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  Plus, 
  Paperclip, 
  Send, 
  MoreHorizontal, 
  Check, 
  ChevronDown,
  Share2,
  Copy,
  Trash2,
  User as UserIcon,
  Tag,
  Link as LinkIcon,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  CopyCheck
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Popover from '@radix-ui/react-popover';
import { Task, Priority, TaskStatus } from '@/types/task.types';
import { api } from '@/lib/api-client';
import { PRIORITY_CONFIG } from '@/lib/constants';
import { PrioritySignalIcon } from './priority-badge';
import { CommentsSection } from './comments-section';
import { cn, formatDate } from '@/lib/utils';

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated: (updated: Task) => void;
}

const priorityList: Priority[] = ['NO_PRIORITY', 'URGENT', 'HIGH', 'MEDIUM', 'LOW'];

export function TaskDetailModal({ task, isOpen, onClose, onTaskUpdated }: TaskDetailModalProps) {
  const [currentTask, setCurrentTask] = useState<Task | null>(task);
  const [newComment, setNewComment] = useState('');
  const [isPriorityOpen, setIsPriorityOpen] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  React.useEffect(() => {
    setCurrentTask(task);
  }, [task]);

  if (!isOpen || !currentTask) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleUpdateTask = async (payload: Partial<Task>) => {
    try {
      const res = await api.patch(`/tasks/${currentTask.id}`, payload);
      setCurrentTask(res.data);
      onTaskUpdated(res.data);
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  const handleDeleteTask = async () => {
    try {
      setIsDeleting(true);
      await api.delete(`/tasks/${currentTask.id}`);
      showToast('Task deleted successfully!');
      onTaskUpdated({ ...currentTask, _deleted: true } as any);
      onClose();
    } catch (err) {
      console.error('Failed to delete task:', err);
      showToast('Failed to delete task.');
      setIsDeleting(false);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      const link = `${window.location.origin}/tasks/${currentTask.id}`;
      navigator.clipboard.writeText(link);
      setCopiedLink(true);
      showToast('Task link copied to clipboard!');
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleDuplicateTask = async () => {
    try {
      setIsDuplicating(true);
      const res = await api.post(`/tasks/${currentTask.id}/duplicate`);
      showToast(`Task duplicated as "${res.data.title}"!`);
      onTaskUpdated(res.data);
    } catch (err) {
      console.error('Failed to duplicate task:', err);
    } finally {
      setIsDuplicating(false);
    }
  };

  const handlePriorityChange = async (newPriority: Priority) => {
    handleUpdateTask({ priority: newPriority });
    setIsPriorityOpen(false);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || currentTask.isLocked) return;

    try {
      const res = await api.post(`/tasks/${currentTask.id}/comments`, {
        content: newComment,
        author: 'Dexter',
      });
      const updated = {
        ...currentTask,
        comments: [res.data, ...(currentTask.comments || [])],
      };
      setCurrentTask(updated);
      onTaskUpdated(updated);
      setNewComment('');
    } catch (err) {
      console.error('Failed to add comment:', err);
      alert('Failed to add comment. Please make sure the backend server is running.');
    }
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || currentTask.isLocked) return;

    try {
      const res = await api.post(`/tasks/${currentTask.id}/subtasks`, {
        title: newSubtaskTitle,
        priority: 'MEDIUM',
        dueDate: new Date(Date.now() + 3 * 86400000).toISOString(),
      });
      const updated = {
        ...currentTask,
        subtasks: [...(currentTask.subtasks || []), res.data],
      };
      setCurrentTask(updated);
      onTaskUpdated(updated);
      setNewSubtaskTitle('');
      setIsAddingSubtask(false);
    } catch (err) {
      console.error('Failed to add subtask:', err);
      alert('Failed to add subtask. Please make sure the backend server is running.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[92vh] animate-in fade-in-50">
        
        {/* Left Side: Main Content */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto border-r border-zinc-200 dark:border-zinc-800 space-y-6">
          
          {/* Top Bar inside Drawer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-xs">◫</span>
              {toastMessage && (
                <span className="text-[11px] bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-2.5 py-0.5 rounded-full font-medium shadow-sm animate-in fade-in">
                  {toastMessage}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-zinc-400 text-xs bg-zinc-50 dark:bg-zinc-800/60 p-1 rounded-lg">
              {/* Lock / Unlock */}
              <button
                onClick={() => {
                  const updatedLocked = !currentTask.isLocked;
                  handleUpdateTask({ isLocked: updatedLocked });
                  showToast(updatedLocked ? 'Task locked' : 'Task unlocked');
                }}
                title={currentTask.isLocked ? 'Task is locked' : 'Task is unlocked'}
                className={cn(
                  'p-1.5 rounded transition',
                  currentTask.isLocked 
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 font-semibold' 
                    : 'hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500'
                )}
              >
                {currentTask.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              </button>

              {/* Public / Private */}
              <button
                onClick={() => {
                  const updatedPublic = !currentTask.isPublic;
                  handleUpdateTask({ isPublic: updatedPublic });
                  showToast(updatedPublic ? 'Task set to Public' : 'Task set to Private');
                }}
                title={currentTask.isPublic ? 'Public - Click to make private' : 'Private - Click to make public'}
                className={cn(
                  'p-1.5 rounded transition',
                  currentTask.isPublic 
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 font-semibold' 
                    : 'hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500'
                )}
              >
                {currentTask.isPublic ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>

              {/* Share Popover */}
              <Popover.Root>
                <Popover.Trigger asChild>
                  <button title="Share task" className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition outline-none">
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </Popover.Trigger>
                <Popover.Portal>
                  <Popover.Content align="end" sideOffset={8} className="w-72 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl p-3 z-50 text-xs space-y-3 animate-in fade-in-50">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800 font-semibold text-zinc-800 dark:text-zinc-200">
                      <span>Share Task</span>
                      <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', currentTask.isPublic ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400')}>
                        {currentTask.isPublic ? 'Public' : 'Private'}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] text-zinc-500 font-medium">Link</p>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          readOnly
                          value={typeof window !== 'undefined' ? `${window.location.origin}/tasks/${currentTask.id}` : ''}
                          className="flex-1 px-2 py-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-zinc-700 dark:text-zinc-300 text-[11px] outline-none truncate"
                        />
                        <button
                          onClick={handleCopyLink}
                          className="px-2.5 py-1 bg-primary text-white rounded text-xs font-medium shrink-0 flex items-center gap-1"
                        >
                          {copiedLink ? <CopyCheck className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {copiedLink ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                      <span className="font-medium text-zinc-700 dark:text-zinc-300 text-[11px]">Public Access</span>
                      <button
                        onClick={() => {
                          const updatedPublic = !currentTask.isPublic;
                          handleUpdateTask({ isPublic: updatedPublic });
                          showToast(updatedPublic ? 'Public access enabled' : 'Public access disabled');
                        }}
                        className={cn(
                          'w-8 h-4 rounded-full transition p-0.5 flex items-center',
                          currentTask.isPublic ? 'bg-emerald-500 justify-end' : 'bg-zinc-300 dark:bg-zinc-700 justify-start'
                        )}
                      >
                        <span className="w-3 h-3 rounded-full bg-white shadow-sm" />
                      </button>
                    </div>
                  </Popover.Content>
                </Popover.Portal>
              </Popover.Root>

              {/* Copy / Duplicate Menu */}
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button title="Copy options" className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition outline-none">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content align="end" sideOffset={8} className="w-44 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl p-1 z-50 text-xs space-y-0.5">
                    <DropdownMenu.Item onClick={handleCopyLink} className="px-2.5 py-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer outline-none flex items-center gap-2">
                      <LinkIcon className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Copy Task Link</span>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item onClick={handleDuplicateTask} disabled={isDuplicating} className="px-2.5 py-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer outline-none flex items-center gap-2">
                      <Copy className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{isDuplicating ? 'Duplicating...' : 'Duplicate Task'}</span>
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>

              {/* Delete Task */}
              <button
                onClick={() => setShowDeleteConfirm(true)}
                title="Delete task"
                className="p-1.5 hover:bg-red-100 dark:hover:bg-red-950/60 text-zinc-500 hover:text-red-600 dark:hover:text-red-400 rounded transition outline-none"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              <button onClick={onClose} className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition text-zinc-500">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Delete Task Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in-50">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-2xl max-w-sm w-full space-y-4">
                <div className="space-y-1.5 text-center">
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Delete Task</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Are you sure you want to delete <span className="font-semibold text-zinc-700 dark:text-zinc-300">"{currentTask.title}"</span>? This action cannot be undone.
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
          {currentTask.isLocked && (
            <div className="flex items-center justify-between px-3.5 py-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 rounded-xl text-xs font-medium shadow-sm">
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Task is locked (Read-only)</span>
              </div>
              <button
                onClick={() => {
                  handleUpdateTask({ isLocked: false });
                  showToast('Task unlocked');
                }}
                className="text-[10px] font-bold text-amber-700 dark:text-amber-400 hover:underline"
              >
                Unlock
              </button>
            </div>
          )}

          {/* Title & Description */}
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight mb-2">
              {currentTask.title}
            </h1>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {currentTask.description || 'Create clear and detailed API documentation to guide developers in using the inventory and sales metrics features effectively.'}
            </p>
          </div>

          {/* Properties Row */}
          <div className="flex items-center gap-6 text-xs border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <span className="text-zinc-400 font-medium w-16">Properties</span>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                <span className="text-primary font-bold">A</span> {currentTask.role || 'Designer'}
              </span>
              {currentTask.dueDate && (
                <span className="flex items-center gap-1 bg-red-50 dark:bg-red-950/40 text-red-600 px-2 py-0.5 rounded text-[11px] font-medium">
                  <Calendar className="w-3 h-3" /> {formatDate(currentTask.dueDate)}
                </span>
              )}
            </div>
          </div>

          {/* Labels Row */}
          <div className="flex items-center gap-6 text-xs border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <span className="text-zinc-400 font-medium w-16">Labels</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {['Research', 'Design', 'Development', 'Testing', 'Deployment'].map((lbl) => (
                <span key={lbl} className="inline-flex items-center gap-1 text-[11px] bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 rounded text-zinc-600 dark:text-zinc-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" /> {lbl}
                </span>
              ))}
            </div>
          </div>

          {/* Resources Row */}
          <div className="flex items-center gap-6 text-xs border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <span className="text-zinc-400 font-medium w-16">Resources</span>
            <button className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xs">
              <LinkIcon className="w-3.5 h-3.5" /> Add document or link...
            </button>
          </div>

          {/* Subtasks Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Subtasks</h3>
            </div>

            <table className="w-full text-left text-xs border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
              <thead className="bg-zinc-50 dark:bg-zinc-800/40 border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-medium">
                <tr>
                  <th className="py-2 px-3 font-normal">Task</th>
                  <th className="py-2 px-3 font-normal">Priority</th>
                  <th className="py-2 px-3 font-normal">Members</th>
                  <th className="py-2 px-3 font-normal">Due Date</th>
                  <th className="py-2 px-3 font-normal text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-[11px]">
                {currentTask.subtasks?.map((sub) => (
                  <tr key={sub.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition">
                    <td className="py-2.5 px-3 font-medium text-zinc-800 dark:text-zinc-200">{sub.title}</td>
                    <td className="py-2.5 px-3">
                      <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-medium text-[10px]', PRIORITY_CONFIG[sub.priority]?.text, PRIORITY_CONFIG[sub.priority]?.bg)}>
                        <PrioritySignalIcon priority={sub.priority} className="w-2.5 h-2.5" />
                        {sub.priority}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[9px]">
                        CN
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-zinc-500">{formatDate(sub.dueDate)}</td>
                    <td className="py-2.5 px-3 text-right text-zinc-400">•••</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {isAddingSubtask ? (
              <form onSubmit={handleAddSubtask} className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  placeholder="Enter subtask title..."
                  className="flex-1 px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none"
                  autoFocus
                />
                <button type="submit" className="px-3 py-1.5 bg-primary text-white text-xs rounded-lg font-medium">Save</button>
                <button type="button" onClick={() => setIsAddingSubtask(false)} className="px-3 py-1.5 bg-zinc-200 dark:bg-zinc-800 text-xs rounded-lg">Cancel</button>
              </form>
            ) : (
              <button
                onClick={() => setIsAddingSubtask(true)}
                className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 pt-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Subtasks
              </button>
            )}
          </div>

          {/* Comments Section */}
          <CommentsSection
            taskId={currentTask.id}
            comments={currentTask.comments}
            onCommentsUpdated={(updatedComments) => {
              const updated = { ...currentTask, comments: updatedComments };
              setCurrentTask(updated);
              onTaskUpdated(updated);
            }}
            isLocked={currentTask.isLocked}
          />
        </div>

        {/* Right Side: Details & Activity Stream */}
        <div className="w-full md:w-80 p-6 bg-zinc-50/40 dark:bg-zinc-950/60 space-y-6 overflow-y-auto">
          
          {/* Details Card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm space-y-3.5 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">Details</span>
              <div className="flex items-center gap-1 text-zinc-400">
                <Plus className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Status</span>
              <span className="font-medium text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded text-[11px]">
                ● Backlog
              </span>
            </div>

            {/* Interactive Priority Selector Dropdown */}
            <div className="relative">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsPriorityOpen(!isPriorityOpen)}>
                <span className="text-zinc-400">Priority</span>
                <span className={cn('inline-flex items-center gap-1 font-medium px-2 py-0.5 rounded text-[11px]', PRIORITY_CONFIG[currentTask.priority]?.text, PRIORITY_CONFIG[currentTask.priority]?.bg)}>
                  <span className={cn('w-1.5 h-1.5 rounded-full', PRIORITY_CONFIG[currentTask.priority]?.dot)} />
                  {currentTask.priority}
                  <ChevronDown className="w-3 h-3 ml-1" />
                </span>
              </div>

              {isPriorityOpen && (
                <div className="absolute right-0 top-7 w-40 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl p-1 z-30 space-y-0.5">
                  {priorityList.map((p) => (
                    <button
                      key={p}
                      onClick={() => handlePriorityChange(p)}
                      className="flex items-center justify-between w-full px-2.5 py-1.5 text-[11px] rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                    >
                      <span className={PRIORITY_CONFIG[p]?.text}>{p.replace('_', ' ')}</span>
                      {currentTask.priority === p && <Check className="w-3.5 h-3.5 text-primary" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Members</span>
              <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center font-bold text-[10px]">
                D
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Dates</span>
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                {currentTask.dueDate ? formatDate(currentTask.dueDate) : '-'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Reporter</span>
              <span className="font-medium text-zinc-700 dark:text-zinc-300">Dexter</span>
            </div>
          </div>

          {/* Activity / Updates Section */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm space-y-3 text-xs">
            <span className="font-semibold text-zinc-800 dark:text-zinc-200 block">Updates</span>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200">You</p>
                <p className="text-[10px] text-zinc-500">changed priority from No Priority to Urgent</p>
              </div>

              <div className="space-y-1 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center text-[9px] font-bold">D</div>
                  <p className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200">You</p>
                </div>
                <p className="text-[10px] text-zinc-500">posted an update · Aug 2026</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}