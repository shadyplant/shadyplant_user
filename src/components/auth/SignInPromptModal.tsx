"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import AuthLoginPanel from "@/components/auth/AuthLoginPanel";

const PROMPT_DELAY_MS = 6000;
const PROMPT_SESSION_KEY = "ggn_signin_prompt_dismissed";

function buildNextPath(pathname: string, searchParams: URLSearchParams) {
  const serializedParams = searchParams.toString();
  return serializedParams ? `${pathname}?${serializedParams}` : pathname;
}

function canPromptOnPath(pathname: string) {
  return !pathname.startsWith("/auth");
}

export default function SignInPromptModal() {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();
  const { isAuthenticated, isReady } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dismissedForSessionRef = useRef(false);
  const timeoutRef = useRef<number | null>(null);

  const nextPath = useMemo(
    () => buildNextPath(pathname, new URLSearchParams(searchParams?.toString() || "")),
    [pathname, searchParams],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    dismissedForSessionRef.current =
      window.sessionStorage.getItem(PROMPT_SESSION_KEY) === "1";
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (isAuthenticated) {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    if (!canPromptOnPath(pathname) || dismissedForSessionRef.current) {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    if (timeoutRef.current === null && !isOpen) {
      timeoutRef.current = window.setTimeout(() => {
        timeoutRef.current = null;
        setIsOpen(true);
      }, PROMPT_DELAY_MS);
    }

    return () => {
      if (timeoutRef.current !== null && !canPromptOnPath(pathname)) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isAuthenticated, isOpen, isReady, pathname]);

  function closePrompt() {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(PROMPT_SESSION_KEY, "1");
    }

    dismissedForSessionRef.current = true;
    setIsOpen(false);
  }

  if (!isReady || isAuthenticated || !isOpen || !canPromptOnPath(pathname)) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-[#0f170c]/55 px-4 py-6 backdrop-blur-[3px]"
      role="dialog"
      aria-modal="true"
      aria-label="Sign in prompt"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close sign in prompt"
        onClick={closePrompt}
      />

      <div className="relative z-[1] w-full max-w-[460px] rounded-[2rem] border border-[#dbe8cd] bg-white p-5 shadow-[0_30px_90px_rgba(0,0,0,0.22)] sm:p-6">
        <button
          type="button"
          onClick={closePrompt}
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-[#dbe8cd] text-[#58724f]"
          aria-label="Close sign in prompt"
        >
          <X size={18} />
        </button>

        <div className="pr-12">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#6b8b58]">
            Welcome to Grass Green Nursery
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[#163915]">
            Sign in to keep your cart, wishlist, and orders synced
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#58724f]">
            Continue with your account to save items across devices and track
            your orders more easily.
          </p>
        </div>

        <AuthLoginPanel
          nextPath={nextPath}
          onSuccess={() => {
            setIsOpen(false);
          }}
          onRequestRegister={() => {
            closePrompt();
            router.push(`/auth?step=register&next=${encodeURIComponent(nextPath)}`);
          }}
          onRequestForgotPassword={() => {
            closePrompt();
            router.push(`/auth?step=forgot&next=${encodeURIComponent(nextPath)}`);
          }}
        />

        <div className="mt-4 text-center text-sm text-[#6b7d63]">
          Prefer full-page auth?{" "}
          <Link
            href={`/auth?next=${encodeURIComponent(nextPath)}`}
            onClick={closePrompt}
            className="font-semibold text-[#214f14]"
          >
            Open sign in page
          </Link>
        </div>
      </div>
    </div>
  );
}
