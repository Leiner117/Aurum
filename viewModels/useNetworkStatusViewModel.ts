"use client";

import { useEffect, useState } from "react";
import { Network } from "@capacitor/network";

export interface NetworkStatusViewModelReturn {
  isOnline: boolean;
}

// Uses the native connectivity API in the app and navigator.onLine on the web
export const useNetworkStatusViewModel = (): NetworkStatusViewModelReturn => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    let isMounted = true;
    Network.getStatus().then((status) => {
      if (isMounted) setIsOnline(status.connected);
    });
    const listener = Network.addListener("networkStatusChange", (status) => {
      setIsOnline(status.connected);
    });
    return () => {
      isMounted = false;
      listener.then((handle) => handle.remove());
    };
  }, []);

  return { isOnline };
};
