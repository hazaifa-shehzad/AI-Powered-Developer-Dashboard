"use client";

import { Bell, ExternalLink, Menu } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { SearchBar } from "@/components/dashboard/search-bar";
import { ExportDashboardButton } from "@/components/dashboard/export-dashboard-button";
import type { GitHubProfile } from "@/types/dashboard";

interface DashboardHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  profile?: Pick<GitHubProfile, "name" | "login" | "avatarUrl">;
  onOpenMobileSidebar?: () => void;
}

export function DashboardHeader({ search, onSearchChange, profile, onOpenMobileSidebar }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 px-4 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/70 sm:px-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3 xl:flex-1">
          <Button variant="outline" size="icon" className="lg:hidden" onClick={onOpenMobileSidebar}>
            <Menu className="h-4 w-4" />
          </Button>
          <SearchBar value={search} onChange={onSearchChange} className="xl:max-w-2xl" />
        </div>

        <div className="flex items-center justify-between gap-3 xl:justify-end">
          <div className="flex items-center gap-2">
            <ExportDashboardButton />
            <ThemeToggle />
            <Button variant="outline" size="icon" className="rounded-full">
              <Bell className="h-4 w-4" />
            </Button>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900">
                <Avatar src={profile?.avatarUrl} alt={profile?.name ?? profile?.login ?? "User"} className="h-9 w-9" />
                <div className="hidden text-left sm:block">
                  <p className="text-sm font-medium text-slate-950 dark:text-white">{profile?.name ?? "Developer"}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">@{profile?.login ?? "github"}</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Account</DropdownMenuLabel>
              <DropdownMenuItem>
                <ExternalLink className="h-4 w-4" />
                View GitHub profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
