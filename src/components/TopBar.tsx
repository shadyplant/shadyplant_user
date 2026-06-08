"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

type TopBarProps = {
  className?: string;
  onBack?: () => void;
};

export default function TopBar({ className = "", onBack }: TopBarProps) {
  const router = useRouter();

  const handleBack = onBack ?? (() => router.back());

  return (
    <div className={className}>
      <div className="mx-auto flex w-full max-w-7xl items-center px-4 pt-4 md:px-6">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Go back"
          className="inline-flex h-10 w-10 items-center justify-center rounded-[0.5rem] border border-[#d9d9d9] bg-white text-[#1f1f1f] transition hover:bg-[#f6f6f6]"
        >
          <ArrowLeft size={20} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
