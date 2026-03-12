"use client";

import { useSession, signOut } from "next-auth/react";
import { Search, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";

type WorkspaceInfo = {
  workspace: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
  } | null;
  role: string | null;
};

export function Topbar() {
  const { data: session } = useSession();

  const [workspaceInfo, setWorkspaceInfo] = useState<WorkspaceInfo | null>(null);

useEffect(() => {
  async function loadWorkspaceInfo() {
    try {
      const res = await fetch("/api/me/workspace");

      if (!res.ok) return;

      const data = await res.json();
      setWorkspaceInfo({
        workspace: data.workspace,
        role: data.role,
      });
    } catch (error) {
      console.error("Failed to load workspace info:", error);
    }
  }

  if (session?.user && !workspaceInfo) {
  loadWorkspaceInfo();
}
}, [session]);

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-black/10 backdrop-blur-xl">
      <div className="flex h-20 items-center justify-between gap-4 px-4 sm:px-6">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search clients, projects, updates..."
            className="h-11 rounded-2xl border-white/10 bg-white/5 pl-11 text-sm text-white placeholder:text-gray-400"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white sm:flex">
            <Sparkles className="h-3.5 w-3.5" />
            AI workspace ready
          </div>

          <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-white">
              {session?.user?.name}
            </p>
            <p className="text-xs text-gray-400">
              {session?.user?.email}
            </p>
            {workspaceInfo?.workspace && workspaceInfo?.role ? (
              <p className="mt-1 text-[11px] uppercase tracking-wide text-gray-500">
                {workspaceInfo.workspace.name} · {workspaceInfo.role}
              </p>
            ) : null}
          </div>

          <Avatar className="h-10 w-10 border border-white/10">
            <AvatarFallback className="bg-white/10 text-white">
              {session?.user?.name?.charAt(0) ?? "U"}
            </AvatarFallback>
          </Avatar>

          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white hover:bg-white/10"
          >
            Logout
          </button>
        </div>
        </div>
      </div>
    </header>
  );
}