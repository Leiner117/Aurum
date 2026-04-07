"use client";

import { useRealtimeSyncViewModel } from "@/viewModels/useRealtimeSyncViewModel";

export function RealtimeSyncProvider({ children }: { children: React.ReactNode }) {
  useRealtimeSyncViewModel();
  return <>{children}</>;
}
