import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ResourcesPaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  tab?: string;
  status?: string;
  search?: string;
}

export function ResourcesPagination({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  tab = "all",
  status,
  search,
}: ResourcesPaginationProps) {
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  function getPageUrl(p: number) {
    const params = new URLSearchParams();
    if (tab && tab !== "all") params.set("tab", tab);
    if (status && status !== "all") params.set("status", status);
    if (search) params.set("search", search);
    params.set("page", p.toString());
    return `/resources?${params.toString()}`;
  }

  // Generate page numbers to show
  const pages: number[] = [];
  const maxButtons = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
  const endPage = Math.min(totalPages, startPage + maxButtons - 1);

  if (endPage - startPage + 1 < maxButtons) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="py-3.5 px-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
      <span>
        Showing {startItem} to {endItem} of {totalCount} resources
      </span>

      <div className="flex items-center gap-1.5 font-medium">
        {/* Previous Button */}
        {currentPage > 1 ? (
          <Link
            href={getPageUrl(currentPage - 1)}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
        ) : (
          <span className="p-1.5 rounded-lg text-muted-foreground/40 cursor-not-allowed">
            <ChevronLeft className="w-4 h-4" />
          </span>
        )}

        {/* Page Numbers */}
        {pages.map((p) => {
          const isActive = p === currentPage;
          return isActive ? (
            <span
              key={p}
              className="px-3 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-foreground font-bold shadow-xs select-none"
            >
              {p}
            </span>
          ) : (
            <Link
              key={p}
              href={getPageUrl(p)}
              className="px-3 py-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              {p}
            </Link>
          );
        })}

        {/* Next Button */}
        {currentPage < totalPages ? (
          <Link
            href={getPageUrl(currentPage + 1)}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </Link>
        ) : (
          <span className="p-1.5 rounded-lg text-muted-foreground/40 cursor-not-allowed">
            <ChevronRight className="w-4 h-4" />
          </span>
        )}
      </div>
    </div>
  );
}
