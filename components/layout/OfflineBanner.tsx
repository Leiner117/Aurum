"use client";

import { WifiOff } from "lucide-react";
import { useNetworkStatusViewModel } from "@/viewModels/useNetworkStatusViewModel";
import { OFFLINE_BANNER_MESSAGE } from "@/constants/native.constants";

export const OfflineBanner = () => {
  const { isOnline } = useNetworkStatusViewModel();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 top-[env(safe-area-inset-top)] z-[60] flex items-center justify-center gap-2 bg-amber-500 px-4 py-1.5 text-xs font-medium text-black"
    >
      <WifiOff className="h-3.5 w-3.5 shrink-0" />
      <span>{OFFLINE_BANNER_MESSAGE}</span>
    </div>
  );
};
