"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { X } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { Button } from "@/components/ui/button";
import type { GitHubProfile } from "@/types/dashboard";

interface DashboardLayoutProps {
  children: ReactNode;
  search: string;
  onSearchChange: (value: string) => void;
  profile?: Pick<GitHubProfile, "name" | "login" | "avatarUrl">;
}

export function DashboardLayout({ children, search, onSearchChange, profile }: DashboardLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="flex min-h-screen">
        <DashboardSidebar />

        {mobileSidebarOpen ? (
          <div className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden" onClick={() => setMobileSidebarOpen(false)}>
            <div className="absolute inset-y-0 left-0" onClick={(event) => event.stopPropagation()}>
              <div className="relative">
                <DashboardSidebar mobile />
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-3 top-3 lg:hidden"
                  onClick={() => setMobileSidebarOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <DashboardHeader
            search={search}
            onSearchChange={onSearchChange}
            profile={profile}
            onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          />
          <main id="dashboard-root" className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
