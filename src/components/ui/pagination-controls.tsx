"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

type PaginationControlsProps = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
};

export default function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [50, 100, 200],
}: PaginationControlsProps) {
  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers to show with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 3) {
        start = 2;
        end = 4;
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - 3;
        end = totalPages - 1;
      }

      if (start > 2) {
        pages.push("...");
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        pages.push("...");
      }

      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/70 text-xs text-slate-600">
      {/* Left: Results counter & Page Size Selector */}
      <div className="flex items-center gap-3">
        <span>
          Showing <strong className="font-semibold text-slate-900">{startItem}</strong> to{" "}
          <strong className="font-semibold text-slate-900">{endItem}</strong> of{" "}
          <strong className="font-semibold text-slate-900">{totalItems}</strong> entries
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 ml-2 border-l border-slate-200 pl-3">
            <span className="text-slate-500">Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              aria-label="Items per page"
              className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 outline-none focus:border-slate-400 font-medium"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Page Navigation Buttons */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          {/* First Page */}
          <button
            type="button"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            title="First Page"
            aria-label="First Page"
            className="inline-flex h-8 w-8 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronsLeft className="h-3.5 w-3.5" />
          </button>

          {/* Previous Page */}
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            title="Previous Page"
            aria-label="Previous Page"
            className="inline-flex h-8 w-8 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>

          {/* Page numbers */}
          <div className="flex items-center gap-1 mx-1">
            {getPageNumbers().map((page, idx) => {
              if (page === "...") {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-1.5 py-1 text-slate-400 font-bold select-none"
                  >
                    ...
                  </span>
                );
              }

              const isCurrent = currentPage === page;
              return (
                <button
                  key={`page-${page}`}
                  type="button"
                  onClick={() => onPageChange(Number(page))}
                  className={`inline-flex h-8 min-w-8 px-2 items-center justify-center rounded text-xs font-semibold transition-all ${
                    isCurrent
                      ? "bg-slate-900 text-white shadow-sm"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {page}
                </button>
              );
            })}
          </div>

          {/* Next Page */}
          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            title="Next Page"
            aria-label="Next Page"
            className="inline-flex h-8 w-8 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>

          {/* Last Page */}
          <button
            type="button"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            title="Last Page"
            aria-label="Last Page"
            className="inline-flex h-8 w-8 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronsRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
