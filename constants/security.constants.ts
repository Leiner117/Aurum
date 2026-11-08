export const BIOMETRIC_LOCK_STORAGE_KEY = "aurum-biometric-lock";

// Re-lock when the app returns after being in the background this long
export const BIOMETRIC_RELOCK_AFTER_MS = 30_000;

export const BIOMETRIC_PROMPT = {
  title: "Unlock Aurum",
  subtitle: "Confirm it's you",
  reason: "Unlock Aurum",
  negativeButtonText: "Cancel",
} as const;
