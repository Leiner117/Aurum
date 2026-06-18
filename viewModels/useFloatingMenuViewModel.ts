"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/constants/routes.constants";

export interface FloatingMenuViewModelReturn {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
  isActive: (href: string) => boolean;
}

export const useFloatingMenuViewModel = (): FloatingMenuViewModelReturn => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const toggle = () => setIsOpen((prev) => !prev);
  const close = () => setIsOpen(false);

  const isActive = (href: string) =>
    href === ROUTES.DASHBOARD ? pathname === href : pathname.startsWith(href);

  return { isOpen, toggle, close, isActive };
};
