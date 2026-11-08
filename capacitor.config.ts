import type { CapacitorConfig } from "@capacitor/cli";

// URL of the deployed Next.js app the native shell loads.
// Set CAP_SERVER_URL before `npx cap sync` (e.g. a preview deploy or a LAN dev server).
// `||` so an empty CI variable falls back to production
const SERVER_URL = process.env.CAP_SERVER_URL || "https://aurum.leineralvarado.dev";
const isHttp = SERVER_URL.startsWith("http://");

const config: CapacitorConfig = {
  appId: "com.aurum.finance",
  appName: "Aurum",
  webDir: "native-shell",
  backgroundColor: "#0a0a0a",
  server: {
    url: SERVER_URL,
    cleartext: isHttp,
    // Bundled page shown when the remote app can't be loaded (no network)
    errorPath: "offline.html",
    allowNavigation: [new URL(SERVER_URL).hostname],
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      // Auto-hides as a safety net (e.g. a web deploy without NativeProvider);
      // the web app hides it sooner once mounted
      launchShowDuration: 2500,
      launchAutoHide: true,
      backgroundColor: "#0a0a0a",
      showSpinner: false,
      androidScaleType: "CENTER_CROP",
    },
    Keyboard: {
      // Edge-to-edge webview: let the plugin shrink the viewport when the keyboard opens
      resizeOnFullScreen: true,
    },
    LocalNotifications: {
      smallIcon: "ic_stat_notification",
      iconColor: "#f59e0b",
    },
    SystemBars: {
      // Edge-to-edge webview; the layout pads itself with env(safe-area-inset-*)
      insetsHandling: "css",
      initialViewportFitValueHint: "cover",
      style: "DARK",
    },
  },
};

export default config;
