"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { App } from "@capacitor/app";
import { isNativePlatform } from "@/lib/native/platform";
import { readStorage } from "@/lib/native/storage";
import { isUnlockedThisSession, markUnlocked, resetUnlocked, verifyBiometric } from "@/lib/native/biometric";
import { BIOMETRIC_LOCK_STORAGE_KEY, BIOMETRIC_RELOCK_AFTER_MS } from "@/constants/security.constants";

export interface BiometricLockViewModelReturn {
  isLocked: boolean;
  isVerifying: boolean;
  unlock: () => Promise<void>;
}

const isLockEnabled = () => isNativePlatform() && readStorage(BIOMETRIC_LOCK_STORAGE_KEY, false);

export const useBiometricLockViewModel = (): BiometricLockViewModelReturn => {
  const [isLocked, setIsLocked] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const backgroundedAt = useRef<number | null>(null);

  const unlock = useCallback(async () => {
    setIsVerifying(true);
    const ok = await verifyBiometric();
    setIsVerifying(false);
    if (ok) {
      markUnlocked();
      setIsLocked(false);
    }
  }, []);

  // Cold start with a saved session → lock until verified
  useEffect(() => {
    if (!isLockEnabled() || isUnlockedThisSession()) return;
    setIsLocked(true);
    unlock();
  }, [unlock]);

  // Coming back from the background after a while → lock again
  useEffect(() => {
    if (!isNativePlatform()) return;
    const listener = App.addListener("appStateChange", ({ isActive }) => {
      if (!isActive) {
        backgroundedAt.current = Date.now();
        return;
      }
      const away = backgroundedAt.current ? Date.now() - backgroundedAt.current : 0;
      backgroundedAt.current = null;
      if (isLockEnabled() && away >= BIOMETRIC_RELOCK_AFTER_MS) {
        resetUnlocked();
        setIsLocked(true);
        unlock();
      }
    });
    return () => {
      listener.then((handle) => handle.remove());
    };
  }, [unlock]);

  return { isLocked, isVerifying, unlock };
};
