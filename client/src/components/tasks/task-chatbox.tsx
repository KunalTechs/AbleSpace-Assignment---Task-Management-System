'use client';

import React, { useState } from 'react';
import { Paperclip, Send, MessageSquare, Lock, Users } from 'lucide-react';
import { TaskComment } from '@/types/task.types';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';

interface TaskChatboxProps {
  taskId: string;
  comments?: TaskComment[];
  assignedUsers?: any[];
  onCommentsUpdated: (newComments: TaskComment[]) => void;
  isLocked?: boolean;
}

export function TaskChatbox({
  taskId,
  comments = [],
  assignedUsers = [],
  onCommentsUpdated,
  isLocked = false,
}: TaskChatboxProps) {
  const [chatMessage, setChatMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filter only chat messages
  const chatComments = comments.filter((c) => c.type === 'CHAT');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const getCurrentUser = () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user_profile');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {}
      }
    }
    return null;
  };

  const getAuthorName = (): string => {
    const user = getCurrentUser();
    return user?.fullName || user?.email || 'Dexter';
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    if (isLocked) {
      showToast('🔒 Task is locked');
      return;
    }

    try {
      setSubmitting(true);
      const author = getAuthorName();
      const res = await api.post(`/tasks/${taskId}/comments`, {
        content: chatMessage.trim(),
        author,
        type: 'CHAT',
      });

      const updatedList = [...comments, res.data];
      onCommentsUpdated(updatedList);
      setChatMessage('');
      showToast('Message sent to task members');
    } catch (err: any) {
      console.error('Failed to send chat message:', err);
      showToast('Failed to send message');
    } finally {
      setSubmitting(false);
    }
  };

  const renderContentWithMentions = (content: string) => {
    const parts = content.split(/(@[\w.-]+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <span
            key={index}
            className="inline-flex items-center font-semibold text-indigo-500 dark:text-indigo-400 bg-indigo-500/10 px-1 rounded mx-0.5"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const currentUser = getCurrentUser();

  return (
    <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs mb-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-zinc-50/80 dark:bg-zinc-800/40 border-b border-zinc-200/80 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <span className="font-bold text-xs tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
            Task Team Chatbox
          </span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            {chatComments.length} messages
          </span>
        </div>

        <div className="flex items-center gap-3">
          {toastMessage && (
            <span className="text-[10px] bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-2.5 py-0.5 rounded-full font-medium shadow-xs animate-in fade-in">
              {toastMessage}
            </span>
          )}

          {/* Assigned Member Avatars */}
          <div className="flex items-center -space-x-1.5">
            {assignedUsers && assignedUsers.length > 0 ? (
              assignedUsers.map((u: any, idx: number) => (
                <div
                  key={u.id || idx}
                  title={u.fullName || u.email}
                  className="w-5.5 h-5.5 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center font-bold text-[9px] ring-2 ring-white dark:ring-zinc-900"
                >
                  {u.fullName ? u.fullName[0].toUpperCase() : 'U'}
                </div>
              ))
            ) : (
              <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                <Users className="w-3 h-3" />
                <span>All Members</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Messages Stream */}
      <div className="p-4 max-h-80 overflow-y-auto space-y-3.5 bg-zinc-50/30 dark:bg-zinc-950/20">
        {chatComments.length > 0 ? (
          chatComments.map((c) => {
            const isMe =
              currentUser &&
              ((currentUser.fullName &&
                c.author.toLowerCase().includes(currentUser.fullName.toLowerCase())) ||
                (currentUser.email &&
                  c.author.toLowerCase() === currentUser.email.toLowerCase()) ||
                c.author === 'Dexter');

            return (
              <div
                key={c.id}
                className={cn('flex items-start gap-2.5 text-xs max-w-[85%]', isMe ? 'ml-auto flex-row-reverse' : '')}
              >
                <div className="w-6.5 h-6.5 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center font-bold text-[10px] shrink-0 shadow-xs">
                  {c.author ? c.author[0].toUpperCase() : 'U'}
                </div>

                <div className={cn('space-y-1', isMe ? 'text-right' : 'text-left')}>
                  <div className="flex items-center gap-2 px-1">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-[10.5px]">
                      {c.author}
                    </span>
                    <span className="text-[9px] text-zinc-400">
                      {c.createdAt
                        ? new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'just now'}
                    </span>
                  </div>

                  <div
                    className={cn(
                      'p-3 rounded-2xl text-xs leading-relaxed inline-block shadow-xs border',
                      isMe
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-transparent rounded-tr-xs'
                        : 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-200/80 dark:border-zinc-700/60 rounded-tl-xs'
                    )}
                  >
                    {renderContentWithMentions(c.content)}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-6 text-center text-zinc-400 space-y-1">
            <MessageSquare className="w-6 h-6 mx-auto opacity-30 stroke-[1.5]" />
            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">No chat messages yet.</p>
            <p className="text-[11px] text-zinc-400">
              Type a message below to chat with assigned task members in real-time!
            </p>
          </div>
        )}
      </div>

      {/* Chat Message Input Bar */}
      <form
        onSubmit={handleSendChatMessage}
        className="flex items-center bg-white dark:bg-zinc-900 border-t border-zinc-200/80 dark:border-zinc-800 px-4 py-2.5 gap-2"
      >
        <input
          type="text"
          value={chatMessage}
          disabled={isLocked}
          onChange={(e) => setChatMessage(e.target.value)}
          placeholder={isLocked ? 'Task is locked...' : 'Write a chat message to task members...'}
          className="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80 rounded-xl px-3.5 py-2 text-xs outline-none text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed"
        />
        <button
          type="button"
          disabled={isLocked}
          className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition disabled:opacity-40"
        >
          <Paperclip className="w-4 h-4" />
        </button>
        <button
          type="submit"
          disabled={isLocked || submitting || !chatMessage.trim()}
          className="p-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90 transition font-semibold disabled:opacity-40 shadow-xs"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
