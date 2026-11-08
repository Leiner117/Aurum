"use client";

import Image from "next/image";
import { Fingerprint } from "lucide-react";
import { App } from "@capacitor/app";
import { Button } from "@/components/ui/Button";
import { useBackHandler } from "@/lib/native/back-button";
import { useBiometricLockViewModel } from "@/viewModels/useBiometricLockViewModel";

// Covers the app until the user verifies with fingerprint/face/device PIN
export const BiometricLockScreen = () => {
  const { isLocked, isVerifying, unlock } = useBiometricLockViewModel();

  // Back while locked sends the app to the background instead of revealing content
  useBackHandler(isLocked, () => {
    App.minimizeApp().catch(() => undefined);
  });

  if (!isLocked) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-[var(--color-background)] px-6">
      <Image src="/icon-192.png" alt="Aurum" width={72} height={72} className="rounded-2xl" />
      <div className="text-center">
        <h1 className="text-lg font-semibold text-[var(--color-foreground)]">Aurum is locked</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">Verify it&apos;s you to continue.</p>
      </div>
      <Button onClick={unlock} isLoading={isVerifying}>
        <Fingerprint className="h-4 w-4" />
        Unlock
      </Button>
    </div>
  );
};
