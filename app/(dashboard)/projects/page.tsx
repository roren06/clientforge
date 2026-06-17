import { PageShell } from "@/components/layout/page-shell";
import { AddProjectForm } from "@/components/projects/add-project-form";
import Link from "next/link";
import { getAppBaseUrl } from "@/lib/app-url";
import { requireInternalAccess } from "@/lib/guards";
import { cookies } from "next/headers";

type Project = {
  id: string;
  title: string;
  status: string;
  progress: number;
  deadline: string | null;
  client: {
    name: string;
  };
};

type Client = {
  id: string;
  name: string;
  company: string | null;
};

async function getProjects(): Promise<{ projects: Project[] }> {
  const baseUrl = getAppBaseUrl();
  const cookieHeader = (await cookies()).toString();

  const res = await fetch(`${baseUrl}/api/projects`, {
    cache: "no-store",
    headers: {
      Cookie: cookieHeader,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch projects.");
  }

  return res.json();
}

async function getClients(): Promise<{ clients: Client[] }> {
  const baseUrl = getAppBaseUrl();
  const cookieHeader = (await cookies()).toString();

  const res = await fetch(`${baseUrl}/api/clients`, {
    cache: "no-store",
    headers: {
      Cookie: cookieHeader,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch clients.");
  }

  return res.json();
}

function getDisplayStatus(status: string, progress: number) {
  if (progress >= 100) return "COMPLETED";
  if (progress >= 70 && status !== "COMPLETED") return "REVIEW";
  if (progress > 0 && status === "PLANNING") return "ACTIVE";
  return status;
}

function getStatusBadgeClasses(status: string) {
  switch (status) {
    case "COMPLETED":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-200";
    case "REVIEW":
      return "border-amber-400/20 bg-amber-400/10 text-amber-200";
    case "ACTIVE":
      return "border-cyan-400/20 bg-cyan-400/10 text-cyan-200";
    case "PLANNING":
      return "border-white/10 bg-white/5 text-gray-300";
    default:
      return "border-white/10 bg-white/5 text-gray-300";
  }
}

export default async function ProjectsPage() {
  await requireInternalAccess();

  const [{ projects }, { clients }] = await Promise.all([
    getProjects(),
    getClients(),
  ]);

  return (
    <PageShell
      title="Projects"
      description="Track client projects across your workspace."
    >
      <AddProjectForm clients={clients} />

      {projects.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-sm text-gray-400">
          No projects yet. Create your first project to start tracking client work.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.03] text-left text-gray-400">
              <tr>
                <th className="px-6 py-4">Project</th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Progress</th>
                <th className="px-6 py-4">Deadline</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5">
              {projects.map((project) => {
                const displayStatus = getDisplayStatus(
                  project.status,
                  project.progress
                );

                return (
                  <tr
                    key={project.id}
                    className="group transition hover:bg-white/[0.03]"
                  >
                    <td className="px-6 py-4 font-medium text-white">
                      <Link
                        href={`/projects/${project.id}`}
                        className="block transition hover:text-white/80"
                      >
                        {project.title}
                      </Link>
                    </td>

                    <td className="px-6 py-4 text-gray-300">
                      <Link
                        href={`/projects/${project.id}`}
                        className="block"
                      >
                        {project.client.name}
                      </Link>
                    </td>

                    <td className="px-6 py-4">
                      <Link
                        href={`/projects/${project.id}`}
                        className="block"
                      >
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs ${getStatusBadgeClasses(
                            displayStatus
                          )}`}
                        >
                          {displayStatus}
                        </span>
                      </Link>
                    </td>

                    <td className="px-6 py-4 text-gray-300">
                      <Link
                        href={`/projects/${project.id}`}
                        className="block"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-3">
                            <span>{project.progress}%</span>
                          </div>

                          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                            <div
                              className="h-full rounded-full bg-white/70 transition-all"
                              style={{ width: `${Math.max(0, Math.min(project.progress, 100))}%` }}
                            />
                          </div>
                        </div>
                      </Link>
                    </td>

                    <td className="px-6 py-4 text-gray-300">
                      <Link
                        href={`/projects/${project.id}`}
                        className="block"
                      >
                        {project.deadline
                          ? new Date(project.deadline).toLocaleDateString()
                          : "—"}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  );
}