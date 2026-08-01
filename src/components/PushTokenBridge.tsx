"use client";

import { useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  getCachedPushTokenRegistration,
  registerPushTokenWithServer,
  type PushTokenRegistrationPayload,
} from "@/lib/pushTokenBridge";
import { isShadyPlantApp } from "@/lib/nativeShare";

declare global {
  interface Window {
    registerShadyPlantPushToken?: (payload: unknown) => void;
  }
}

function parsePayload(payload: unknown): PushTokenRegistrationPayload | null {
  if (!payload) {
    return null;
  }

  if (typeof payload === "string") {
    try {
      return JSON.parse(payload) as PushTokenRegistrationPayload;
    } catch {
      return null;
    }
  }

  if (typeof payload === "object") {
    return payload as PushTokenRegistrationPayload;
  }

  return null;
}

export default function PushTokenBridge() {
  const { fetchWithAuth, isAuthenticated, isReady, user } = useAuth();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handlePayload = async (payload: unknown) => {
      const parsed = parsePayload(payload);

      if (!parsed?.token) {
        return;
      }

      try {
        const result = await registerPushTokenWithServer(parsed, {
          authenticated: isAuthenticated,
          linkedUserId: isAuthenticated ? user?.id : null,
          fetchWithAuth,
        });

        return result;
      } catch (error) {
        console.warn("[PushTokenBridge] Token sync failed", error);
        return null;
      }
    };

    const handleEvent = (event: Event) => {
      void handlePayload((event as CustomEvent<unknown>).detail);
    };

    const requestNativePushTokenRefresh = () => {
      const bridge = window.ShadyPlantNative;
      if (bridge?.requestPushToken) {
        bridge.requestPushToken();
      }
    };

    window.registerShadyPlantPushToken = (payload: unknown) => {
      void handlePayload(payload);
    };

    window.addEventListener("shadyplant-push-token", handleEvent as EventListener);

    if (isShadyPlantApp() && isAuthenticated) {
      requestNativePushTokenRefresh();
    }

    return () => {
      window.removeEventListener(
        "shadyplant-push-token",
        handleEvent as EventListener,
      );
      if (window.registerShadyPlantPushToken) {
        delete window.registerShadyPlantPushToken;
      }
    };
  }, [fetchWithAuth, isAuthenticated, user?.id]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const cached = getCachedPushTokenRegistration();

    if (!cached?.token) {
      return;
    }

    if (isAuthenticated && user?.id && cached.lastLinkedUserId !== user.id) {
      void registerPushTokenWithServer(cached, {
        authenticated: true,
        linkedUserId: user.id,
        fetchWithAuth,
      }).catch((error) => {
        console.warn("[PushTokenBridge] Cached token re-link failed", error);
      });
    }

    if (isShadyPlantApp() && isAuthenticated) {
      const bridge = window.ShadyPlantNative;
      bridge?.requestPushToken?.();
    }
  }, [fetchWithAuth, isAuthenticated, isReady, user?.id]);

  return null;
}
