import { CommitCard } from "@/components/cards/commit-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import type { GitHubCommit } from "@/types/dashboard";

interface RecentCommitsListProps {
  commits: GitHubCommit[];
}

export function RecentCommitsList({ commits }: RecentCommitsListProps) {
  if (!commits.length) {
    return <EmptyState title="No recent commits" description="Commit activity will appear here after the data source returns recent pushes." />;
  }

  return (
    <div className="space-y-4">
      {commits.map((commit) => (
        <CommitCard key={commit.id} commit={commit} />
      ))}
    </div>
  );
}
