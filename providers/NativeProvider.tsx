"use client";

import { OfflineBanner } from "@/components/layout/OfflineBanner";
import { useNativeShellViewModel } from "@/viewModels/useNativeShellViewModel";

// Wires native shell behavior (splash, system bars, back button). Inert on the web.
export const NativeProvider = ({ children }: { children: React.ReactNode }) => {
  useNativeShellViewModel();

  return (
    <>
      <OfflineBanner />
      {children}
    </>
  );
};
