'use client';

import React, { useState, useRef } from 'react';
import { 
  Paperclip, 
  Send, 
  MoreHorizontal, 
  MessageSquare, 
  Trash2, 
  Reply, 
  Copy, 
  Check, 
  X,
  FileText,
  CornerDownRight
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { TaskComment } from '@/types/task.types';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';

interface CommentsSectionProps {
  taskId: string;
  comments?: TaskComment[];
  onCommentsUpdated: (newComments: TaskComment[]) => void;
  isLocked?: boolean;
}

export function CommentsSection({ 
  taskId, 
  comments = [], 
  onCommentsUpdated,
  isLocked = false 
}: CommentsSectionProps) {
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; size?: string }[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replyFileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const getAuthorName = (): string => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user_profile');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          return parsed.fullName || parsed.email || 'Dexter';
        } catch (e) {}
      }
    }
    return 'Dexter';
  };

  const formatTimeAgo = (dateStr: string) => {
    if (!dateStr) return 'just now';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const fileList: { name: string; size?: string }[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      fileList.push({ name: file.name, size: `${sizeMb} MB` });
    }
    setAttachedFiles((prev) => [...prev, ...fileList]);
    showToast(`Attached ${files.length} file(s)`);
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() && attachedFiles.length === 0) return;
    if (isLocked) {
      showToast('🔒 Task is locked (Read-only)');
      return;
    }

    try {
      setSubmitting(true);
      const author = getAuthorName();
      
      let finalContent = newComment.trim();
      if (attachedFiles.length > 0) {
        const fileString = attachedFiles.map((f) => `📎 [${f.name}]`).join(' ');
        finalContent = finalContent ? `${finalContent}\n\n${fileString}` : fileString;
      }

      const res = await api.post(`/tasks/${taskId}/comments`, {
        content: finalContent,
        author,
        type: 'COMMENT',
      });

      const updatedList = [...comments, res.data];
      onCommentsUpdated(updatedList);
      setNewComment('');
      setAttachedFiles([]);
      showToast('Comment posted successfully');
    } catch (err: any) {
      console.error('Failed to post comment:', err);
      showToast('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePostReply = async (parentComment: TaskComment) => {
    if (!replyText.trim()) return;
    if (isLocked) {
      showToast('🔒 Task is locked');
      return;
    }

    try {
      const author = getAuthorName();
      const content = `@${parentComment.author} ${replyText.trim()}`;

      const res = await api.post(`/tasks/${taskId}/comments`, {
        content,
        author,
      });

      const updatedList = [...comments, res.data];
      onCommentsUpdated(updatedList);
      setReplyText('');
      setReplyingToId(null);
      showToast('Reply posted');
    } catch (err) {
      console.error('Failed to post reply:', err);
      showToast('Failed to post reply');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (isLocked) return;
    try {
      await api.delete(`/tasks/${taskId}/comments/${commentId}`);
      const updatedList = comments.filter((c) => c.id !== commentId);
      onCommentsUpdated(updatedList);
      showToast('Comment deleted');
    } catch (err) {
      console.error('Failed to delete comment:', err);
      showToast('Failed to delete comment');
    }
  };

  const handleCopyCommentText = (comment: TaskComment) => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(comment.content);
      setCopiedId(comment.id);
      showToast('Comment text copied');
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const renderContentWithMentions = (content: string) => {
    const parts = content.split(/(@[\w.-]+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <span key={index} className="inline-flex items-center font-semibold text-primary bg-primary/10 px-1 rounded mx-0.5">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const regularComments = comments.filter((c) => c.type !== 'CHAT');

  return (
    <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-zinc-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
            Comments ({regularComments.length})
          </h3>
        </div>

        {toastMessage && (
          <span className="text-[10px] bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-2.5 py-0.5 rounded-full font-medium shadow-sm animate-in fade-in">
            {toastMessage}
          </span>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        multiple
        className="hidden"
      />

      {/* Comments List */}
      <div className="space-y-3">
        {regularComments.map((comment) => {
          const isReplying = replyingToId === comment.id;
          const initials = comment.author ? comment.author.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : 'U';

          return (
            <div 
              key={comment.id}
              className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4 shadow-xs space-y-2.5 transition hover:border-zinc-300 dark:hover:border-zinc-700"
            >
              {/* Comment Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                    {initials}
                  </div>
                  <div>
                    <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 mr-2">
                      {comment.author}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-normal">
                      {formatTimeAgo(comment.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Dropdown Menu Options */}
                {!isLocked && (
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                      <button className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition outline-none">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Content 
                        align="end" 
                        className="w-36 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl p-1 z-50 text-xs space-y-0.5 animate-in fade-in-50"
                      >
                        <DropdownMenu.Item
                          onClick={() => {
                            setReplyingToId(isReplying ? null : comment.id);
                            setReplyText('');
                          }}
                          className="px-2.5 py-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer outline-none text-zinc-700 dark:text-zinc-300 flex items-center gap-2"
                        >
                          <Reply className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Reply</span>
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                          onClick={() => handleCopyCommentText(comment)}
                          className="px-2.5 py-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer outline-none text-zinc-700 dark:text-zinc-300 flex items-center gap-2"
                        >
                          {copiedId === comment.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
                          <span>{copiedId === comment.id ? 'Copied!' : 'Copy Text'}</span>
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                          onClick={() => handleDeleteComment(comment.id)}
                          className="px-2.5 py-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer outline-none text-red-600 dark:text-red-400 flex items-center gap-2"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                )}
              </div>

              {/* Comment Content */}
              <div className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-normal whitespace-pre-wrap pl-9">
                {renderContentWithMentions(comment.content)}
              </div>

              {/* Inline Reply Input Box (Figma design matching: "Leave a reply...") */}
              {isReplying && (
                <div className="pl-9 pt-2 animate-in fade-in-50">
                  <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2">
                    <CornerDownRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handlePostReply(comment);
                        }
                      }}
                      placeholder={`Reply to ${comment.author}...`}
                      className="flex-1 bg-transparent text-xs outline-none text-zinc-800 dark:text-zinc-200"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition"
                      title="Attach file"
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePostReply(comment)}
                      disabled={!replyText.trim()}
                      className="p-1.5 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 disabled:opacity-40 transition"
                    >
                      <Send className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setReplyingToId(null)}
                      className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {regularComments.length === 0 && (
          <div className="p-6 text-center text-zinc-400 space-y-1 bg-zinc-50/50 dark:bg-zinc-900/30 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
            <MessageSquare className="w-5 h-5 mx-auto text-zinc-400 mb-1" />
            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">No comments yet.</p>
            <p className="text-[11px] text-zinc-400">Be the first to leave a comment on this task!</p>
          </div>
        )}
      </div>

      {/* Main Comment Input Box (Figma layout: "Add a comment...") */}
      <form onSubmit={handlePostComment} className="space-y-2 pt-1">
        {/* Attached Files Chips */}
        {attachedFiles.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {attachedFiles.map((file, i) => (
              <span 
                key={i} 
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-[11px] text-zinc-700 dark:text-zinc-300 font-medium"
              >
                <FileText className="w-3 h-3 text-primary" />
                <span>{file.name}</span>
                <button
                  type="button"
                  onClick={() => setAttachedFiles(attachedFiles.filter((_, idx) => idx !== i))}
                  className="hover:text-red-500 transition ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="flex items-center bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-2xl px-3.5 py-2.5 shadow-xs focus-within:ring-2 focus-within:ring-primary/30 transition">
          <input
            type="text"
            value={newComment}
            disabled={isLocked}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={isLocked ? "Task is locked..." : "Add a comment..."}
            className="flex-1 bg-transparent text-xs outline-none text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 disabled:cursor-not-allowed"
          />
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={isLocked}
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition disabled:opacity-40 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
              title="Attach file"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <button
              type="submit"
              disabled={isLocked || submitting || (!newComment.trim() && attachedFiles.length === 0)}
              className="p-2 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition font-semibold disabled:opacity-40 shadow-xs"
              title="Send comment"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
