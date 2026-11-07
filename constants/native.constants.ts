import { ROUTES } from "@/constants/routes.constants";

// Routes where the Android back button closes the app instead of navigating back
export const NATIVE_EXIT_ROUTES: string[] = [ROUTES.DASHBOARD, ROUTES.LOGIN, ROUTES.REGISTER];

export const SPLASH_FADE_OUT_MS = 250;

export const OFFLINE_BANNER_MESSAGE = "You're offline — changes won't be saved until you reconnect.";
