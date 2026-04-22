import { BookOpen, GitBranchPlus, Star, Users } from "lucide-react";
import { ContributionCard } from "@/components/cards/contribution-card";
import { ProfileCard } from "@/components/cards/profile-card";
import { StatsCard } from "@/components/cards/stats-card";
import type { ContributionSummary, GitHubProfile, GitHubRepo } from "@/types/dashboard";

interface GitHubOverviewProps {
  profile: GitHubProfile;
  repos: GitHubRepo[];
  summary: ContributionSummary;
}

export function GitHubOverview({ profile, repos, summary }: GitHubOverviewProps) {
  const totalStars = repos.reduce((sum, repo) => sum + repo.stars, 0);
  const totalForks = repos.reduce((sum, repo) => sum + repo.forks, 0);

  return (
    <div className="space-y-6">
      <ProfileCard profile={profile} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard metric={{ label: "Public repositories", value: profile.publicRepos, helperText: "Across active projects" }} icon={<BookOpen className="h-5 w-5" />} />
        <StatsCard metric={{ label: "Followers", value: profile.followers, helperText: "Audience growth", trend: "up", change: 12 }} icon={<Users className="h-5 w-5" />} />
        <StatsCard metric={{ label: "Total stars", value: totalStars, helperText: "Open-source validation", trend: "up", change: 18 }} icon={<Star className="h-5 w-5" />} />
        <StatsCard metric={{ label: "Total forks", value: totalForks, helperText: "Community reuse", trend: "up", change: 7 }} icon={<GitBranchPlus className="h-5 w-5" />} />
      </div>

      <ContributionCard summary={summary} />
    </div>
  );
}
