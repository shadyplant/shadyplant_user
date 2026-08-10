"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { ApiError, type ApiResponse } from "@/lib/api";

export type NotificationItem = {
  id: string;
  userId: string;
  orderId?: string;
  type: string;
  title: string;
  message: string;
  imageUrl: string;
  href: string;
  actionLabel: string;
  icon: string;
  isRead: boolean;
  readAt: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string | null;
  updatedAt: string | null;
};

type NotificationsApiResponse = ApiResponse<{
  notifications?: Array<Partial<NotificationItem>>;
  unreadCount?: number;
}>;

type NotificationStoreState = {
  items: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  isReady: boolean;
  userId: string | null;
  errorMessage: string | null;
};

const EMPTY_STATE: NotificationStoreState = {
  items: [],
  unreadCount: 0,
  isLoading: false,
  isReady: false,
  userId: null,
  errorMessage: null,
};

let notificationState: NotificationStoreState = EMPTY_STATE;
let notificationLoadPromise: Promise<NotificationItem[]> | null = null;

const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function setNotificationState(nextState: NotificationStoreState) {
  notificationState = nextState;
  emitChange();
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return notificationState;
}

function getServerSnapshot() {
  return EMPTY_STATE;
}

function normalizeString(value: unknown) {
  return String(value || "").trim();
}

function normalizeNotification(item: Partial<NotificationItem>): NotificationItem | null {
  const id = normalizeString(item.id);
  const userId = normalizeString(item.userId);
  const title = normalizeString(item.title);
  const message = normalizeString(item.message);

  if (!id || !userId || !title || !message) {
    return null;
  }

  return {
    id,
    userId,
    orderId: normalizeString(item.orderId),
    type: normalizeString(item.type) || "order_status",
    title,
    message,
    imageUrl: normalizeString(item.imageUrl),
    href: normalizeString(item.href),
    actionLabel: normalizeString(item.actionLabel) || "View",
    icon: normalizeString(item.icon),
    isRead: Boolean(item.isRead),
    readAt:
      typeof item.readAt === "string" && item.readAt.trim()
        ? item.readAt
        : null,
    metadata:
      item.metadata && typeof item.metadata === "object" && !Array.isArray(item.metadata)
        ? item.metadata
        : undefined,
    createdAt:
      typeof item.createdAt === "string" && item.createdAt.trim()
        ? item.createdAt
        : null,
    updatedAt:
      typeof item.updatedAt === "string" && item.updatedAt.trim()
        ? item.updatedAt
        : null,
  };
}

function normalizeNotifications(response: NotificationsApiResponse) {
  return Array.isArray(response.data.notifications)
    ? response.data.notifications
        .flatMap((item) => {
          const normalizedItem = normalizeNotification(item);
          return normalizedItem ? [normalizedItem] : [];
        })
        .sort((left, right) =>
          String(right.createdAt || "").localeCompare(String(left.createdAt || "")),
        )
    : [];
}

function normalizeApiError(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

function applyNotificationResponse(
  userId: string,
  response: NotificationsApiResponse,
) {
  const items = normalizeNotifications(response);

  setNotificationState({
    items,
    unreadCount:
      typeof response.data.unreadCount === "number"
        ? Math.max(0, Math.floor(response.data.unreadCount))
        : items.filter((item) => !item.isRead).length,
    isLoading: false,
    isReady: true,
    userId,
    errorMessage: null,
  });

  return items;
}

function resetNotificationState() {
  notificationLoadPromise = null;
  setNotificationState({
    items: [],
    unreadCount: 0,
    isLoading: false,
    isReady: true,
    userId: null,
    errorMessage: null,
  });
}

async function fetchNotifications(
  userId: string,
  fetchWithAuth: <T>(path: string, init?: RequestInit) => Promise<T>,
) {
  if (notificationLoadPromise && notificationState.userId === userId) {
    return notificationLoadPromise;
  }

  setNotificationState({
    ...notificationState,
    isLoading: true,
    isReady: notificationState.isReady && notificationState.userId === userId,
    userId,
    errorMessage: null,
  });

  notificationLoadPromise = fetchWithAuth<NotificationsApiResponse>("/notifications")
    .then((response) => applyNotificationResponse(userId, response))
    .catch((error) => {
      setNotificationState({
        items: [],
        unreadCount: 0,
        isLoading: false,
        isReady: true,
        userId,
        errorMessage: normalizeApiError(error, "Unable to load notifications."),
      });
      throw error;
    })
    .finally(() => {
      notificationLoadPromise = null;
    });

  return notificationLoadPromise;
}

export function useNotificationsStore() {
  const { fetchWithAuth, isAuthenticated, isReady, user } = useAuth();
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!isAuthenticated || !user?.id) {
      resetNotificationState();
      return;
    }

    if (state.userId === user.id && state.isReady) {
      return;
    }

    void fetchNotifications(user.id, fetchWithAuth).catch((error) => {
      if (error instanceof ApiError && error.status === 401) {
        resetNotificationState();
      }
    });
  }, [
    fetchWithAuth,
    isAuthenticated,
    isReady,
    state.isReady,
    state.userId,
    user?.id,
  ]);

  async function reload() {
    if (!isAuthenticated || !user?.id) {
      resetNotificationState();
      return [];
    }

    return fetchNotifications(user.id, fetchWithAuth);
  }

  async function markAsRead(notificationId: string) {
    if (!isAuthenticated || !user?.id) {
      throw new ApiError(401, "Please sign in to view notifications.", null);
    }

    const response = await fetchWithAuth<NotificationsApiResponse>(
      `/notifications/${encodeURIComponent(notificationId)}/read`,
      {
        method: "PATCH",
      },
    );

    return applyNotificationResponse(user.id, response);
  }

  async function markAllAsRead() {
    if (!isAuthenticated || !user?.id) {
      throw new ApiError(401, "Please sign in to view notifications.", null);
    }

    const response = await fetchWithAuth<NotificationsApiResponse>(
      "/notifications/read-all",
      {
      method: "PATCH",
      },
    );

    return applyNotificationResponse(user.id, response);
  }

  async function removeItem(notificationId: string) {
    if (!isAuthenticated || !user?.id) {
      throw new ApiError(401, "Please sign in to view notifications.", null);
    }

    const response = await fetchWithAuth<NotificationsApiResponse>(
      `/notifications/${encodeURIComponent(notificationId)}`,
      {
        method: "DELETE",
      },
    );

    return applyNotificationResponse(user.id, response);
  }

  return {
    ...state,
    reload,
    markAsRead,
    markAllAsRead,
    removeItem,
  };
}
