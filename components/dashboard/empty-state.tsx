import { FolderSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title = "Nothing to show yet",
  description = "Try another GitHub username, refresh your data, or adjust your search query.",
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-4 py-14 text-center">
        <div className="rounded-2xl bg-slate-100 p-4 dark:bg-slate-900">
          <FolderSearch className="h-8 w-8 text-slate-500 dark:text-slate-400" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-lg font-semibold text-slate-950 dark:text-white">{title}</h3>
          <p className="max-w-md text-sm text-slate-500 dark:text-slate-400">{description}</p>
        </div>
        {actionLabel && onAction ? (
          <Button variant="outline" onClick={onAction}>
            {actionLabel}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
