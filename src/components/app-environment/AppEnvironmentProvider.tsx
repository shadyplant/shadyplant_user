"use client";

import {
  createContext,
  useEffect,
  useContext,
  useState,
  type ReactNode,
} from "react";
import {
  APP_ENV_COOKIE_FLAG,
  APP_ENV_COOKIE_PLATFORM,
  APP_ENV_GLOBAL_KEY,
  APP_ENV_STORAGE_FLAG,
  APP_ENV_STORAGE_PLATFORM,
  type AppEnvironment,
  isTruthy,
  normalizePlatform,
} from "@/lib/appEnvironment";

type AppEnvironmentContextValue = AppEnvironment;

const DEFAULT_ENVIRONMENT: AppEnvironmentContextValue = {
  isApp: false,
  platform: "browser",
  source: "browser",
};

const AppEnvironmentContext = createContext<AppEnvironmentContextValue>(
  DEFAULT_ENVIRONMENT,
);

type AppEnvironmentProviderProps = {
  initialEnvironment: AppEnvironmentContextValue;
  children: ReactNode;
};

export function AppEnvironmentProvider({
  initialEnvironment,
  children,
}: AppEnvironmentProviderProps) {
  const [environment, setEnvironment] = useState(initialEnvironment);

  useEffect(() => {
    // Native apps can inject their identifier into localStorage or a global
    // object immediately after WebView boot. This keeps client-side detection
    // fast while still letting cookies/headers handle SSR.
    const readClientEnvironment = (): AppEnvironment | null => {
      if (typeof document === "undefined") {
        return null;
      }

      const globalEnvironment = (
        window as Window & {
          [APP_ENV_GLOBAL_KEY]?: Partial<AppEnvironment>;
        }
      )[APP_ENV_GLOBAL_KEY];

      if (globalEnvironment?.isApp) {
        return {
          isApp: true,
          platform: normalizePlatform(globalEnvironment.platform),
          source: "storage",
        };
      }

      const storageFlag = window.localStorage.getItem(APP_ENV_STORAGE_FLAG);
      const storagePlatform = window.localStorage.getItem(
        APP_ENV_STORAGE_PLATFORM,
      );

      const storageIsApp =
        isTruthy(storageFlag) || normalizePlatform(storagePlatform) !== "browser";

      if (storageIsApp) {
        return {
          isApp: true,
          platform: normalizePlatform(storagePlatform),
          source: "storage",
        };
      }

      return null;
    };

    const readCookieEnvironment = (): AppEnvironment | null => {
      const cookieEntries = document.cookie
        .split(";")
        .map((entry) => entry.trim())
        .filter(Boolean);

      const cookieMap = new Map<string, string>();

      for (const entry of cookieEntries) {
        const separatorIndex = entry.indexOf("=");

        if (separatorIndex < 0) {
          continue;
        }

        const name = entry.slice(0, separatorIndex).trim().toLowerCase();
        const value = entry.slice(separatorIndex + 1).trim();
        cookieMap.set(name, value);
      }

      const isAppCookie = isTruthy(cookieMap.get(APP_ENV_COOKIE_FLAG));
      const platformCookie = normalizePlatform(
        cookieMap.get(APP_ENV_COOKIE_PLATFORM),
      );

      if (!isAppCookie && platformCookie === "browser") {
        return null;
      }

      return {
        isApp: true,
        platform: platformCookie,
        source: "cookie",
      };
    };

    const applyEnvironment = (nextEnvironment: AppEnvironment | null) => {
      if (!nextEnvironment) {
        return false;
      }

      setEnvironment((current) =>
        current.isApp === nextEnvironment.isApp &&
        current.platform === nextEnvironment.platform
          ? current
          : nextEnvironment,
      );

      document.documentElement.dataset.isApp = nextEnvironment.isApp
        ? "true"
        : "false";
      document.documentElement.dataset.appPlatform = nextEnvironment.platform;

      return true;
    };

    if (applyEnvironment(readClientEnvironment() || readCookieEnvironment())) {
      return;
    }

    const intervalId = window.setInterval(() => {
      if (applyEnvironment(readClientEnvironment() || readCookieEnvironment())) {
        window.clearInterval(intervalId);
        window.clearTimeout(timeoutId);
      }
    }, 250);

    const timeoutId = window.setTimeout(() => {
      window.clearInterval(intervalId);
    }, 2500);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, []);

  return (
    <AppEnvironmentContext.Provider value={environment}>
      {children}
    </AppEnvironmentContext.Provider>
  );
}

export function useAppEnvironment() {
  return useContext(AppEnvironmentContext);
}
