"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SystemBars, SystemBarsStyle } from "@capacitor/core";
import { App } from "@capacitor/app";
import { SplashScreen } from "@capacitor/splash-screen";
import { useTheme } from "@/providers/ThemeProvider";
import { isNativePlatform } from "@/lib/native/platform";
import { runTopBackHandler } from "@/lib/native/back-button";
import { NATIVE_EXIT_ROUTES, SPLASH_FADE_OUT_MS } from "@/constants/native.constants";

export interface NativeShellViewModelReturn {
  isNative: boolean;
}

export const useNativeShellViewModel = (): NativeShellViewModelReturn => {
  const router = useRouter();
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const pathnameRef = useRef(pathname);
  const isNative = isNativePlatform();

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  // The splash stays up (launchAutoHide: false) until the web app has mounted
  useEffect(() => {
    if (!isNative) return;
    SplashScreen.hide({ fadeOutDuration: SPLASH_FADE_OUT_MS });
  }, [isNative]);

  // Status/navigation bar icons follow the app theme (content is drawn edge-to-edge)
  useEffect(() => {
    if (!isNative) return;
    SystemBars.setStyle({
      style: resolvedTheme === "dark" ? SystemBarsStyle.Dark : SystemBarsStyle.Light,
    });
  }, [isNative, resolvedTheme]);

  // Android back: close the top overlay → navigate back → exit on root screens
  useEffect(() => {
    if (!isNative) return;
    const listener = App.addListener("backButton", ({ canGoBack }) => {
      if (runTopBackHandler()) return;
      if (!canGoBack || NATIVE_EXIT_ROUTES.includes(pathnameRef.current)) {
        App.exitApp();
        return;
      }
      router.back();
    });
    return () => {
      listener.then((handle) => handle.remove());
    };
  }, [isNative, router]);

  return { isNative };
};
