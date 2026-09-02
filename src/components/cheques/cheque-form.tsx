"use client";

import { useTransition, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, Search, User, X } from "lucide-react";
import { createCheque, updateCheque } from "@/app/actions/cheque-actions";
import { getCustomersForSelection } from "@/app/actions/customer-actions";
import type { ChequeStatus } from "@/lib/cheque-status";

type ChequeFormData = {
  id?: number;
  chequeNumber?: string;
  bank?: string;
  amount?: number | string;
  status?: ChequeStatus;
  dueDate?: string | Date;
  notes?: string | null;
};

type CustomerOption = {
  id: number;
  name: string;
  phone: string;
};

type ChequeFormProps = {
  mode: "create" | "edit";
  customerId?: number;
  customerName?: string;
  initialData?: ChequeFormData;
  customers?: CustomerOption[];
};

function formatDate(date?: string | Date) {
  if (!date) return "";
  if (typeof date === "string") {
    return date.slice(0, 10);
  }
  return date.toISOString().slice(0, 10);
}

// Format a numeric string with thousand-separator commas, preserving a trailing decimal point/digits
function formatAmountDisplay(raw: string): string {
  if (!raw) return "";
  // Split on the first decimal point
  const [intPart, decPart] = raw.split(".");
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decPart !== undefined ? `${formatted}.${decPart}` : formatted;
}

// Strip commas and return the raw decimal string suitable for submission
function stripCommas(value: string): string {
  return value.replace(/,/g, "");
}

export default function ChequeForm({
  mode,
  customerId,
  customerName,
  initialData,
  customers,
}: ChequeFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // ── Amount formatting state ──
  const initialAmountRaw =
    initialData?.amount !== undefined ? String(initialData.amount) : "";
  const [amountDisplay, setAmountDisplay] = useState(
    formatAmountDisplay(initialAmountRaw)
  );
  const [rawAmount, setRawAmount] = useState(initialAmountRaw);

  const [customerList, setCustomerList] = useState<CustomerOption[]>(customers || []);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounced real-time server search (limited to top 10 results)
  useEffect(() => {
    if (customers === undefined) return;

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const fresh = await getCustomersForSelection(searchTerm, 10);
        setCustomerList(fresh || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchTerm, customers]);

  const refreshCustomers = async () => {
    try {
      setIsSearching(true);
      const fresh = await getCustomersForSelection(searchTerm, 10);
      if (fresh) setCustomerList(fresh);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Validate customer selection if in search mode
    if (customers && !selectedCustomer) {
      toast.error("Please select a customer");
      return;
    }

    // Validate amount
    if (!rawAmount || isNaN(Number(rawAmount)) || Number(rawAmount) <= 0) {
      toast.error("Please enter a valid amount greater than zero");
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      if (mode === "create") {
        const res = await createCheque(formData);
        if (res.success && res.data) {
          toast.success(res.message || "Cheque created successfully!");
          if (customerId) {
            router.push(`/customers/${customerId}`);
          } else {
            router.push("/cheques");
          }
        } else {
          toast.error(res.error || "Failed to create cheque");
        }
      } else {
        const res = await updateCheque(formData);
        if (res.success && res.data) {
          toast.success(res.message || "Cheque updated successfully!");
          router.push(`/cheques/${res.data.id}`);
        } else {
          toast.error(res.error || "Failed to update cheque");
        }
      }
    });
  }

  const cancelHref =
    mode === "edit" && initialData?.id
      ? `/cheques/${initialData.id}`
      : customerId
      ? `/customers/${customerId}`
      : "/cheques";

  // Determine the customerId to use in the hidden input
  const resolvedCustomerId = customers ? selectedCustomer?.id : customerId;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {mode === "create" ? (
        <input
          type="hidden"
          name="customerId"
          value={resolvedCustomerId ?? ""}
        />
      ) : (
        <input type="hidden" name="id" value={initialData?.id} />
      )}

      <div className="grid gap-6 sm:grid-cols-2">

        {/* ── Customer Selector ── */}
        {mode === "create" && customers ? (
          /* Searchable Customer Picker */
          <div className="sm:col-span-2" ref={searchRef}>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Customer <span className="text-red-500">*</span>
            </label>

            {selectedCustomer ? (
              /* Selected customer chip */
              <div className="flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 shrink-0">
                    <User className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{selectedCustomer.name}</p>
                    <p className="text-xs text-slate-500">{selectedCustomer.phone}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCustomer(null);
                    setSearchTerm("");
                    setTimeout(() => setDropdownOpen(true), 0);
                  }}
                  className="ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-indigo-100 hover:text-slate-700 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              /* Search input + dropdown */
              <div className="relative">
                {isSearching ? (
                  <Loader2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-indigo-500" />
                ) : (
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                )}
                <input
                  type="text"
                  placeholder="Search customer by name or phone..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setDropdownOpen(true);
                  }}
                  onFocus={() => {
                    refreshCustomers();
                    setDropdownOpen(true);
                  }}
                  disabled={isPending}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3.5 text-sm text-slate-900 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
                />

                {dropdownOpen && (
                  <div className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                    {customerList.length === 0 ? (
                      <p className="px-4 py-3 text-xs text-slate-500">
                        {isSearching
                          ? "Searching customers..."
                          : searchTerm.trim()
                          ? "No customers match your search."
                          : "No customers found. Add a customer first."}
                      </p>
                    ) : (
                      <ul className="max-h-52 overflow-y-auto divide-y divide-slate-100">
                        {customerList.map((c) => (
                          <li key={c.id}>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCustomer(c);
                                setSearchTerm("");
                                setDropdownOpen(false);
                              }}
                              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left transition-colors hover:bg-indigo-50"
                            >
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                                <User className="h-3.5 w-3.5" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-900">{c.name}</p>
                                <p className="text-xs text-slate-500">{c.phone}</p>
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : mode === "create" && customerName ? (
          /* Locked customer (old behaviour – coming from customer profile page) */
          <div className="sm:col-span-2">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Customer
            </label>
            <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5">
              <User className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="text-sm font-semibold text-slate-700">{customerName}</span>
            </div>
          </div>
        ) : null}

        {/* ── Cheque Number ── */}
        <div>
          <label
            htmlFor="chequeNumber"
            className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-600"
          >
            Cheque Number <span className="text-red-500">*</span>
          </label>
          <input
            id="chequeNumber"
            name="chequeNumber"
            placeholder="e.g. CHQ-100234"
            required
            defaultValue={initialData?.chequeNumber || ""}
            disabled={isPending}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-500/20 disabled:opacity-60"
          />
        </div>

        {/* ── Bank Name ── */}
        <div>
          <label
            htmlFor="bank"
            className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-600"
          >
            Bank Name <span className="text-red-500">*</span>
          </label>
          <input
            id="bank"
            name="bank"
            placeholder="e.g. Commercial Bank, Sampath Bank"
            required
            defaultValue={initialData?.bank || ""}
            disabled={isPending}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-500/20 disabled:opacity-60"
          />
        </div>

        {/* ── Amount ── */}
        <div>
          <label
            htmlFor="amount"
            className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-600"
          >
            Amount (LKR) <span className="text-red-500">*</span>
          </label>
          {/* Hidden input carries the raw value to the server action */}
          <input type="hidden" name="amount" value={rawAmount} />
          {/* Visible formatted display input */}
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
              LKR
            </span>
            <input
              id="amount"
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={amountDisplay}
              disabled={isPending}
              onChange={(e) => {
                const raw = stripCommas(e.target.value);
                // Allow only digits and at most one decimal point with up to 2 places
                if (raw === "" || /^\d*(\.\d{0,2})?$/.test(raw)) {
                  setRawAmount(raw);
                  setAmountDisplay(formatAmountDisplay(raw));
                }
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-12 pr-3.5 text-sm text-slate-900 outline-none transition-all focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-500/20 disabled:opacity-60"
            />
          </div>
        </div>

        {/* ── Status (edit mode only) ── */}
        {mode === "edit" && (
          <div>
            <label
              htmlFor="status"
              className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-600"
            >
              Cheque Status <span className="text-red-500">*</span>
            </label>
            <select
              id="status"
              name="status"
              defaultValue={initialData?.status || "PENDING"}
              disabled={isPending}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-500/20 disabled:opacity-60"
            >
              <option value="PENDING">Pending</option>
              <option value="CLEARED">Cleared</option>
              <option value="BOUNCED">Bounced</option>
            </select>
          </div>
        )}

        {/* ── Due Date ── */}
        <div>
          <label
            htmlFor="dueDate"
            className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-600"
          >
            Due / Realization Date <span className="text-red-500">*</span>
          </label>
          <input
            id="dueDate"
            name="dueDate"
            type="date"
            required
            defaultValue={formatDate(initialData?.dueDate)}
            disabled={isPending}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-500/20 disabled:opacity-60"
          />
        </div>

        {/* ── Notes ── */}
        <div className="sm:col-span-2">
          <label
            htmlFor="notes"
            className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-600"
          >
            Notes &amp; Details
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            placeholder="e.g. Invoice #1024 payment, drawer details..."
            defaultValue={initialData?.notes || ""}
            disabled={isPending}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-500/20 disabled:opacity-60"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-6">
        <Link
          href={cancelHref}
          className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)" }}
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isPending
            ? "Saving..."
            : mode === "create"
            ? "Save Cheque"
            : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
