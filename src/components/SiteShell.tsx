import type { ReactNode } from "react";
import EcomHeader from "@/components/EcomHeader";
import MobileBottomNav from "@/components/MobileBottomNav";
import SiteFooter from "@/components/SiteFooter";

type SiteShellProps = {
  children: ReactNode;
  hideMobileHeader?: boolean;
  hideMobileBottomNav?: boolean;
  showFooter?: boolean;
  headerInitialAddress?: string;
};

export default function SiteShell({
  children,
  hideMobileHeader = false,
  hideMobileBottomNav = false,
  showFooter = false,
  headerInitialAddress = "",
}: SiteShellProps) {
  return (
    <div className="theme-shell min-h-screen">
      <div className={hideMobileHeader ? "hidden md:block" : ""}>
        <EcomHeader initialDeliveryAddress={headerInitialAddress} />
      </div>
      <main>{children}</main>
      {showFooter ? <SiteFooter /> : null}
      <div className={hideMobileBottomNav ? "hidden md:block" : ""}>
        <MobileBottomNav />
      </div>
    </div>
  );
}
