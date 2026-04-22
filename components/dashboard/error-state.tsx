import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load the dashboard data. Please try again.",
  onRetry,
}: ErrorStateProps) {
  return (
    <Card className="border-rose-200/70 dark:border-rose-500/20">
      <CardContent className="flex flex-col items-center justify-center gap-4 py-14 text-center">
        <div className="rounded-2xl bg-rose-100 p-4 dark:bg-rose-500/15">
          <AlertTriangle className="h-8 w-8 text-rose-600 dark:text-rose-300" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-lg font-semibold text-slate-950 dark:text-white">{title}</h3>
          <p className="max-w-md text-sm text-slate-500 dark:text-slate-400">{description}</p>
        </div>
        {onRetry ? (
          <Button onClick={onRetry}>
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
