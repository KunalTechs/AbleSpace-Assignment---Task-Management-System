'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck, MessageSquare, CheckCircle2, Clock, Check } from 'lucide-react';
import { api } from '@/lib/api-client';
import * as Popover from '@radix-ui/react-popover';

export interface NotificationItem {
  id: string;
  recipient: string;
  author: string;
  title: string;
  message: string;
  taskId?: string;
  isRead: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const userProfileStr = localStorage.getItem('user_profile');
      let recipient = 'Dexter';
      if (userProfileStr) {
        try {
          const user = JSON.parse(userProfileStr);
          recipient = user.fullName || user.email || 'Dexter';
        } catch (e) {}
      }

      const res = await api.get('/notifications', {
        params: { recipient },
      });

      if (Array.isArray(res.data)) {
        setNotifications(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 8000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleNotificationClick = async (item: NotificationItem) => {
    if (!item.isRead) {
      try {
        await api.patch(`/notifications/${item.id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
        );
      } catch (err) {
        console.error('Error marking notification read:', err);
      }
    }
    if (item.taskId) {
      router.push(`/tasks/${item.taskId}`);
    }
  };

  const handleMarkIndividualRead = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error('Error marking notification read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Error marking all notifications read:', err);
    }
  };

  return (
    <Popover.Root onOpenChange={(open) => open && fetchNotifications()}>
      <Popover.Trigger asChild>
        <button
          className="relative p-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition focus:outline-none"
          title="Notifications"
        >
          <Bell className="w-4 h-4 stroke-[1.8]" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="w-80 sm:w-96 rounded-2xl bg-white dark:bg-zinc-900 p-0 shadow-2xl border border-zinc-200 dark:border-zinc-800 z-50 animate-in fade-in-50 zoom-in-95"
        >
          {/* Popover Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-1 text-[11px] font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>

          {/* Subheader Notice for 24h Purge */}
          <div className="px-4 py-1.5 bg-zinc-50 dark:bg-zinc-800/40 border-b border-zinc-100 dark:border-zinc-800/60 text-[10px] text-zinc-400 flex items-center justify-between">
            <span>Read notifications auto-delete after 24h</span>
            <Clock className="w-3 h-3 text-zinc-400" />
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-zinc-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30 stroke-[1.5]" />
                <p className="text-xs">No notifications yet.</p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`flex items-start gap-3 p-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition ${
                    !item.isRead ? 'bg-primary/[0.03] dark:bg-primary/[0.05]' : 'opacity-80'
                  }`}
                >
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 text-primary font-bold text-xs shadow-xs">
                    {item.title.includes('💬') ? (
                      <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {item.title}
                      </span>
                      <span className="text-[10px] text-zinc-400 flex items-center gap-0.5 shrink-0">
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-snug">
                      <strong className="text-zinc-800 dark:text-zinc-200 font-medium">{item.author}: </strong>
                      {item.message}
                    </p>
                  </div>

                  {/* Individual Mark as Read Button */}
                  {!item.isRead ? (
                    <button
                      onClick={(e) => handleMarkIndividualRead(e, item.id)}
                      className="mt-0.5 p-1 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-zinc-400 hover:text-emerald-600 transition"
                      title="Mark as read"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <span className="text-[9px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-900/50 shrink-0">
                      Read
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
