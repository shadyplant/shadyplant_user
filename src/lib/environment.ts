import "server-only";

import { cache } from "react";
import { cookies, headers } from "next/headers";
import {
  APP_ENV_COOKIE_FLAG,
  APP_ENV_COOKIE_PLATFORM,
  APP_ENV_HEADER_PLATFORM,
  type AppEnvironment,
  isTruthy,
  normalizePlatform,
} from "@/lib/appEnvironment";

const readRequestEnvironment = cache(async (): Promise<AppEnvironment> => {
  const cookieStore = await cookies();
  const cookieIsApp = isTruthy(cookieStore.get(APP_ENV_COOKIE_FLAG)?.value);
  const cookiePlatform = normalizePlatform(
    cookieStore.get(APP_ENV_COOKIE_PLATFORM)?.value,
  );

  // Cookies are the preferred signal because the native app controls the WebView.
  if (cookieIsApp || cookiePlatform !== "browser") {
    return {
      isApp: true,
      platform: cookiePlatform,
      source: "cookie",
    };
  }

  const headerPlatform = normalizePlatform(
    (await headers()).get(APP_ENV_HEADER_PLATFORM),
  );

  if (headerPlatform !== "browser") {
    return {
      isApp: true,
      platform: headerPlatform,
      source: "header",
    };
  }

  return {
    isApp: false,
    platform: "browser",
    source: "browser",
  };
});

export async function resolveAppEnvironment(): Promise<AppEnvironment> {
  return readRequestEnvironment();
}

export async function isApp(): Promise<boolean> {
  return (await readRequestEnvironment()).isApp;
}

export async function isAndroidApp(): Promise<boolean> {
  return (await readRequestEnvironment()).platform === "android";
}

export async function isIOSApp(): Promise<boolean> {
  return (await readRequestEnvironment()).platform === "ios";
}

export async function getPlatform() {
  return (await readRequestEnvironment()).platform;
}
