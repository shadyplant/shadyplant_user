"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

type TopBarProps = {
  className?: string;
  onBack?: () => void;
  fallbackHref?: string;
};

export default function TopBar({
  className = "",
  onBack,
  fallbackHref = "/",
}: TopBarProps) {
  const router = useRouter();

  function handleBack() {
    if (onBack) {
      onBack();
      return;
    }

    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  }

  return (
    <div className={className}>
      <div className="mx-auto flex w-full max-w-7xl items-center px-4 pt-4 md:px-6">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Go back"
          className="inline-flex h-10 w-10 items-center cursor-pointer justify-center rounded-full border border-gray-300 bg-white text-gray-600 transition hover:bg-gray-50 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1"
        >
          <ArrowLeft size={20} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
