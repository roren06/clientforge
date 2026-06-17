import { PageShell } from "@/components/layout/page-shell";
import { NotificationsPageList } from "@/components/notifications/notifications-page-list";

export default function NotificationsPage() {
  return (
    <PageShell
      title="Notifications"
      description="Stay on top of approvals, revisions, uploads, and project activity."
    >
      <div className="space-y-6">
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-lg font-semibold text-white">
                Notification Center
              </p>
              <p className="mt-1 max-w-2xl text-sm text-gray-400">
                Track important workspace events in one place. Review approvals,
                revision requests, uploads, and collaboration activity without
                leaving the dashboard.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Inbox
                </p>
                <p className="mt-1 text-sm font-medium text-white">Live</p>
              </div>

              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-cyan-200/70">
                  Type
                </p>
                <p className="mt-1 text-sm font-medium text-cyan-100">
                  Workspace Alerts
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 sm:col-span-1 col-span-2">
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  View
                </p>
                <p className="mt-1 text-sm font-medium text-white">
                  Full Notification History
                </p>
              </div>
            </div>
          </div>
        </section>

        <NotificationsPageList />
      </div>
    </PageShell>
  );
}