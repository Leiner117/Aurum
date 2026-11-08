"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { App } from "@capacitor/app";
import { isNativePlatform } from "@/lib/native/platform";
import { ROUTES } from "@/constants/routes.constants";
import { APP_URL_SCHEME } from "@/constants/native.constants";

const KNOWN_ROUTES = new Set<string>(Object.values(ROUTES));

// aurum://expenses?new=expense → /expenses?new=expense (only known app routes)
export const toAppPath = (rawUrl: string): string | null => {
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== APP_URL_SCHEME) return null;
    const path = `/${url.host}${url.pathname}`.replace(/\/+$/, "") || ROUTES.DASHBOARD;
    return KNOWN_ROUTES.has(path) ? `${path}${url.search}` : null;
  } catch {
    return null;
  }
};

export const useDeepLinksViewModel = (): void => {
  const router = useRouter();

  useEffect(() => {
    if (!isNativePlatform()) return;

    const open = (rawUrl: string | undefined) => {
      const path = rawUrl ? toAppPath(rawUrl) : null;
      if (path) router.push(path);
    };

    // Cold start from a shortcut, then links while the app is running
    App.getLaunchUrl().then((launch) => open(launch?.url)).catch(() => undefined);
    const listener = App.addListener("appUrlOpen", ({ url }) => open(url));
    return () => {
      listener.then((handle) => handle.remove());
    };
  }, [router]);
};
