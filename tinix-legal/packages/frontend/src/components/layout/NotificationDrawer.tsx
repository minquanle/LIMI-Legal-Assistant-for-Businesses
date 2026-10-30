'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Bell, X, ShieldAlert, FileCheck, Clock, Info, Loader2,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useEscapeToClose } from '@/lib/useEscapeToClose';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  documentId: string | null;
  read: boolean;
  createdAt: string;
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

function iconFor(type: string) {
  if (type.includes('RISK') || type.includes('ALERT')) return <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />;
  if (type.includes('APPROVAL') || type.includes('DOCUMENT')) return <FileCheck className="w-4 h-4 text-green-600 shrink-0" />;
  if (type.includes('EXPIRY') || type.includes('DEADLINE')) return <Clock className="w-4 h-4 text-amber-600 shrink-0" />;
  return <Info className="w-4 h-4 text-slate-400 shrink-0" />;
}

export function NotificationDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifs, setNotifs] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const unreadCount = notifs.filter((n) => !n.read).length;

  useEscapeToClose(isOpen, () => setIsOpen(false));

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await apiClient.getNotifications();
      setNotifs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll periodically so the badge count reflects real server-side events
  // even while the drawer is closed.
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAllRead = async () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await apiClient.markAllNotificationsRead();
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      fetchNotifications();
    }
  };

  const markOneRead = async (id: string) => {
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await apiClient.markNotificationRead(id);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      fetchNotifications();
    }
  };

  return (
    <>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        aria-label={unreadCount > 0 ? `Thông báo (${unreadCount} chưa đọc)` : 'Thông báo'}
        className="relative p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
      >
        <Bell className="w-4 h-4" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white font-bold text-[10px] rounded-full flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Slide-over Drawer */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex justify-end"
          onClick={() => setIsOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="notification-drawer-title"
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 w-full max-w-md h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300"
          >

            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                <h2 id="notification-drawer-title" className="font-bold text-slate-900 dark:text-slate-100 text-sm">Thông báo</h2>
                {unreadCount > 0 && (
                  <span className="bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[11px] px-2 py-0.5 rounded-full font-bold">
                    {unreadCount} mới
                  </span>
                )}
              </div>
              <button onClick={() => setIsOpen(false)} aria-label="Đóng thông báo" className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Notifications Feed List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-500 uppercase tracking-wider">Thông báo Quy trình</span>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                    Đánh dấu tất cả đã đọc
                  </button>
                )}
              </div>

              {loading && notifs.length === 0 ? (
                <div className="flex items-center justify-center py-10 text-slate-400 gap-2 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin" /> Đang tải thông báo...
                </div>
              ) : error ? (
                <div className="py-10 text-center text-xs text-rose-500">Không thể tải thông báo. Vui lòng thử lại sau.</div>
              ) : notifs.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">Không có thông báo nào.</div>
              ) : (
                notifs.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => !n.read && markOneRead(n.id)}
                    className={`w-full text-left p-3.5 rounded-xl border text-xs space-y-1.5 transition ${
                      !n.read
                        ? 'bg-indigo-50/40 dark:bg-slate-800/80 border-indigo-200 dark:border-indigo-800'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        {iconFor(n.type)}
                        {n.title}
                      </h3>
                      <span className="text-[10px] text-slate-400 shrink-0">{timeAgo(n.createdAt)}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{n.body}</p>
                  </button>
                ))
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
}
