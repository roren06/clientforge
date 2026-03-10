import { Search, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

export function Topbar() {
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

          <Avatar className="h-10 w-10 border border-white/10">
            <AvatarFallback className="bg-white/10 text-white">
              LJ
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}