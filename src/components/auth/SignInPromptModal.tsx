"use client";

import Image from "next/image";
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
    () =>
      buildNextPath(
        pathname,
        new URLSearchParams(searchParams?.toString() || ""),
      ),
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

      <div className="relative z-[1] grid w-full max-w-[860px] grid-cols-1 overflow-hidden rounded-[0.5rem] border border-[#dbe8cd] bg-white shadow-[0_30px_90px_rgba(0,0,0,0.22)] md:grid-cols-2">
        <button
          type="button"
          onClick={closePrompt}
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-[#dbe8cd] bg-white text-[#58724f] hover:bg-neutral-50"
          aria-label="Close sign in prompt"
        >
          <X size={18} />
        </button>

        <div className="relative hidden h-full min-h-[400px] w-full md:block">
          <Image
            src="https://cdni.iconscout.com/illustration/premium/thumb/plant-nursery-illustration-svg-download-png-8318580.png"
            alt="Sign In Visual"
            fill
            priority
            className="object-cover"
          />
        </div>

        <div className="flex flex-col justify-center p-6 sm:p-8 md:p-10">
  

          <AuthLoginPanel
            nextPath={nextPath}
            onSuccess={() => {
              setIsOpen(false);
            }}
            onRequestRegister={() => {
              closePrompt();
              router.push(
                `/auth?step=register&next=${encodeURIComponent(nextPath)}`,
              );
            }}
            onRequestForgotPassword={() => {
              closePrompt();
              router.push(
                `/auth?step=forgot&next=${encodeURIComponent(nextPath)}`,
              );
            }}
          />
        </div>
      </div>
    </div>
  );
}
