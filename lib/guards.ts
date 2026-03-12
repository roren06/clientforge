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
    if (result.role === "CLIENT") {
      redirect("/portal");
    }

    redirect("/dashboard");
  }

  return result;
}

export async function requireInternalAccess() {
  return requireRole(["OWNER", "ADMIN", "MEMBER"]);
}

export async function requireClientAccess() {
  return requireRole(["CLIENT"]);
}