"use client";

import { requestJson, type ApiResponse } from "@/lib/api";

export type PushTokenRegistrationPayload = {
  installId?: string;
  token?: string;
  fcmToken?: string;
  platform?: "android" | "ios" | "web" | string;
  deviceId?: string;
  deviceName?: string;
  appVersion?: string;
  appBuild?: string;
  isActive?: boolean;
};

export type StoredPushTokenRegistration = {
  installId: string;
  token: string;
  platform: string;
  deviceId: string;
  deviceName: string;
  appVersion: string;
  appBuild: string;
  isActive: boolean;
  lastLinkedUserId: string | null;
  lastRegisteredAt: string | null;
};

const STORAGE_INSTALL_ID_KEY = "sp_push_install_id";
const STORAGE_REGISTRATION_KEY = "sp_push_token_registration";

function normalizeInstallId(value: unknown) {
  return String(value || "").trim();
}

function normalizeToken(value: unknown) {
  return String(value || "").trim();
}

export function normalizePushTokenRegistration(
  payload: PushTokenRegistrationPayload,
): StoredPushTokenRegistration | null {
  const token = normalizeToken(payload.token || payload.fcmToken);
  const installId = normalizeInstallId(payload.installId);

  if (!token) {
    return null;
  }

  return {
    installId,
    token,
    platform: String(payload.platform || "android").trim().toLowerCase() || "android",
    deviceId: String(payload.deviceId || "default").trim() || "default",
    deviceName: String(payload.deviceName || "").trim(),
    appVersion: String(payload.appVersion || "").trim(),
    appBuild: String(payload.appBuild || "").trim(),
    isActive: payload.isActive !== false,
    lastLinkedUserId: null,
    lastRegisteredAt: null,
  };
}

function readLocalStorage(key: string) {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    return window.localStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

function writeLocalStorage(key: string, value: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage errors.
  }
}

function readStoredRegistration() {
  const raw = readLocalStorage(STORAGE_REGISTRATION_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<StoredPushTokenRegistration>;
    if (!parsed || !parsed.token) {
      return null;
    }

    return {
      installId: String(parsed.installId || "").trim(),
      token: String(parsed.token || "").trim(),
      platform: String(parsed.platform || "android").trim().toLowerCase() || "android",
      deviceId: String(parsed.deviceId || "default").trim() || "default",
      deviceName: String(parsed.deviceName || "").trim(),
      appVersion: String(parsed.appVersion || "").trim(),
      appBuild: String(parsed.appBuild || "").trim(),
      isActive: parsed.isActive !== false,
      lastLinkedUserId: String(parsed.lastLinkedUserId || "").trim() || null,
      lastRegisteredAt: String(parsed.lastRegisteredAt || "").trim() || null,
    } satisfies StoredPushTokenRegistration;
  } catch {
    return null;
  }
}

function saveStoredRegistration(payload: StoredPushTokenRegistration) {
  writeLocalStorage(STORAGE_REGISTRATION_KEY, JSON.stringify(payload));
}

export function getOrCreatePushInstallId() {
  const existing = readLocalStorage(STORAGE_INSTALL_ID_KEY);
  if (existing) {
    return existing;
  }

  const generated =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `push-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  writeLocalStorage(STORAGE_INSTALL_ID_KEY, generated);
  return generated;
}

export function cachePushTokenRegistration(payload: PushTokenRegistrationPayload) {
  const normalized = normalizePushTokenRegistration(payload);

  if (!normalized) {
    return null;
  }

  const existingInstallId = normalized.installId || getOrCreatePushInstallId();
  const stored: StoredPushTokenRegistration = {
    ...normalized,
    installId: existingInstallId,
    lastLinkedUserId: readStoredRegistration()?.lastLinkedUserId ?? null,
    lastRegisteredAt: new Date().toISOString(),
  };

  saveStoredRegistration(stored);
  return stored;
}

export function getCachedPushTokenRegistration() {
  return readStoredRegistration();
}

export function clearCachedPushTokenRegistration() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(STORAGE_REGISTRATION_KEY);
  } catch {
    // Ignore storage errors.
  }
}

export async function registerPushTokenWithServer(
  payload: PushTokenRegistrationPayload,
  options: {
    authenticated?: boolean;
    linkedUserId?: string | null;
    fetchWithAuth?: <T>(path: string, init?: RequestInit) => Promise<T>;
  } = {},
) {
  const normalized = normalizePushTokenRegistration(payload);

  if (!normalized) {
    throw new Error("FCM token is required.");
  }

  const installId = normalized.installId || getOrCreatePushInstallId();
  const requestBody = {
    installId,
    token: normalized.token,
    platform: normalized.platform,
    deviceId: normalized.deviceId,
    deviceName: normalized.deviceName,
    appVersion: normalized.appVersion,
    appBuild: normalized.appBuild,
    isActive: normalized.isActive,
  };

  const endpoint = options.authenticated
    ? "/auth/push-token"
    : "/push/devices/register";

  const response = options.authenticated && options.fetchWithAuth
    ? await options.fetchWithAuth<ApiResponse<{ token?: unknown }>>("/auth/push-token", {
        method: "POST",
        body: JSON.stringify(requestBody),
      })
    : await requestJson<ApiResponse<{ token?: unknown }>>(endpoint, {
        method: "POST",
        body: JSON.stringify(requestBody),
      });

  const cached = cachePushTokenRegistration({
    ...requestBody,
    installId,
  });

  if (cached && options.linkedUserId) {
    saveStoredRegistration({
      ...cached,
      lastLinkedUserId: options.linkedUserId,
      lastRegisteredAt: new Date().toISOString(),
    });
  }

  return response;
}
