import { Suspense } from "react";
import SearchResultsPageClient from "@/components/search/SearchResultsPageClient";

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchResultsPageClient />
    </Suspense>
  );
}
