import { requireClientAccess } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { PageShell } from "@/components/layout/page-shell";
import { ClientDeliverableActions } from "@/components/portal/client-deliverable-actions";
import { PortalSwitchAccountButton } from "@/components/portal/portal-switch-account-button";
import { DeliverableComments } from "@/components/projects/deliverable-comments";

async function getLinkedClient(workspaceId: string, userId: string) {
  const where = {
    workspaceId,
    userId,
  };

  return prisma.client.findFirst({
    where,
  });
}

async function getClientPortalData(workspaceId: string, clientId: string) {
  const projects = await prisma.project.findMany({
    where: {
      workspaceId,
      clientId,
    },
    include: {
      client: true,
      deliverables: {
        where: {
          status: {
            not: "DRAFT",
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      activityLogs: {
        take: 5,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return projects;
}

export default async function ClientPortalPage() {
  const result = await requireClientAccess();
  const client = await getLinkedClient(result.workspace!.id, result.user.id);
  const projects = client
    ? await getClientPortalData(result.workspace!.id, client.id)
    : [];
  const deliverables = projects.flatMap((project) => project.deliverables);
  const pendingReviews = deliverables.filter(
    (deliverable) => deliverable.status === "IN_REVIEW"
  ).length;
  const approvedDeliverables = deliverables.filter(
    (deliverable) => deliverable.status === "APPROVED"
  ).length;
  const revisionRequests = deliverables.filter(
    (deliverable) => deliverable.status === "REVISION_REQUESTED"
  ).length;
  const latestActivity = projects
    .flatMap((project) =>
      project.activityLogs.map((activity) => ({
        ...activity,
        projectTitle: project.title,
      }))
    )
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 6);

  return (
    <PageShell
      title="Client Portal"
      description="Review shared work, leave feedback, and track project progress."
    >
      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_34%),rgba(255,255,255,0.03)] p-6 text-white shadow-2xl shadow-black/20">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-100">
              Secure client workspace
            </div>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white">
              Welcome back, {result.user.name}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-300">
              Review shared deliverables for {client?.name ?? "your account"},
              approve work that is ready, or request changes with clear feedback.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Signed in as
            </p>
            <p className="mt-1 font-medium text-white">{result.user.email}</p>
            <div className="mt-3">
              <PortalSwitchAccountButton />
            </div>
          </div>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <PortalMetric
          label="Active Projects"
          value={projects.length}
          helper={result.workspace?.name ?? "ClientForge workspace"}
        />
        <PortalMetric
          label="Needs Review"
          value={pendingReviews}
          helper="Deliverables waiting for your decision"
          tone={pendingReviews > 0 ? "attention" : "neutral"}
        />
        <PortalMetric
          label="Approved"
          value={approvedDeliverables}
          helper="Deliverables you have signed off"
          tone="success"
        />
        <PortalMetric
          label="Changes Requested"
          value={revisionRequests}
          helper="Items sent back for revision"
          tone={revisionRequests > 0 ? "warning" : "neutral"}
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
        {projects.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-sm text-gray-400">
              No client projects are available for this account yet.
          </div>
        ) : null}

        {projects.map((project) => (
          <section
            key={project.id}
            className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] text-white"
          >
            <div className="border-b border-white/10 p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-semibold text-white">
                      {project.title}
                    </h3>
                    <StatusBadge status={project.status} />
                  </div>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
                    {project.description ?? "No project description provided."}
                  </p>
                </div>

                <div className="grid min-w-64 grid-cols-2 gap-3 text-sm">
                  <MiniStat label="Progress" value={`${project.progress}%`} />
                  <MiniStat
                    label="Due"
                    value={formatDeadline(project.deadline)}
                    muted={isPastDeadline(project.deadline)}
                  />
                </div>
              </div>

              <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300"
                  style={{ width: `${clamp(project.progress, 0, 100)}%` }}
                />
              </div>
            </div>

            <div className="space-y-4 p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="font-medium text-white">Shared Deliverables</h4>
                  <p className="mt-1 text-sm text-gray-400">
                    Open files, review notes, and send feedback from one place.
                  </p>
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300">
                  {project.deliverables.length} shared
                </span>
              </div>

              {project.deliverables.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-sm text-gray-400">
                  No deliverables shared yet.
                </div>
              ) : (
                project.deliverables.map((deliverable) => (
                  <div
                    key={deliverable.id}
                    data-testid={`portal-deliverable-card-${deliverable.id}`}
                    className="rounded-2xl border border-white/10 bg-black/10 p-4"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-base font-medium text-white">
                            {deliverable.title}
                          </p>
                          <StatusBadge status={deliverable.status} />
                        </div>
                        <p className="mt-2 text-sm text-gray-400">
                          {deliverable.type} deliverable · Updated{" "}
                          {formatDate(deliverable.updatedAt)}
                        </p>
                      </div>

                      <ClientDeliverableActions
                        deliverableId={deliverable.id}
                        currentStatus={deliverable.status}
                      />
                    </div>

                    <p className="mt-3 text-sm leading-6 text-gray-400">
                      {deliverable.notes || "No notes provided."}
                    </p>

                    <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,360px)]">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                        <p className="text-sm font-medium text-white">
                          Review Checklist
                        </p>
                        <ul className="mt-3 space-y-2 text-sm text-gray-400">
                          <ReviewStep
                            done={Boolean(deliverable.fileUrl)}
                            label="Open the latest file or asset"
                          />
                          <ReviewStep
                            done={deliverable.status !== "IN_REVIEW"}
                            label="Submit approval or revision request"
                          />
                          <ReviewStep
                            done={deliverable.status === "APPROVED"}
                            label="Final approval recorded"
                          />
                        </ul>

                        {deliverable.fileUrl ? (
                          <a
                            href={`/api/deliverables/${deliverable.id}/file/download`}
                            className="mt-4 inline-flex rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs font-medium text-cyan-100 transition hover:bg-cyan-300/15"
                          >
                            Download {deliverable.fileName ?? "attached file"}
                          </a>
                        ) : (
                          <p className="mt-4 rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-3 text-xs text-gray-500">
                            No file is attached yet. Use comments to ask the
                            owner for the latest asset.
                          </p>
                        )}
                      </div>

                      <DeliverableComments deliverableId={deliverable.id} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        ))}
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-white">
            <h3 className="font-semibold">Client Details</h3>
            <div className="mt-5 space-y-3">
              <DetailRow label="Client" value={client?.name ?? "Not linked"} />
              <DetailRow label="Company" value={client?.company ?? "Not set"} />
              <DetailRow label="Email" value={client?.email ?? result.user.email} />
              <DetailRow
                label="Access"
                value={client ? "Restricted to linked client" : "Needs linking"}
              />
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-white">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold">Recent Activity</h3>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-gray-400">
                Live
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {latestActivity.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-sm text-gray-400">
                  No recent activity yet.
                </div>
              ) : (
                latestActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.02] p-4"
                  >
                    <p className="text-sm leading-6 text-gray-300">
                      {activity.message}
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                      {activity.projectTitle} · {formatDate(activity.createdAt)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}

function PortalMetric({
  label,
  value,
  helper,
  tone = "neutral",
}: {
  label: string;
  value: number;
  helper: string;
  tone?: "neutral" | "attention" | "success" | "warning";
}) {
  const toneClass =
    tone === "attention"
      ? "border-cyan-300/20 bg-cyan-300/[0.08]"
      : tone === "success"
      ? "border-emerald-300/20 bg-emerald-300/[0.08]"
      : tone === "warning"
      ? "border-amber-300/20 bg-amber-300/[0.08]"
      : "border-white/10 bg-white/[0.03]";

  return (
    <div className={`rounded-3xl border p-5 text-white ${toneClass}`}>
      <p className="text-sm text-gray-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
      <p className="mt-2 text-xs leading-5 text-gray-500">{helper}</p>
    </div>
  );
}

function MiniStat({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`mt-1 text-sm font-medium ${muted ? "text-amber-200" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-right font-medium text-gray-200">{value}</span>
    </div>
  );
}

function ReviewStep({ done, label }: { done: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <span
        className={`h-2.5 w-2.5 rounded-full ${
          done ? "bg-emerald-300" : "bg-white/20"
        }`}
      />
      {label}
    </li>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "APPROVED" || status === "COMPLETED"
      ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
      : status === "IN_REVIEW" || status === "REVIEW"
      ? "border-cyan-300/20 bg-cyan-300/10 text-cyan-100"
      : status === "REVISION_REQUESTED"
      ? "border-amber-300/20 bg-amber-300/10 text-amber-100"
      : "border-white/10 bg-white/5 text-gray-300";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-medium ${tone}`}>
      {prettyStatus(status)}
    </span>
  );
}

function prettyStatus(status: string) {
  return status
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatDeadline(date: Date | null) {
  if (!date) return "No due date";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function isPastDeadline(date: Date | null) {
  if (!date) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(date);
  deadline.setHours(0, 0, 0, 0);

  return deadline < today;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}