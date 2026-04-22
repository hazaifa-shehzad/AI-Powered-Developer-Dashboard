import { ExternalLink, GitFork, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatRelativeTime, getLanguageColor } from "@/lib/utils";
import type { GitHubRepo } from "@/types/dashboard";

interface RepoCardProps {
  repo: GitHubRepo;
}

export function RepoCard({ repo }: RepoCardProps) {
  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col gap-4 p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-950 dark:text-white">{repo.name}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{repo.description || "No description provided."}</p>
          </div>
          <Button asChild variant="ghost" size="icon">
            <a href={repo.htmlUrl} target="_blank" rel="noreferrer" aria-label={`Open ${repo.name}`}>
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {repo.language ? (
            <Badge variant="secondary">
              <span className={`mr-2 inline-block h-2.5 w-2.5 rounded-full ${getLanguageColor(repo.language)}`} />
              {repo.language}
            </Badge>
          ) : null}
          {repo.topics?.slice(0, 2).map((topic) => (
            <Badge key={topic} variant="outline">
              {topic}
            </Badge>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between gap-4 text-sm text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1">
              <Star className="h-4 w-4" />
              {repo.stars}
            </span>
            <span className="inline-flex items-center gap-1">
              <GitFork className="h-4 w-4" />
              {repo.forks}
            </span>
          </div>
          <span>Updated {formatRelativeTime(repo.updatedAt)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
