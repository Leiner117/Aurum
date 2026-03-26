"use client";

import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes.constants";
import {
  LayoutDashboard,
  Receipt,
  Tag,
  Target,
  BarChart3,
  RefreshCw,
  Settings,
  Landmark,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: ROUTES.DASHBOARD, icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "Accounts", href: ROUTES.ACCOUNTS, icon: <Landmark className="h-4 w-4" /> },
  { label: "Expenses", href: ROUTES.EXPENSES, icon: <Receipt className="h-4 w-4" /> },
  { label: "Categories", href: ROUTES.CATEGORIES, icon: <Tag className="h-4 w-4" /> },
  { label: "Budgets", href: ROUTES.BUDGETS, icon: <Target className="h-4 w-4" /> },
  { label: "Reports", href: ROUTES.REPORTS, icon: <BarChart3 className="h-4 w-4" /> },
  { label: "Recurring", href: ROUTES.RECURRING, icon: <RefreshCw className="h-4 w-4" /> },
  { label: "Settings", href: ROUTES.SETTINGS, icon: <Settings className="h-4 w-4" /> },
];

export const Sidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface)] min-h-screen">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 px-4 border-b border-[var(--color-border)]">
        <Image src="/logo.png" alt="Aurum" width={28} height={28} className="shrink-0" />
        <span className="font-semibold tracking-wide text-[var(--color-foreground)]">Aurum</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === ROUTES.DASHBOARD
              ? pathname === item.href
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                  : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-foreground)]"
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
