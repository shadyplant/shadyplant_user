"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BadgePercent,
  Bell,
  CheckCheck,
  Clock3,
  Gift,
  PackageSearch,
  RefreshCw,
  Trash2,
  Truck,
  X,
  Leaf,
} from "lucide-react";
import { useMemo, useRef, useState, type PointerEvent } from "react";
import SiteShell from "@/components/SiteShell";
import { useAuth } from "@/components/auth/AuthProvider";
import SpinnerLoader from "@/components/loader/spinner";
import {
  useNotificationsStore,
  type NotificationItem,
} from "./notificationsStore";

function formatNotificationTime(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getNotificationIconKey(notification: NotificationItem) {
  const type = String(notification.type || "")
    .trim()
    .toLowerCase();
  const status = String(notification.metadata?.status || "")
    .trim()
    .toLowerCase();

  if (type === "promotion") {
    return "promotion";
  }

  if (status === "confirmed") {
    return "confirmed";
  }

  if (status === "shipped" || status === "out_for_delivery") {
    return "shipping";
  }

  if (status === "delivered") {
    return "delivered";
  }

  if (status === "cancelled" || status === "refunded") {
    return "issue";
  }

  if (type === "offer") {
    return "offer";
  }

  return "default";
}

function NotificationThumbnail({
  notification,
}: {
  notification: NotificationItem;
}) {
  if (notification.imageUrl) {
    return (
      <div className="relative h-16 w-16 overflow-hidden rounded-[0.6rem] bg-[#f4f8ef] shadow-[0_8px_18px_rgba(0,0,0,0.06)]">
        <Image
          src={notification.imageUrl}
          alt=""
          fill
          sizes="64px"
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-[0.6rem] bg-[linear-gradient(180deg,#f5fbef_0%,#e8f4dc_100%)] text-[#2f6b44] shadow-[0_8px_18px_rgba(0,0,0,0.06)]">
      <Leaf size={22} />
    </div>
  );
}

function SwipeNotificationRow({
  notification,
  isOpen,
  onClose,
  onRequestDelete,
  onOpenNotification,
}: {
  notification: NotificationItem;
  isOpen: boolean;
  onClose: () => void;
  onRequestDelete: () => void;
  onOpenNotification: () => void;
}) {
  const revealWidth = 92;
  const dragStateRef = useRef({
    pointerId: -1,
    startX: 0,
    startTranslateX: 0,
    moved: false,
  });
  const [dragOffset, setDragOffset] = useState(0);
  const translateX = isOpen ? -revealWidth : dragOffset;

  function clampTranslateX(value: number) {
    return Math.min(0, Math.max(-revealWidth, value));
  }

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0) {
      return;
    }

    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startTranslateX: translateX,
      moved: false,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent<HTMLButtonElement>) {
    if (dragStateRef.current.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - dragStateRef.current.startX;
    const nextTranslateX = clampTranslateX(
      dragStateRef.current.startTranslateX + deltaX,
    );

    if (Math.abs(deltaX) > 6) {
      dragStateRef.current.moved = true;
    }

    setDragOffset(nextTranslateX);
  }

  function finalizeDrag() {
    const shouldRequestDelete = translateX < -revealWidth * 0.35;

    setDragOffset(0);
    if (shouldRequestDelete) {
      onRequestDelete();
    } else {
      onClose();
    }

    dragStateRef.current = {
      pointerId: -1,
      startX: 0,
      startTranslateX: 0,
      moved: false,
    };
  }

  function handlePointerUp(event: PointerEvent<HTMLButtonElement>) {
    if (dragStateRef.current.pointerId !== event.pointerId) {
      return;
    }

    finalizeDrag();
  }

  function handlePointerCancel(event: PointerEvent<HTMLButtonElement>) {
    if (dragStateRef.current.pointerId !== event.pointerId) {
      return;
    }

    setDragOffset(0);
    onClose();
    dragStateRef.current = {
      pointerId: -1,
      startX: 0,
      startTranslateX: 0,
      moved: false,
    };
  }

  function handleOpenNotification() {
    if (dragStateRef.current.moved) {
      dragStateRef.current.moved = false;
      return;
    }

    onOpenNotification();
  }

  const iconKey = getNotificationIconKey(notification);
  const timeLabel = formatNotificationTime(notification.createdAt);
  const isUnread = !notification.isRead;
  const isSwipeRevealed = isOpen || dragOffset < 0;

  return (
    <div
      className={`relative overflow-hidden border transition-colors ${
        isUnread
          ? "border-[#d6e9db] bg-[#f7fbf7]"
          : "border-gray-100 bg-white"
      }`}
    >
      <div
        className="pointer-events-none absolute inset-y-0 right-0 flex w-[92px] items-stretch justify-end bg-[#ffe7e7] transition-transform duration-200 ease-out"
        style={{
          transform: `translate3d(${isSwipeRevealed ? "0" : "100%"}, 0, 0)`,
        }}
      >
        <div className="flex w-full items-center justify-center gap-2 text-[#e11d48]">
          <Trash2 size={18} />
        </div>
      </div>

      <button
        type="button"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onClick={handleOpenNotification}
        className={`relative z-10 block w-full touch-pan-y text-left transition-transform duration-200 ease-out ${
          isUnread ? "bg-[#f7fbf7]" : "bg-white"
        }`}
        style={{
          transform: `translate3d(${translateX}px, 0, 0)`,
        }}
      >
        <div className="flex items-center gap-3 px-3 py-4 sm:px-4 sm:py-5">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[0.8rem] text-[#207958] ${
              isUnread ? "bg-[#e9f6ec]" : "bg-[#f3f8f1]"
            }`}
          >
            {iconKey === "promotion" ? (
              <BadgePercent size={22} />
            ) : iconKey === "confirmed" ? (
              <PackageSearch size={22} />
            ) : iconKey === "shipping" ? (
              <Truck size={22} />
            ) : iconKey === "delivered" ? (
              <CheckCheck size={22} />
            ) : iconKey === "offer" ? (
              <Gift size={22} />
            ) : iconKey === "issue" ? (
              <X size={22} />
            ) : (
              <Bell size={22} />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-[0.95rem] font-semibold text-[#111827] sm:text-[1rem]">
                    {notification.title}
                  </h3>
                  {isUnread ? (
                    <span className="mt-0.5 inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-[#207958]" />
                  ) : null}
                </div>
                <p className="mt-1 line-clamp-2 text-[0.82rem] leading-5 text-[#4b5563] sm:text-[0.9rem]">
                  {notification.message}
                </p>
                <div className="mt-2 flex items-center gap-2 text-[0.72rem] text-[#8a8f98]">
                  <Clock3 size={12} />
                  <span>{timeLabel}</span>
                  {notification.actionLabel ? (
                    <>
                      <span className="text-[#d1d5db]">-</span>
                      <span>{notification.actionLabel}</span>
                    </>
                  ) : null}
                </div>
              </div>

              <div className="shrink-0">
                <NotificationThumbnail notification={notification} />
              </div>
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}

export default function NotificationPageClient() {
  const router = useRouter();
  const { isAuthenticated, isReady: isAuthReady } = useAuth();
  const {
    items,
    unreadCount,
    isLoading,
    isReady,
    markAllAsRead,
    markAsRead,
    removeItem,
  } = useNotificationsStore();
  const [openNotificationId, setOpenNotificationId] = useState<string | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<NotificationItem | null>(null);

  const hasNotifications = items.length > 0;

  const pageTitle = useMemo(
    () => `Notification${unreadCount > 0 ? ` (${unreadCount})` : ""}`,
    [unreadCount],
  );

  async function confirmDeleteNotification() {
    if (!deleteTarget) {
      return;
    }

    try {
      await removeItem(deleteTarget.id);
      setOpenNotificationId((current) =>
        current === deleteTarget.id ? null : current,
      );
    } finally {
      setDeleteTarget(null);
    }
  }

  if (isAuthReady && !isAuthenticated) {
    return (
      <SiteShell hideHeader hideMobileBottomNav>
        <section className="min-h-screen px-4 py-6 md:px-6 md:py-10">
          <div className="mx-auto flex min-h-[calc(100vh-140px)] max-w-2xl items-center justify-center">
            <div className="w-full rounded-[1.5rem] border border-gray-200 bg-white p-6 text-center shadow-[0_24px_60px_rgba(16,24,40,0.06)] md:p-10">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#eaf6ef] text-[#207958]">
                <Bell size={28} />
              </div>
              <h1 className="mt-5 text-2xl font-semibold text-gray-900">
                Sign in to view notifications
              </h1>
              <p className="mt-3 text-sm leading-6 text-gray-500">
                Order updates, promos, and delivery alerts are shown here for
                your account.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link
                  href="/auth?next=/notification"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#207958] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1c684a]"
                >
                  Sign in
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Browse plants
                </Link>
              </div>
            </div>
          </div>
        </section>
      </SiteShell>
    );
  }

  return (
    <SiteShell hideHeader hideMobileBottomNav>
      <section className="min-h-screen px-0 py-4 md:px-6 md:py-8">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-3xl flex-col md:min-h-[calc(100vh-4rem)]">
          <div className="mb-4 flex items-center justify-between rounded-[1rem] px-2 py-0 md:px-0 md:py-0 md:shadow-none">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-700 transition hover:bg-gray-100"
              aria-label="Go back"
            >
              <ArrowLeft size={22} />
            </button>
            <h1 className="text-base font-semibold text-gray-900 md:text-xl">
              {pageTitle}
            </h1>
            <button
              type="button"
              onClick={() => void markAllAsRead()}
              className="inline-flex h-10 items-center gap-2 rounded-full px-3 text-xs font-semibold text-[#207958] transition hover:bg-[#eaf6ef]"
            >
              <RefreshCw size={14} />
              Mark all read
            </button>
          </div>

          {!isReady || isLoading ? (
            <div className="flex flex-1 items-center justify-center rounded-[1.25rem] border border-gray-200 bg-white p-6 shadow-[0_14px_42px_rgba(16,24,40,0.06)]">
              <SpinnerLoader offset={90} />
            </div>
          ) : !hasNotifications ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="w-full rounded-[1.5rem]  bg-white p-8 text-center md:p-12">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#eff8f1] text-[#207958]">
                  <Bell size={28} />
                </div>
                <h2 className="mt-5 text-xl font-medium text-gray-600">
                  No notifications yet
                </h2>
     
              </div>
            </div>
          ) : (
            <div className="space-y-3 pb-8">
              {items.map((notification) => (
                <SwipeNotificationRow
                  key={notification.id}
                  notification={notification}
                  isOpen={openNotificationId === notification.id}
                  onClose={() =>
                    setOpenNotificationId((current) =>
                      current === notification.id ? null : current,
                    )
                  }
                  onRequestDelete={() => {
                    setOpenNotificationId((current) =>
                      current === notification.id ? null : current,
                    );
                    setDeleteTarget(notification);
                  }}
                  onOpenNotification={() => {
                    if (notification.href) {
                      void markAsRead(notification.id).catch(() => undefined);
                      router.push(notification.href);
                      return;
                    }

                    void markAsRead(notification.id).catch(() => undefined);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 px-4 py-6 sm:items-center">
          <div className="w-full max-w-md rounded-[1.4rem] bg-white p-5 shadow-[0_24px_70px_rgba(0,0,0,0.18)]">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fff1f0] text-[#c2362b]">
                <Trash2 size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold text-gray-900">
                  Delete notification?
                </h2>
                <p className="mt-1 text-sm leading-6 text-gray-600">
                  This will remove “{deleteTarget.title}” from your notifications.
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmDeleteNotification()}
                className="rounded-full bg-[#c2362b] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </SiteShell>
  );
}
