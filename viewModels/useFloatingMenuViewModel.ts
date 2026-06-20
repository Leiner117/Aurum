"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/constants/routes.constants";
import type { PointerEvent as ReactPointerEvent } from "react";

const BUTTON_SIZE = 48;
const EDGE_MARGIN = 8;

interface DragState {
  startX: number;
  startY: number;
  startRight: number;
  startBottom: number;
  moved: boolean;
}

export interface FloatingMenuViewModelReturn {
  isOpen: boolean;
  pos: { bottom: number; right: number };
  isDragging: boolean;
  close: () => void;
  isActive: (href: string) => boolean;
  handlePointerDown: (e: ReactPointerEvent<HTMLButtonElement>) => void;
  handlePointerMove: (e: ReactPointerEvent<HTMLButtonElement>) => void;
  handlePointerUp: (e: ReactPointerEvent<HTMLButtonElement>) => void;
}

export const useFloatingMenuViewModel = (): FloatingMenuViewModelReturn => {
  const [isOpen, setIsOpen] = useState(false);
  const [pos, setPos] = useState({ bottom: 24, right: 24 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<DragState | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const toggle = () => setIsOpen((prev) => !prev);
  const close = () => setIsOpen(false);

  const isActive = (href: string) =>
    href === ROUTES.DASHBOARD ? pathname === href : pathname.startsWith(href);

  const handlePointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startRight: pos.right,
      startBottom: pos.bottom,
      moved: false,
    };
    setIsDragging(true);
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      dragRef.current.moved = true;
    }
    if (!dragRef.current.moved) return;
    const maxRight = window.innerWidth - BUTTON_SIZE - EDGE_MARGIN;
    const maxBottom = window.innerHeight - BUTTON_SIZE - EDGE_MARGIN;
    const newRight = Math.max(EDGE_MARGIN, Math.min(maxRight, dragRef.current.startRight - dx));
    const newBottom = Math.max(EDGE_MARGIN, Math.min(maxBottom, dragRef.current.startBottom + dy));
    setPos({ right: newRight, bottom: newBottom });
  };

  const handlePointerUp = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!dragRef.current) return;
    const wasDrag = dragRef.current.moved;
    dragRef.current = null;
    setIsDragging(false);
    if (!wasDrag) toggle();
  };

  return { isOpen, pos, isDragging, close, isActive, handlePointerDown, handlePointerMove, handlePointerUp };
};
