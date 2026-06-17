"use client";

import { useEffect, useMemo, useState } from "react";
import { NotificationsPageItem } from "@/components/notifications/notifications-page-item";

type NotificationItemData = {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
  actor?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  } | null;
  project?: {
    id: string;
    title: string;
    status: string;
  } | null;
  deliverable?: {
    id: string;
    title: string;
    status: string;
  } | null;
};

export function NotificationsPageList() {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItemData[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  async function loadNotifications() {
    try {
      setLoading(true);
      setMessage(null);

      const res = await fetch("/api/notifications", {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch notifications.");
      }

      const data = await res.json();
      setNotifications(data.notifications ?? []);
    } catch (error) {
      console.error("Failed to load notifications:", error);
      setMessage("Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkRead(id: string) {
    try {
      const target = notifications.find((item) => item.id === id);
      if (!target || target.isRead) return;

      const res = await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
      });

      if (!res.ok) {
        throw new Error("Failed to mark notification as read.");
      }

      setNotifications((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, isRead: true } : item
        )
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      setMessage("Failed to mark notification as read.");
    }
  }

  async function handleMarkAllRead() {
    try {
      setMessage(null);

      const res = await fetch("/api/notifications/mark-all-read", {
        method: "PATCH",
      });

      if (!res.ok) {
        throw new Error("Failed to mark all notifications as read.");
      }

      setNotifications((prev) =>
        prev.map((item) => ({
          ...item,
          isRead: true,
        }))
      );
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      setMessage("Failed to mark all notifications as read.");
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications]
  );

  const readCount = notifications.length - unreadCount;

  const latestType = notifications[0]?.type
    ? notifications[0].type.replaceAll("_", " ")
    : "No activity yet";

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <p className="text-sm text-gray-400">Unread Notifications</p>
          <p className="mt-2 text-3xl font-semibold text-white">
            {unreadCount}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Items that still need your attention
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <p className="text-sm text-gray-400">Read Notifications</p>
          <p className="mt-2 text-3xl font-semibold text-white">{readCount}</p>
          <p className="mt-1 text-xs text-gray-500">
            Notifications already reviewed
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <p className="text-sm text-gray-400">Latest Signal</p>
          <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-white">
            {latestType}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Most recent notification category
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.03] overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">
              Inbox Feed
            </h2>
            <p className="text-sm text-gray-400">
              {unreadCount} unread · {notifications.length} total
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={loadNotifications}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
            >
              Refresh
            </button>

            <button
              type="button"
              onClick={handleMarkAllRead}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
            >
              Mark all as read
            </button>
          </div>
        </div>

        {message ? (
          <div className="border-b border-white/10 bg-rose-400/10 px-5 py-3 text-sm text-rose-200">
            {message}
          </div>
        ) : null}

        <div className="p-5">
          {loading ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-sm text-gray-400">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6">
              <p className="text-sm font-medium text-white">
                No notifications yet
              </p>
              <p className="mt-1 text-sm text-gray-400">
                Approvals, uploads, comments, and project events will appear here
                once activity starts happening in your workspace.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <NotificationsPageItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={handleMarkRead}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}