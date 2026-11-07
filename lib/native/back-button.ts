"use client";

import { useEffect, useRef } from "react";

type BackHandler = () => void;

// Stack of overlays (modals, drawers) that should close on the Android back button.
// The most recently opened overlay is closed first.
const handlers: BackHandler[] = [];

export const pushBackHandler = (handler: BackHandler): (() => void) => {
  handlers.push(handler);
  return () => {
    const index = handlers.lastIndexOf(handler);
    if (index >= 0) handlers.splice(index, 1);
  };
};

// Runs the top handler. Returns false when no overlay is open.
export const runTopBackHandler = (): boolean => {
  const handler = handlers[handlers.length - 1];
  if (!handler) return false;
  handler();
  return true;
};

// Registers `onBack` while `isActive` is true. No-op on the web (nothing consumes it).
export const useBackHandler = (isActive: boolean, onBack: BackHandler): void => {
  const onBackRef = useRef(onBack);

  useEffect(() => {
    onBackRef.current = onBack;
  }, [onBack]);

  useEffect(() => {
    if (!isActive) return;
    return pushBackHandler(() => onBackRef.current());
  }, [isActive]);
};
