import { requireClientAccess } from "@/lib/guards";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ClientPortalPage() {
  const result = await requireClientAccess();

  return (
    <PageShell
      title="Client Portal"
      description="A simplified view for external clients."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-3xl border-white/10 bg-white/[0.03] text-white">
          <CardHeader>
            <CardTitle className="text-sm text-gray-400">Workspace</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {result.workspace?.name}
            </div>
            <p className="mt-2 text-xs text-gray-400">
              Client-safe portal access
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-white/10 bg-white/[0.03] text-white">
          <CardHeader>
            <CardTitle className="text-sm text-gray-400">Role</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{result.role}</div>
            <p className="mt-2 text-xs text-gray-400">
              Restricted external access
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-white/10 bg-white/[0.03] text-white">
          <CardHeader>
            <CardTitle className="text-sm text-gray-400">Logged in as</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{result.user.name}</div>
            <p className="mt-2 text-xs text-gray-400">{result.user.email}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl border-white/10 bg-white/[0.03] text-white">
        <CardHeader>
          <CardTitle>Portal Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-300">
          <p>
            This page represents the external client experience.
          </p>
          <p>
            In the next phases, this portal will show only client-safe data such as:
          </p>
          <ul className="list-disc space-y-1 pl-5 text-gray-400">
            <li>shared projects</li>
            <li>deliverables for review</li>
            <li>approval or revision actions</li>
            <li>client-visible comments</li>
          </ul>
        </CardContent>
      </Card>
    </PageShell>
  );
}