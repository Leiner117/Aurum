import { NativeBiometric } from "@capgo/capacitor-native-biometric";
import { isNativePlatform } from "@/lib/native/platform";
import { BIOMETRIC_PROMPT } from "@/constants/security.constants";

// The app was unlocked (or the password was just entered) during this app session.
// Module state resets when the app is cold-started, which forces a new unlock.
let unlockedThisSession = false;

export const markUnlocked = (): void => {
  unlockedThisSession = true;
};

export const resetUnlocked = (): void => {
  unlockedThisSession = false;
};

export const isUnlockedThisSession = (): boolean => unlockedThisSession;

// Fingerprint/face, or the device PIN/pattern as a fallback
export const isBiometricAvailable = async (): Promise<boolean> => {
  if (!isNativePlatform()) return false;
  try {
    const result = await NativeBiometric.isAvailable({ useFallback: true });
    return result.isAvailable;
  } catch {
    return false;
  }
};

export const verifyBiometric = async (): Promise<boolean> => {
  try {
    await NativeBiometric.verifyIdentity({ ...BIOMETRIC_PROMPT, useFallback: true, maxAttempts: 5 });
    return true;
  } catch {
    return false;
  }
};
