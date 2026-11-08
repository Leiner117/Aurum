"use client";

import { useCallback, useEffect, useState } from "react";
import { useIsNative } from "@/lib/native/use-is-native";
import { readStorage, writeStorage } from "@/lib/native/storage";
import { isBiometricAvailable, markUnlocked, verifyBiometric } from "@/lib/native/biometric";
import { BIOMETRIC_LOCK_STORAGE_KEY } from "@/constants/security.constants";

export interface SecuritySettingsViewModelReturn {
  isNative: boolean;
  isAvailable: boolean;
  isLockEnabled: boolean;
  toggleLock: () => Promise<boolean>;
}

export const useSecuritySettingsViewModel = (): SecuritySettingsViewModelReturn => {
  const isNative = useIsNative();
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLockEnabled, setIsLockEnabled] = useState(false);

  useEffect(() => {
    if (!isNative) return;
    isBiometricAvailable().then(setIsAvailable);
    setIsLockEnabled(readStorage(BIOMETRIC_LOCK_STORAGE_KEY, false));
  }, [isNative]);

  // Turning the lock on or off requires a successful verification first
  const toggleLock = useCallback(async () => {
    if (!(await verifyBiometric())) return false;
    const next = !isLockEnabled;
    writeStorage(BIOMETRIC_LOCK_STORAGE_KEY, next);
    if (next) markUnlocked();
    setIsLockEnabled(next);
    return true;
  }, [isLockEnabled]);

  return { isNative, isAvailable, isLockEnabled, toggleLock };
};
