import { GitCommitHorizontal } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/utils";
import type { GitHubCommit } from "@/types/dashboard";

interface CommitCardProps {
  commit: GitHubCommit;
}

export function CommitCard({ commit }: CommitCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start gap-4 p-5">
        <div className="rounded-2xl bg-slate-100 p-3 text-slate-700 dark:bg-slate-900 dark:text-slate-200">
          <GitCommitHorizontal className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h3 className="truncate text-sm font-semibold text-slate-950 dark:text-white">{commit.message}</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{commit.repoName}</p>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Avatar src={commit.authorAvatar} alt={commit.authorName} className="h-9 w-9" />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{commit.authorName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{formatRelativeTime(commit.committedAt)}</p>
              </div>
            </div>
            <Button asChild variant="ghost" size="sm">
              <a href={commit.htmlUrl} target="_blank" rel="noreferrer">
                {commit.sha.slice(0, 7)}
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
