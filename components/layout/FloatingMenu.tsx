"use client";

import { cn } from "@/lib/utils";
import { useFloatingMenuViewModel } from "@/viewModels/useFloatingMenuViewModel";
import { Receipt, Landmark, Target, ArrowLeftRight, Plus } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/constants/routes.constants";
import type { LucideIcon } from "lucide-react";

interface MenuItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const MENU_ITEMS: MenuItem[] = [
  { label: "Transactions", href: ROUTES.EXPENSES, icon: Receipt },
  { label: "Accounts", href: ROUTES.ACCOUNTS, icon: Landmark },
  { label: "Budgets", href: ROUTES.BUDGETS, icon: Target },
  { label: "Transfers", href: ROUTES.TRANSFERS, icon: ArrowLeftRight },
];

export const FloatingMenu = () => {
  const { isOpen, toggle, close, isActive } = useFloatingMenuViewModel();

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-30" onClick={close} aria-hidden="true" />
      )}

      <div className="fixed bottom-6 right-6 z-40">
        <div className="absolute bottom-full mb-3 right-0 flex flex-col items-end gap-3">
          {MENU_ITEMS.map((item, index) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <div
                key={item.href}
                className={cn(
                  "transition-all duration-200",
                  isOpen
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-3 pointer-events-none"
                )}
                style={{ transitionDelay: isOpen ? `${index * 60}ms` : "0ms" }}
              >
                <Link
                  href={item.href}
                  onClick={close}
                  className={cn(
                    "flex items-center gap-2.5 rounded-full py-2.5 pl-3 pr-5 text-sm font-medium shadow-lg transition-colors whitespace-nowrap",
                    active
                      ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                      : "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)] hover:bg-[var(--color-primary)] hover:text-[var(--color-primary-foreground)] hover:border-transparent"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              </div>
            );
          })}
        </div>

        <button
          onClick={toggle}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-xl transition-all duration-200 hover:bg-[var(--color-primary-hover)] hover:scale-105 active:scale-95"
        >
          <Plus
            className={cn(
              "h-5 w-5 transition-transform duration-300",
              isOpen && "rotate-45"
            )}
          />
        </button>
      </div>
    </>
  );
};
