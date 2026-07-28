import type { ReactNode } from "react";
import EcomHeader from "@/components/EcomHeader";
import MobileBottomNav from "@/components/MobileBottomNav";
import SiteFooter from "@/components/SiteFooter";

type SiteShellProps = {
  children: ReactNode;
  hideHeader?: boolean;
  hideMobileHeader?: boolean;
  hideMobileBottomNav?: boolean;
  showFooter?: boolean;
  headerInitialAddress?: string;
};

export default function SiteShell({
  children,
  hideHeader = false,
  hideMobileHeader = false,
  hideMobileBottomNav = false,
  showFooter = false,
  headerInitialAddress = "",
}: SiteShellProps) {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {!hideHeader ? (
        <div className={hideMobileHeader ? "hidden md:block" : ""}>
          <EcomHeader initialDeliveryAddress={headerInitialAddress} />
        </div>
      ) : null}
      <main className="overflow-x-hidden">{children}</main>
      {showFooter ? <SiteFooter /> : null}
      <div className={hideMobileBottomNav ? "hidden md:block" : ""}>
        <MobileBottomNav />
      </div>
    </div>
  );
}
