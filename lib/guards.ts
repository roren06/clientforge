import { redirect } from "next/navigation";
import { getCurrentUserWithWorkspace } from "@/lib/workspace";

export async function requireWorkspaceAccess() {
  const result = await getCurrentUserWithWorkspace();

  if (!result || !result.workspace || !result.role) {
    redirect("/login");
  }

  return result;
}

export async function requireRole(allowedRoles: string[]) {
  const result = await requireWorkspaceAccess();

  if (!allowedRoles.includes(result.role ?? "")) {
    redirect("/dashboard");
  }

  return result;
}