import { Building2, ExternalLink, MapPin, Users } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";
import type { GitHubProfile } from "@/types/dashboard";

interface ProfileCardProps {
  profile: GitHubProfile;
}

export function ProfileCard({ profile }: ProfileCardProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div className="flex items-start gap-4">
          <Avatar src={profile.avatarUrl} alt={profile.name || profile.login} className="h-16 w-16 rounded-2xl" />
          <div className="space-y-1">
            <CardTitle className="text-xl">{profile.name}</CardTitle>
            <CardDescription>@{profile.login}</CardDescription>
            {profile.bio ? <p className="max-w-xl text-sm text-slate-600 dark:text-slate-300">{profile.bio}</p> : null}
          </div>
        </div>
        <Button asChild variant="outline">
          <a href={profile.htmlUrl} target="_blank" rel="noreferrer">
            <ExternalLink className="h-4 w-4" />
            GitHub
          </a>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {profile.location ? (
            <Badge variant="secondary">
              <MapPin className="mr-1 h-3.5 w-3.5" />
              {profile.location}
            </Badge>
          ) : null}
          {profile.company ? (
            <Badge variant="secondary">
              <Building2 className="mr-1 h-3.5 w-3.5" />
              {profile.company}
            </Badge>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Followers</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">{formatNumber(profile.followers)}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Following</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">{formatNumber(profile.following)}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Public repos</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">{formatNumber(profile.publicRepos)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Users className="h-4 w-4" />
          Growing an open-source footprint with consistent public work.
        </div>
      </CardContent>
    </Card>
  );
}
