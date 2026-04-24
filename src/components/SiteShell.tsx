import type { ReactNode } from "react";
import EcomHeader from "@/components/EcomHeader";
import MobileBottomNav from "@/components/MobileBottomNav";
import SiteFooter from "@/components/SiteFooter";

export default function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="theme-shell min-h-screen">
      <EcomHeader />
      <main>{children}</main>
      <SiteFooter />
      <MobileBottomNav />
    </div>
  );
}
