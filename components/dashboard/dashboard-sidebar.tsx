"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookMarked,
  Bot,
  CloudSun,
  FolderGit2,
  GitCommitHorizontal,
  Home,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/", label: "Overview", icon: Home },
  { href: "/repositories", label: "Repositories", icon: FolderGit2 },
  { href: "/commits", label: "Recent Commits", icon: GitCommitHorizontal },
  { href: "/contributions", label: "Contributions", icon: BarChart3 },
  { href: "/weather", label: "Weather", icon: CloudSun },
  { href: "/quotes", label: "Quote", icon: BookMarked },
  { href: "/tips", label: "AI Tip", icon: Bot },
];

interface DashboardSidebarProps {
  mobile?: boolean;
}

export function DashboardSidebar({ mobile = false }: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "h-screen w-72 shrink-0 border-r border-slate-200 bg-white/90 px-5 py-6 backdrop-blur dark:border-slate-800 dark:bg-slate-950/85",
        mobile ? "flex flex-col" : "hidden lg:flex lg:flex-col",
      )}
    >
      <div className="flex items-center gap-3 px-2">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white dark:bg-white dark:text-slate-950">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">AI-Powered</p>
          <h1 className="text-lg font-semibold text-slate-950 dark:text-white">Developer Dashboard</h1>
        </div>
      </div>

      <nav className="mt-8 flex-1 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
                active
                  ? "bg-slate-950 text-white shadow-sm dark:bg-white dark:text-slate-950"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Focus</p>
        <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
          Track your GitHub activity, coding rhythm, and personal insights in one calm workspace.
        </p>
      </div>
    </aside>
  );
}
