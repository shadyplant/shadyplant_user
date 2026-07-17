import type { AppProps } from "next/app";
import { AuthProvider } from "@/components/auth/AuthProvider";
import MaintenanceNotice from "@/components/MaintenanceNotice";
import { appMono, appSans } from "@/lib/fonts";
import { isMaintenanceModeEnabled } from "@/lib/siteMode";
import "@/app/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  if (isMaintenanceModeEnabled()) {
    return (
      <div className={`${appSans.variable} ${appMono.variable} min-h-full font-sans`}>
        <MaintenanceNotice />
      </div>
    );
  }

  return (
    <div className={`${appSans.variable} ${appMono.variable} min-h-full font-sans`}>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </div>
  );
}
