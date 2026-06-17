"use client";

import {
  NotificationItem,
  type NotificationItemData,
} from "@/components/notifications/notification-item";

type NotificationDropdownProps = {
  loading: boolean;
  notifications: NotificationItemData[];
  onMarkAllRead: () => void;
  onMarkOneRead: (id: string) => void;
};

export function NotificationDropdown({
  loading,
  notifications,
  onMarkAllRead,
  onMarkOneRead,
}: NotificationDropdownProps) {
  const unreadCount = notifications.filter((item) => !item.isRead).length;

  return (
    <div className="absolute right-0 z-50 mt-3 w-[380px] overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220] shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-white">Notifications</h3>
          <p className="text-xs text-white/60">{unreadCount} unread</p>
        </div>

        <button
          type="button"
          onClick={onMarkAllRead}
          className="text-xs font-medium text-white/70 transition hover:text-white"
        >
          Mark all read
        </button>
      </div>

      <div className="max-h-[420px] overflow-y-auto">
        {loading ? (
          <div className="p-4 text-sm text-white/60">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-sm text-white/60">No notifications yet.</div>
        ) : (
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkRead={onMarkOneRead}
            />
          ))
        )}
      </div>
    </div>
  );
}