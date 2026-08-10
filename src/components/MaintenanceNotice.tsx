"use client";

import { TriangleAlert } from "lucide-react";
import { getMaintenanceMessage } from "@/lib/siteMode";

export default function MaintenanceNotice() {
  return (
    <main className="min-h-screen px-4 py-10 text-gray-800">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-3xl items-center justify-center">
        <section className="w-full rounded-2xl border border-[#dbe8cd] bg-white px-6 py-8 text-center shadow-[0_18px_50px_rgba(33,79,20,0.08)] sm:px-10 sm:py-12">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#edf5e1] text-[#214f14]">
            <TriangleAlert size={28} strokeWidth={2.2} />
          </div>
          <h1 className="mt-5 text-3xl font-semibold text-[#163915]">
            We&apos;ll be back shortly
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-[#4f6654]">
            {getMaintenanceMessage()}
          </p>
          <p className="mt-6 text-sm font-medium text-[#5c7752]">
            Please try again in a few minutes.
          </p>
        </section>
      </div>
    </main>
  );
}
