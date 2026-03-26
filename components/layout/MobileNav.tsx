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
  Menu,
  X,
  Landmark,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";

const NAV_ITEMS = [
  { label: "Dashboard", href: ROUTES.DASHBOARD, icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "Accounts", href: ROUTES.ACCOUNTS, icon: <Landmark className="h-4 w-4" /> },
  { label: "Expenses", href: ROUTES.EXPENSES, icon: <Receipt className="h-4 w-4" /> },
  { label: "Categories", href: ROUTES.CATEGORIES, icon: <Tag className="h-4 w-4" /> },
  { label: "Budgets", href: ROUTES.BUDGETS, icon: <Target className="h-4 w-4" /> },
  { label: "Reports", href: ROUTES.REPORTS, icon: <BarChart3 className="h-4 w-4" /> },
  { label: "Recurring", href: ROUTES.RECURRING, icon: <RefreshCw className="h-4 w-4" /> },
  { label: "Settings", href: ROUTES.SETTINGS, icon: <Settings className="h-4 w-4" /> },
];

export const MobileNav = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex lg:hidden items-center justify-center h-8 w-8 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors"
        aria-label="Open menu"
      >
        <Menu className="h-4 w-4 text-[var(--color-foreground)]" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer */}
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-[var(--color-surface)] flex flex-col shadow-xl">
            <div className="flex h-14 items-center justify-between px-4 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2.5">
                <Image src="/logo.png" alt="Aurum" width={28} height={28} className="shrink-0" />
                <span className="font-semibold tracking-wide text-[var(--color-foreground)]">Aurum</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 hover:bg-[var(--color-surface-hover)] transition-colors"
              >
                <X className="h-4 w-4 text-[var(--color-muted-foreground)]" />
              </button>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
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
          </div>
        </div>
      )}
    </>
  );
};
