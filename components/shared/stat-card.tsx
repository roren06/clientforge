import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <Card className="rounded-3xl border-white/10 bg-white/[0.03] text-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-400">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold tracking-tight">{value}</div>
        <p className="mt-2 text-xs text-gray-400">{helper}</p>
      </CardContent>
    </Card>
  );
}