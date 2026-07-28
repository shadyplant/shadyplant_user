export type Platform = "browser" | "android" | "ios";

export type AppEnvironmentSource = "cookie" | "header" | "storage" | "browser";

export type AppEnvironment = {
  isApp: boolean;
  platform: Platform;
  source: AppEnvironmentSource;
};

export const APP_ENV_COOKIE_FLAG = "is_app";
export const APP_ENV_COOKIE_PLATFORM = "platform";
export const APP_ENV_HEADER_PLATFORM = "x-app-platform";
export const APP_ENV_STORAGE_FLAG = "sp_is_app";
export const APP_ENV_STORAGE_PLATFORM = "sp_platform";
export const APP_ENV_GLOBAL_KEY = "__SHADYPLANT_APP_ENV__";

export function isTruthy(value: string | null | undefined) {
  const normalizedValue = String(value || "").trim().toLowerCase();
  return ["true", "1", "yes", "on"].includes(normalizedValue);
}

export function normalizePlatform(value: string | null | undefined): Platform {
  const normalizedValue = String(value || "").trim().toLowerCase();

  if (normalizedValue === "android" || normalizedValue === "ios") {
    return normalizedValue;
  }

  return "browser";
}
