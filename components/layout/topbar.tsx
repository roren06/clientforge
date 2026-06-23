"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Search, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { NotificationBell } from "@/components/notifications/notification-bell";

type WorkspaceInfo = {
  workspace: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
  } | null;
  role: string | null;
};

type SearchResult = {
  id: string;
  type: string;
  title: string;
  description: string;
  href: string;
};

export function Topbar() {
  const { data: session } = useSession();

  const [workspaceInfo, setWorkspaceInfo] = useState<WorkspaceInfo | null>(null);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

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
  }, [session, workspaceInfo]);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        setSearching(true);
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(trimmedQuery)}`,
          {
            signal: controller.signal,
          }
        );

        if (!res.ok) {
          setSearchResults([]);
          return;
        }

        const data = (await res.json()) as { results?: SearchResult[] };
        setSearchResults(data.results ?? []);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        console.error("Failed to search workspace:", error);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [query]);

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-black/10 backdrop-blur-xl">
      <div className="flex h-20 items-center justify-between gap-4 px-4 sm:px-6">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            name="workspace-search"
            autoComplete="off"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => {
              window.setTimeout(() => setSearchOpen(false), 150);
            }}
            placeholder="Search clients, projects, updates..."
            className="h-11 rounded-2xl border-white/10 bg-white/5 pl-11 text-sm text-white placeholder:text-gray-400"
          />

          {searchOpen && query.trim().length >= 2 ? (
            <div className="absolute left-0 right-0 top-[3.25rem] z-50 overflow-hidden rounded-2xl border border-white/10 bg-[#080b14] shadow-2xl shadow-black/40">
              <div className="border-b border-white/10 px-4 py-3 text-xs uppercase tracking-[0.2em] text-gray-500">
                {searching ? "Searching..." : "Search results"}
              </div>

              {searchResults.length > 0 ? (
                <div className="max-h-96 overflow-y-auto p-2">
                  {searchResults.map((result) => (
                    <Link
                      key={`${result.type}-${result.id}`}
                      href={result.href}
                      onClick={() => {
                        setQuery("");
                        setSearchOpen(false);
                      }}
                      className="block rounded-xl px-3 py-3 hover:bg-white/[0.06]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-white">
                          {result.title}
                        </p>
                        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-cyan-200">
                          {result.type}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs text-gray-400">
                        {result.description}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-6 text-sm text-gray-400">
                  {searching ? "Looking through your workspace..." : "No matches found."}
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white sm:flex">
            <Sparkles className="h-3.5 w-3.5" />
            AI workspace ready
          </div>

          <NotificationBell />

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