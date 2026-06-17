"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="p-4 sm:p-6">
      <Card className="rounded-3xl border-red-400/20 bg-red-950/20 text-white">
        <CardHeader>
          <CardTitle>Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="max-w-2xl text-sm leading-6 text-red-100/80">
            The dashboard could not finish loading. Try again, and if it keeps
            happening, check the server logs for the error digest.
          </p>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-xs text-red-100/70">
            {error.digest ? `Digest: ${error.digest}` : error.message}
          </div>
          <Button type="button" onClick={reset}>
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
