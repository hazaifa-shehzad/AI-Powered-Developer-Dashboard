import { RepoCard } from "@/components/cards/repo-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import type { GitHubRepo } from "@/types/dashboard";

interface RepoListProps {
  repos: GitHubRepo[];
}

export function RepoList({ repos }: RepoListProps) {
  if (!repos.length) {
    return <EmptyState title="No repositories found" description="This developer does not have public repositories matching the current filter." />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {repos.map((repo) => (
        <RepoCard key={repo.id} repo={repo} />
      ))}
    </div>
  );
}
