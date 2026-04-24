import { Suspense } from "react";
import ProfilePageClient from "@/components/profile/ProfilePageClient";

export default function ProfilePage() {
  return (
    <Suspense fallback={null}>
      <ProfilePageClient />
    </Suspense>
  );
}
