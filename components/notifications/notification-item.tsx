"use client";

import Link from "next/link";

export type NotificationItemData = {
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

type NotificationItemProps = {
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

export function NotificationItem({
  notification,
  onMarkRead,
}: NotificationItemProps) {
  const content = (
    <div
      className={`border-b border-white/10 px-4 py-3 transition hover:bg-white/5 ${
        notification.isRead ? "bg-transparent" : "bg-white/[0.04]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">{notification.title}</p>
          <p className="mt-1 text-sm text-white/70">{notification.message}</p>
          <p className="mt-2 text-xs text-white/50">
            {formatTimeAgo(notification.createdAt)}
          </p>
        </div>

        {!notification.isRead ? (
          <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-cyan-400" />
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

  return (
    <button
      type="button"
      onClick={() => onMarkRead(notification.id)}
      className="block w-full text-left"
    >
      {content}
    </button>
  );
}