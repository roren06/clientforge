import { PageShell } from "@/components/layout/page-shell";
import Link from "next/link";

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

async function getProjects(): Promise<{ projects: Project[] }> {
  const res = await fetch("http://localhost:3000/api/projects", {
    cache: "no-store",
  });

  return res.json();
}

export default async function ProjectsPage() {
  const { projects } = await getProjects();

  return (
    <PageShell
      title="Projects"
      description="Track client projects across your workspace."
    >
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
            {projects.map((project) => (
              <tr key={project.id}>
                <td className="px-6 py-4 font-medium text-white">
                <Link
                    href={`/projects/${project.id}`}
                    className="transition hover:text-white/80 underline-offset-4 hover:underline"
                >
                    {project.title}
                </Link>
                </td>

                <td className="px-6 py-4 text-gray-300">
                  {project.client.name}
                </td>

                <td className="px-6 py-4">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300">
                    {project.status}
                  </span>
                </td>

                <td className="px-6 py-4 text-gray-300">
                  {project.progress}%
                </td>

                <td className="px-6 py-4 text-gray-300">
                  {project.deadline
                    ? new Date(project.deadline).toLocaleDateString()
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}