"use client";

import { useEffect, useState } from "react";
import { isNativePlatform } from "@/lib/native/platform";

// Hydration-safe: always false on the server render, resolved after mount
export const useIsNative = (): boolean => {
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    setIsNative(isNativePlatform());
  }, []);

  return isNative;
};
