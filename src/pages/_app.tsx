import type { AppProps } from "next/app";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { appMono, appSans } from "@/lib/fonts";
import "@/app/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className={`${appSans.variable} ${appMono.variable} min-h-full font-sans`}>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </div>
  );
}
