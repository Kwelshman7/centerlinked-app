import { useRef } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import SearchWorkPage from "@/pages/app/SearchResults";
import { hasSearchCriteria, restoreSearchHref, searchWorkHref } from "@/lib/search-session";

/** Old /app/search/results bookmarks keep working. */
export function SearchResultsRedirect() {
  const [params] = useSearchParams();
  return <Navigate to={searchWorkHref(params)} replace />;
}

export default function Search() {
  const [params] = useSearchParams();
  const didRestore = useRef(false);

  if (!didRestore.current && !hasSearchCriteria(params)) {
    didRestore.current = true;
    const dest = restoreSearchHref();
    if (dest) return <Navigate to={dest} replace />;
  }
  didRestore.current = true;

  return <SearchWorkPage />;
}
