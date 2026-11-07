import { Capacitor } from "@capacitor/core";

// True only inside the Android/iOS shell; always false on the web build
export const isNativePlatform = (): boolean => Capacitor.isNativePlatform();

export const getPlatform = (): "android" | "ios" | "web" =>
  Capacitor.getPlatform() as "android" | "ios" | "web";
