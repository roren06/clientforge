"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useSession } from "next-auth/react";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";

type NotificationActor = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
};

type NotificationProject = {
  id: string;
  title: string;
  status: string;
};

type NotificationDeliverable = {
  id: string;
  title: string;
  status: string;
};

export type NotificationItemData = {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
  actor?: NotificationActor | null;
  project?: NotificationProject | null;
  deliverable?: NotificationDeliverable | null;
};

export function NotificationBell() {
  const { status } = useSession();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItemData[]>([]);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  async function loadNotifications() {
    try {
      setLoading(true);

      const [notificationsRes, countRes] = await Promise.all([
        fetch("/api/notifications", { cache: "no-store" }),
        fetch("/api/notifications/unread-count", { cache: "no-store" }),
      ]);

      // Notifications should never break page rendering.
      if (!notificationsRes.ok || !countRes.ok) {
        setNotifications([]);
        setCount(0);
        return;
      }

      const notificationsData = await notificationsRes.json();
      const countData = await countRes.json();

      setNotifications(notificationsData.notifications ?? []);
      setCount(countData.count ?? 0);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAllRead() {
    try {
      const res = await fetch("/api/notifications/mark-all-read", {
        method: "PATCH",
      });

      if (!res.ok) {
        return;
      }

      setNotifications((prev) =>
        prev.map((item) => ({
          ...item,
          isRead: true,
        }))
      );
      setCount(0);
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  }

  async function handleMarkOneRead(id: string) {
    try {
      const target = notifications.find((item) => item.id === id);
      if (!target || target.isRead) return;

      const res = await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
      });

      if (!res.ok) {
        return;
      }

      setNotifications((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, isRead: true } : item
        )
      );

      setCount((prev) => Math.max(prev - 1, 0));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  }

  useEffect(() => {
    if (status !== "authenticated") {
      setNotifications([]);
      setCount(0);
      setLoading(false);
      return;
    }

    loadNotifications();
  }, [status]);

  useEffect(() => {
    if (status === "authenticated" && open) {
      loadNotifications();
    }
  }, [open, status]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
        aria-label="Open notifications"
      >
        <Bell className="h-5 w-5" />
        {count > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-semibold text-white shadow-sm">
            {count > 99 ? "99+" : count}
          </span>
        ) : null}
      </button>

      {open ? (
        <NotificationDropdown
          loading={loading}
          notifications={notifications}
          onMarkAllRead={handleMarkAllRead}
          onMarkOneRead={handleMarkOneRead}
        />
      ) : null}
    </div>
  );
}