import type { Metadata } from "next";
import { Suspense } from "react";
import { AppEnvironmentProvider } from "@/components/app-environment/AppEnvironmentProvider";
import { AuthProvider } from "@/components/auth/AuthProvider";
import PushTokenBridge from "@/components/PushTokenBridge";
import MaintenanceNotice from "@/components/MaintenanceNotice";
import SignInPromptModal from "@/components/auth/SignInPromptModal";
import { appMono, appSans } from "@/lib/fonts";
import { resolveAppEnvironment } from "@/lib/environment";
import { isMaintenanceModeEnabled } from "@/lib/siteMode";
import "./globals.css";


export const metadata: Metadata = {
  title: "ShadyPlant",
  description:
    "E-commerce storefront for plants, lawn grass, and nursery essentials.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const appEnvironment = await resolveAppEnvironment();

  if (isMaintenanceModeEnabled()) {
    return (
      <html
        lang="en"
        className="h-full antialiased"
        data-is-app={appEnvironment.isApp ? "true" : "false"}
        data-app-platform={appEnvironment.platform}
      >
        <body
          className={`${appSans.variable} ${appMono.variable} min-h-full flex flex-col font-sans`}
        >
          <AppEnvironmentProvider initialEnvironment={appEnvironment}>
            <MaintenanceNotice />
          </AppEnvironmentProvider>
        </body>
      </html>
    );
  }

  return (
    <html
      lang="en"
      className="h-full antialiased"
      data-is-app={appEnvironment.isApp ? "true" : "false"}
      data-app-platform={appEnvironment.platform}
    >
      <body
        className={`${appSans.variable} ${appMono.variable} min-h-full flex flex-col font-sans`}
      >
        
        <AppEnvironmentProvider initialEnvironment={appEnvironment}>
          <AuthProvider>
            {children}
            <PushTokenBridge />
            <Suspense fallback={null}>
              <SignInPromptModal />
            </Suspense>
          </AuthProvider>
        </AppEnvironmentProvider>
      </body>
    </html>
  );
}
