"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { ApiResponse } from "@/lib/api";

type ChatbaseTokenResponse = ApiResponse<{
  token: string;
}>;

declare global {
  interface Window {
    chatbase?: ((...args: unknown[]) => void) & {
      q?: Array<unknown[]>;
    };
  }
}

type ChatbaseShim = ((...args: unknown[]) => void) & {
  q?: Array<unknown[]>;
};

const CHATBASE_SCRIPT_ID = "ykxoUjeeqoEhVKfDB_Wwm";
const CHATBASE_MOBILE_STYLE_ID = "chatbase-mobile-launcher-offset-style";
const CHATBASE_MOBILE_BOTTOM_OFFSET =
  "calc(5.75rem + env(safe-area-inset-bottom))";

function ensureChatbaseQueue() {
  if (typeof window === "undefined" || window.chatbase) {
    return;
  }

  const chatbase = ((...args: unknown[]) => {
    if (!chatbase.q) {
      chatbase.q = [];
    }

    chatbase.q.push(args);
  }) as ChatbaseShim;

  window.chatbase = new Proxy(chatbase, {
    get(target, prop) {
      if (prop === "q") {
        return target.q;
      }

      return (...args: unknown[]) => target(prop as string, ...args);
    },
  });
}

function ensureChatbaseMobileLauncherOffset() {
  if (
    typeof document === "undefined" ||
    document.getElementById(CHATBASE_MOBILE_STYLE_ID)
  ) {
    return;
  }

  const style = document.createElement("style");
  style.id = CHATBASE_MOBILE_STYLE_ID;
  style.textContent = `
    @media (max-width: 767px) {
      #chatbase-bubble-button {
        bottom: ${CHATBASE_MOBILE_BOTTOM_OFFSET} !important;
      }
    }
  `;

  document.head.appendChild(style);
}

export default function ChatbaseWidget() {
  const { fetchWithAuth, isAuthenticated, isReady, user } = useAuth();
  const chatbotId = process.env.NEXT_PUBLIC_CHATBASE_WIDGET_ID?.trim() || "";
  const identifiedUserIdRef = useRef<string | null>(null);
  const widgetFailedRef = useRef(false);

  useEffect(() => {
    if (!chatbotId) {
      return;
    }

    ensureChatbaseMobileLauncherOffset();
  }, [chatbotId]);

  useEffect(() => {
    if (!chatbotId || typeof window === "undefined" || widgetFailedRef.current) {
      return;
    }

    if (document.getElementById(CHATBASE_SCRIPT_ID)) {
      return;
    }

    const handleScriptError = () => {
      widgetFailedRef.current = true;
      console.info(
        "Chat widget disabled: invalid or missing Chatbase widget ID. " +
        "Set NEXT_PUBLIC_CHATBASE_WIDGET_ID in .env to a valid Chatbase widget ID.",
      );
    };

    ensureChatbaseQueue();

    const onLoad = () => {
      const script = document.createElement("script");
      script.src = "https://www.chatbase.co/embed.min.js";
      script.id = CHATBASE_SCRIPT_ID;
      script.async = true;
      script.defer = true;
      script.onerror = handleScriptError;

      document.body.appendChild(script);
    };

    if (document.readyState === "complete") {
      onLoad();
    } else {
      window.addEventListener("load", onLoad);
    }

    return () => {
      window.removeEventListener("load", onLoad);
    };
  }, [chatbotId]);

  useEffect(() => {
    if (widgetFailedRef.current) {
      return;
    }

    let isActive = true;

    const identifyUser = async () => {
      if (
        !chatbotId ||
        !isReady ||
        !isAuthenticated ||
        !user?.id ||
        widgetFailedRef.current
      ) {
        identifiedUserIdRef.current = null;
        return;
      }

      if (identifiedUserIdRef.current === user.id) {
        return;
      }

      try {
        const response = await fetchWithAuth<ChatbaseTokenResponse>(
          "/auth/chatbase-token",
        );

        if (!isActive || widgetFailedRef.current) {
          return;
        }

        if (typeof window.chatbase === "function") {
          window.chatbase("identify", { token: response.data.token });
        }
        identifiedUserIdRef.current = user.id;
      } catch (error) {
        if (error instanceof Error) {
          console.debug("Chatbase identification failed:", error.message);
        }
      }
    };

    void identifyUser();

    return () => {
      isActive = false;
    };
  }, [chatbotId, fetchWithAuth, isAuthenticated, isReady, user?.id]);

  return null;
}
