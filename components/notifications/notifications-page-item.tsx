"use client";

import Link from "next/link";

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

type NotificationsPageItemProps = {
  notification: NotificationItemData;
  onMarkRead: (id: string) => Promise<void> | void;
};

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 1000 / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${diffDay}d ago`;
}

export function NotificationsPageItem({
  notification,
  onMarkRead,
}: NotificationsPageItemProps) {
  const content = (
    <div
      className={`rounded-2xl border p-4 transition hover:bg-white/[0.04] ${
        notification.isRead
          ? "border-white/10 bg-white/[0.02]"
          : "border-cyan-400/20 bg-cyan-400/[0.04]"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-white">
              {notification.title}
            </p>

            {!notification.isRead ? (
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-cyan-400" />
            ) : null}
          </div>

          <p className="mt-1 text-sm text-gray-300">{notification.message}</p>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
            <span>{formatTimeAgo(notification.createdAt)}</span>

            {notification.project ? (
              <span>Project: {notification.project.title}</span>
            ) : null}

            {notification.deliverable ? (
              <span>Deliverable: {notification.deliverable.title}</span>
            ) : null}

            {notification.actor ? (
              <span>By: {notification.actor.name}</span>
            ) : null}
          </div>
        </div>

        {!notification.isRead ? (
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onMarkRead(notification.id);
            }}
            className="shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white hover:bg-white/10"
          >
            Mark read
          </button>
        ) : null}
      </div>
    </div>
  );

  if (notification.link) {
    return (
      <Link
        href={notification.link}
        onClick={async () => {
          if (!notification.isRead) {
            await onMarkRead(notification.id);
          }
        }}
        className="block"
      >
        {content}
      </Link>
    );
  }

  return content;
}