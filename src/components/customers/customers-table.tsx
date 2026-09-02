"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Eye,
  Edit2,
  Trash2,
  Users,
  CreditCard,
  Phone,
  Loader2,
  ChevronRight,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import PaginationControls from "@/components/ui/pagination-controls";
import { deleteCustomer } from "@/app/actions/customer-actions";

export type SerializedCustomer = {
  id: number;
  name: string;
  phone: string;
  address: string | null;
  notes: string | null;
  totalChequesCount: number;
  pendingChequesCount: number;
  pendingValue: number;
};

type CustomersTableProps = {
  customers: SerializedCustomer[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  searchQuery?: string;
};

export default function CustomersTable({
  customers,
  totalCount,
  currentPage,
  pageSize,
  searchQuery = "",
}: CustomersTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(searchQuery);
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Sync search input if URL changes externally
  useEffect(() => {
    setSearchTerm(searchQuery);
  }, [searchQuery]);

  // Debounced server search via URL update
  useEffect(() => {
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
  }, [searchTerm, searchQuery, pathname, router, searchParams]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  const handlePageSizeChange = (newPageSize: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("pageSize", String(newPageSize));
    params.set("page", "1");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  function handleDelete(id: number, name: string) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${name}" and all associated cheques? This action cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingId(id);
    startTransition(async () => {
      const res = await deleteCustomer(id);
      if (res.success) {
        toast.success(res.message || `Customer "${name}" deleted`);
      } else {
        toast.error(res.error || "Failed to delete customer");
      }
      setDeletingId(null);
    });
  }

  const fmt = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 2,
    }).format(amount);

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          {isPending ? (
            <Loader2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
          ) : (
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          )}
          <input
            type="text"
            placeholder="Search customers by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Total: <span className="font-bold text-slate-800">{totalCount}</span> customer{totalCount !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Customers Data Table */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {customers.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <Filter className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm font-semibold text-slate-700">No customers found</p>
            <p className="mt-1 text-xs text-slate-500">
              {searchQuery
                ? "Try adjusting your search terms"
                : "No customers in the directory."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-600">
                    Customer
                  </th>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-600">
                    Contact Details
                  </th>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-600">
                    Cheques Count
                  </th>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-600">
                    Pending Value
                  </th>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-right text-slate-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* Name & Address */}
                    <td className="px-5 py-4">
                      <Link
                        href={`/customers/${customer.id}`}
                        className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors inline-flex items-center gap-1.5"
                      >
                        <span>{customer.name}</span>
                        <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500" />
                      </Link>
                      {customer.address && (
                        <p className="text-xs text-slate-500 truncate max-w-xs mt-0.5">
                          {customer.address}
                        </p>
                      )}
                    </td>

                    {/* Contact */}
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-slate-700">
                          <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="font-mono">{customer.phone}</span>
                        </div>
                      </div>
                    </td>

                    {/* Cheques Count */}
                    <td className="px-5 py-4">
                      <div className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        <CreditCard className="h-3.5 w-3.5 text-slate-500" />
                        <span>{customer.totalChequesCount} Cheque{customer.totalChequesCount !== 1 ? "s" : ""}</span>
                      </div>
                      {customer.pendingChequesCount > 0 && (
                        <p className="text-[11px] text-amber-600 font-medium mt-1">
                          {customer.pendingChequesCount} pending
                        </p>
                      )}
                    </td>

                    {/* Pending Value */}
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 text-sm">
                        {fmt(customer.pendingValue)}
                      </div>
                      <p className="text-[11px] text-slate-400">Total Pending</p>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* View */}
                        <Link
                          href={`/customers/${customer.id}`}
                          title="View Customer Profile & Cheques"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Link>

                        {/* Edit */}
                        <Link
                          href={`/customers/${customer.id}/edit`}
                          title="Edit Customer"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Link>

                        {/* Delete */}
                        <button
                          type="button"
                          disabled={deletingId === customer.id}
                          onClick={() => handleDelete(customer.id, customer.name)}
                          title="Delete Customer"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 disabled:opacity-50 transition-colors"
                        >
                          {deletingId === customer.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {totalCount > 0 && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalCount}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            pageSizeOptions={[25, 50, 100]}
          />
        )}
      </div>
    </div>
  );
}
