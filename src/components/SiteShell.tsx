import type { ReactNode } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/pages/Home/components/7_Section";
import WhatsAppButton from "@/pages/Home/components/Float_Button";

export default function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="theme-shell min-h-screen pt-24 md:pt-28">
      <Navbar />
      <main>{children}</main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
