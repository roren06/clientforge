import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="space-y-3">
        <Skeleton className="h-8 w-56 bg-white/10" />
        <Skeleton className="h-4 w-full max-w-xl bg-white/10" />
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton
            key={index}
            className="h-32 rounded-3xl border border-white/10 bg-white/[0.05]"
          />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Skeleton className="h-80 rounded-3xl border border-white/10 bg-white/[0.05] xl:col-span-2" />
        <Skeleton className="h-80 rounded-3xl border border-white/10 bg-white/[0.05]" />
      </section>
    </div>
  );
}
