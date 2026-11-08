import type { CapacitorConfig } from "@capacitor/cli";

// URL of the deployed Next.js app the native shell loads.
// Set CAP_SERVER_URL before `npx cap sync` (e.g. a preview deploy or a LAN dev server).
const SERVER_URL = process.env.CAP_SERVER_URL ?? "https://your-app.vercel.app";
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
      launchShowDuration: 3000,
      launchAutoHide: false,
      backgroundColor: "#0a0a0a",
      showSpinner: false,
      androidScaleType: "CENTER_CROP",
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
