import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth/AuthProvider";
import SignInPromptModal from "@/components/auth/SignInPromptModal";
import { appMono, appSans } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Grass Green Nursery",
  description: "E-commerce storefront for plants, lawn grass, and nursery essentials.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body
        className={`${appSans.variable} ${appMono.variable} min-h-full flex flex-col font-sans`}
      >
        <AuthProvider>
          {children}
          <SignInPromptModal />
        </AuthProvider>
      </body>
    </html>
  );
}
