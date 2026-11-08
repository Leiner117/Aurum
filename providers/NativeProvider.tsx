"use client";

import { OfflineBanner } from "@/components/layout/OfflineBanner";
import { useNativeShellViewModel } from "@/viewModels/useNativeShellViewModel";
import { useDeepLinksViewModel } from "@/viewModels/useDeepLinksViewModel";

// Wires native shell behavior (splash, system bars, back button, deep links). Inert on the web.
export const NativeProvider = ({ children }: { children: React.ReactNode }) => {
  useNativeShellViewModel();
  useDeepLinksViewModel();

  return (
    <>
      <OfflineBanner />
      {children}
    </>
  );
};
