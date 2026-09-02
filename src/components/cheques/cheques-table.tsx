"use client";

import { useState, useMemo, useTransition, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Eye,
  Edit2,
  Trash2,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Filter,
  Loader2,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import StatusBadge from "@/components/ui/status-badge";
import QuickStatusSelector from "@/components/cheques/quick-status-selector";
import PaginationControls from "@/components/ui/pagination-controls";
import { deleteCheque } from "@/app/actions/cheque-actions";
import type { ChequeStatus, ChequeAttentionStatus } from "@/lib/cheque-status";

export type SerializedCheque = {
  id: number;
  chequeNumber: string;
  bank: string;
  amount: number;
  dueDate: string; // ISO string
  status: ChequeStatus;
  notes: string | null;
  attentionStatus: ChequeAttentionStatus;
  urgencyText: string;
  daysDifference: number;
  customer: {
    id: number;
    name: string;
    phone?: string;
  };
};

export type StatusCounts = {
  ALL: number;
  OVERDUE: number;
  DUE_SOON: number;
  UPCOMING: number;
  CLEARED: number;
  BOUNCED: number;
};

type ChequesTableProps = {
  cheques: SerializedCheque[];
  showCustomerColumn?: boolean;
  totalCount?: number;
  currentPage?: number;
  pageSize?: number;
  searchQuery?: string;
  currentStatusFilter?: string;
  statusCounts?: StatusCounts;
  defaultPageSize?: number;
};

export default function ChequesTable({
  cheques,
  showCustomerColumn = true,
  totalCount,
  currentPage = 1,
  pageSize = 50,
  searchQuery = "",
  currentStatusFilter = "ALL",
  statusCounts,
  defaultPageSize = 50,
}: ChequesTableProps) {
  const isServerDriven = totalCount !== undefined;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(searchQuery);
  const [clientStatusFilter, setClientStatusFilter] =
    useState<string>("ALL");
  const [clientCurrentPage, setClientCurrentPage] = useState(1);
  const [clientPageSize, setClientPageSize] = useState(defaultPageSize);

  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Sync state if server search query changes
  useEffect(() => {
    if (isServerDriven) {
      setSearchTerm(searchQuery);
    }
  }, [searchQuery, isServerDriven]);

  // Debounced search when server-driven
  useEffect(() => {
    if (!isServerDriven) return;
    if (searchTerm === searchQuery) return;

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchTerm.trim()) {
        params.set("q", searchTerm.trim());
      } else {
        params.delete("q");
      }
      params.set("page", "1");

      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, searchQuery, pathname, router, searchParams, isServerDriven]);

  const handleStatusFilterChange = (status: string) => {
    if (isServerDriven) {
      const params = new URLSearchParams(searchParams.toString());
      if (status === "ALL") {
        params.set("status", "ALL");
      } else {
        params.set("status", status);
      }
      params.set("page", "1");
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    } else {
      setClientStatusFilter(status);
      setClientCurrentPage(1);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (isServerDriven) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(newPage));
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    } else {
      setClientCurrentPage(newPage);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    if (isServerDriven) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("pageSize", String(newSize));
      params.set("page", "1");
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    } else {
      setClientPageSize(newSize);
      setClientCurrentPage(1);
    }
  };

  // Client-side fallback counts and filtering
  const clientCounts = useMemo(() => {
    return {
      ALL: cheques.length,
      OVERDUE: cheques.filter((c) => c.attentionStatus === "OVERDUE").length,
      DUE_SOON: cheques.filter((c) => c.attentionStatus === "DUE_SOON").length,
      UPCOMING: cheques.filter((c) => c.attentionStatus === "UPCOMING").length,
      CLEARED: cheques.filter((c) => c.status === "CLEARED").length,
      BOUNCED: cheques.filter((c) => c.status === "BOUNCED").length,
    };
  }, [cheques]);

  const clientFilteredCheques = useMemo(() => {
    if (isServerDriven) return cheques;

    return cheques.filter((cheque) => {
      if (
        clientStatusFilter === "OVERDUE" &&
        cheque.attentionStatus !== "OVERDUE"
      )
        return false;
      if (
        clientStatusFilter === "DUE_SOON" &&
        cheque.attentionStatus !== "DUE_SOON"
      )
        return false;
      if (
        clientStatusFilter === "UPCOMING" &&
        cheque.attentionStatus !== "UPCOMING"
      )
        return false;
      if (clientStatusFilter === "CLEARED" && cheque.status !== "CLEARED")
        return false;
      if (clientStatusFilter === "BOUNCED" && cheque.status !== "BOUNCED")
        return false;
      if (clientStatusFilter === "PENDING" && cheque.status !== "PENDING")
        return false;

      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        cheque.chequeNumber.toLowerCase().includes(term) ||
        cheque.bank.toLowerCase().includes(term) ||
        cheque.customer.name.toLowerCase().includes(term) ||
        (cheque.notes && cheque.notes.toLowerCase().includes(term))
      );
    });
  }, [cheques, clientStatusFilter, searchTerm, isServerDriven]);

  const activeCounts =
    isServerDriven && statusCounts ? statusCounts : clientCounts;
  const activeStatusFilter = isServerDriven
    ? currentStatusFilter
    : clientStatusFilter;
  const activePage = isServerDriven ? currentPage : clientCurrentPage;
  const activePageSize = isServerDriven ? pageSize : clientPageSize;
  const activeTotalItems = isServerDriven
    ? (totalCount ?? cheques.length)
    : clientFilteredCheques.length;
  const totalPages = Math.ceil(activeTotalItems / activePageSize) || 1;

  const displayCheques = useMemo(() => {
    if (isServerDriven) return cheques;
    const start = (clientCurrentPage - 1) * clientPageSize;
    return clientFilteredCheques.slice(start, start + clientPageSize);
  }, [
    isServerDriven,
    cheques,
    clientFilteredCheques,
    clientCurrentPage,
    clientPageSize,
  ]);

  function handleDelete(id: number, chequeNumber: string) {
    const confirmed = window.confirm(
      `Are you sure you want to delete Cheque "${chequeNumber}"? This action cannot be undone.`,
    );
    if (!confirmed) return;

    setDeletingId(id);
    startTransition(async () => {
      const res = await deleteCheque(id);
      if (res.success) {
        toast.success(res.message || `Cheque "${chequeNumber}" deleted`);
      } else {
        toast.error(res.error || "Failed to delete cheque");
      }
      setDeletingId(null);
    });
  }

  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      if (isServerDriven) {
        const params = new URLSearchParams();
        if (searchTerm.trim()) {
          params.set("q", searchTerm.trim());
        }
        if (activeStatusFilter) {
          params.set("status", activeStatusFilter);
        }

        const res = await fetch(`/api/cheques/export?${params.toString()}`);
        if (!res.ok) {
          throw new Error("Failed to generate CSV export");
        }

        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `cheques-${activeStatusFilter.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        toast.success("Cheques exported to CSV successfully");
      } else {
        const escapeCsvValue = (value: string | number | null | undefined) => {
          const normalized = value === null || value === undefined ? "" : String(value);
          const safe = /^[=+\-@]/.test(normalized) ? `'${normalized}` : normalized;
          return `"${safe.replaceAll('"', '""')}"`;
        };

        const header = [
          "Cheque Number",
          "Customer",
          "Phone",
          "Bank",
          "Amount (LKR)",
          "Due Date",
          "Status",
          "Notes",
        ];

        const rows = clientFilteredCheques.map((cheque) => [
          cheque.chequeNumber,
          cheque.customer.name,
          cheque.customer.phone || "",
          cheque.bank,
          cheque.amount.toFixed(2),
          new Date(cheque.dueDate).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          }),
          cheque.status,
          cheque.notes || "",
        ]);

        const csv = [header, ...rows]
          .map((row) => row.map(escapeCsvValue).join(","))
          .join("\r\n");

        const blob = new Blob([`\uFEFF${csv}`], {
          type: "text/csv;charset=utf-8;",
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `cheques-${activeStatusFilter.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        toast.success("Cheques exported to CSV successfully");
      }
    } catch (err) {
      toast.error("Failed to export cheques");
    } finally {
      setIsExporting(false);
    }
  };

  const fmt = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 2,
    }).format(amount);

  return (
    <div className="space-y-4">
      {/* Controls Bar: Search & Status Tabs */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Search */}
        <div className="relative w-full lg:max-w-xs">
          {isPending ? (
            <Loader2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
          ) : (
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          )}
          <input
            type="text"
            placeholder="Search cheque #, customer, bank..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm"
          />
        </div>

        {/* Status Filter Tabs (Scrollable on mobile) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 max-w-full rounded-xl border border-slate-200 bg-slate-100/80 p-1 shrink-0 scrollbar-none">
          {[
            { id: "ALL", label: "All", count: activeCounts.ALL, alert: false },
            {
              id: "DUE_SOON",
              label: "Due Soon",
              count: activeCounts.DUE_SOON,
              alert: activeCounts.DUE_SOON > 0,
              badgeBg: "bg-amber-600 text-white",
            },
            {
              id: "OVERDUE",
              label: "Overdue",
              count: activeCounts.OVERDUE,
              alert: activeCounts.OVERDUE > 0,
              badgeBg: "bg-red-600 text-white",
            },
            {
              id: "BOUNCED",
              label: "Bounced",
              count: activeCounts.BOUNCED,
              alert: activeCounts.BOUNCED > 0,
              badgeBg: "bg-rose-600 text-white",
            },
            {
              id: "UPCOMING",
              label: "Upcoming",
              count: activeCounts.UPCOMING,
              alert: false,
            },
            {
              id: "CLEARED",
              label: "Cleared",
              count: activeCounts.CLEARED,
              alert: false,
            },
          ].map((tab) => {
            const isActive = activeStatusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleStatusFilterChange(tab.id)}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    tab.alert
                      ? tab.badgeBg
                      : isActive
                        ? "bg-slate-100 text-slate-800"
                        : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}

          <div className="h-4 w-px bg-slate-300 mx-0.5 shrink-0" />
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={isExporting}
            title="Export filtered cheques to CSV"
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap text-slate-700 hover:text-indigo-600 hover:bg-white transition-all cursor-pointer border border-transparent hover:border-slate-200/80 hover:shadow-sm disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-500" />
            ) : (
              <Download className="h-3.5 w-3.5 text-slate-600" />
            )}
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Cheques Data Table */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        {displayCheques.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <Filter className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm font-semibold text-slate-700">
              No cheques found
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {searchTerm
                ? "Try adjusting your search criteria"
                : "No cheques matching the selected filter."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                    Cheque #
                  </th>
                  {showCustomerColumn && (
                    <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                      Customer
                    </th>
                  )}
                  <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                    Bank
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                    Due Date & Status
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                    Quick Update
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayCheques.map((cheque) => {
                  const isOverdue = cheque.attentionStatus === "OVERDUE";
                  const isDueSoon = cheque.attentionStatus === "DUE_SOON";

                  return (
                    <tr
                      key={cheque.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isOverdue
                          ? "bg-red-50/30"
                          : isDueSoon
                            ? "bg-amber-50/20"
                            : ""
                      }`}
                    >
                      {/* Cheque # */}
                      <td className="px-4 py-3">
                        <Link
                          href={`/cheques/${cheque.id}`}
                          className="font-mono text-xs font-bold text-slate-900 hover:text-indigo-600 hover:underline"
                        >
                          {cheque.chequeNumber}
                        </Link>
                      </td>

                      {/* Customer */}
                      {showCustomerColumn && (
                        <td className="px-4 py-3">
                          <Link
                            href={`/customers/${cheque.customer.id}`}
                            className="font-medium text-slate-800 hover:text-indigo-600 hover:underline"
                          >
                            {cheque.customer.name}
                          </Link>
                          {cheque.customer.phone && (
                            <p className="text-[11px] text-slate-500">
                              {cheque.customer.phone}
                            </p>
                          )}
                        </td>
                      )}

                      {/* Bank */}
                      <td className="px-4 py-3 text-slate-700 font-medium text-xs">
                        {cheque.bank}
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3 font-bold text-slate-900 text-sm">
                        {fmt(cheque.amount)}
                      </td>

                      {/* Due Date & Urgency Status */}
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-slate-700">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            <span className="font-medium">
                              {new Date(cheque.dueDate).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  timeZone: "UTC",
                                },
                              )}
                            </span>
                          </div>
                          {cheque.status === "PENDING" && (
                            <div className="flex items-center gap-1">
                              {isOverdue && (
                                <AlertTriangle className="h-3 w-3 text-red-600 shrink-0" />
                              )}
                              <span
                                className={`text-[11px] font-semibold ${
                                  isOverdue
                                    ? "text-red-700"
                                    : isDueSoon
                                      ? "text-amber-700"
                                      : "text-slate-500"
                                }`}
                              >
                                {cheque.urgencyText}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Quick Status Update */}
                      <td className="px-4 py-3">
                        <QuickStatusSelector
                          chequeId={cheque.id}
                          currentStatus={cheque.status}
                        />
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* View */}
                          <Link
                            href={`/cheques/${cheque.id}`}
                            title="View Cheque"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Link>

                          {/* Edit */}
                          <Link
                            href={`/cheques/${cheque.id}/edit`}
                            title="Edit Cheque"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Link>

                          {/* Delete */}
                          <button
                            type="button"
                            disabled={deletingId === cheque.id}
                            onClick={() =>
                              handleDelete(cheque.id, cheque.chequeNumber)
                            }
                            title="Delete Cheque"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 disabled:opacity-50"
                          >
                            {deletingId === cheque.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {activeTotalItems > 0 && (
          <PaginationControls
            currentPage={activePage}
            totalPages={totalPages}
            totalItems={activeTotalItems}
            pageSize={activePageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            pageSizeOptions={[25, 50, 100]}
          />
        )}
      </div>
    </div>
  );
}
