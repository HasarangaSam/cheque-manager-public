"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  createCustomer,
  updateCustomer,
} from "@/app/actions/customer-actions";

type CustomerFormData = {
  id?: number;
  name?: string;
  phone?: string;
  address?: string | null;
  notes?: string | null;
};

type CustomerFormProps = {
  mode: "create" | "edit";
  initialData?: CustomerFormData;
};

export default function CustomerForm({ mode, initialData }: CustomerFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      if (mode === "create") {
        const res = await createCustomer(formData);
        if (res.success && res.data) {
          toast.success(res.message || "Customer created successfully!");
          router.push(`/customers/${res.data.id}`);
        } else {
          toast.error(res.error || "Failed to create customer");
        }
      } else {
        const res = await updateCustomer(formData);
        if (res.success && res.data) {
          toast.success(res.message || "Customer updated successfully!");
          router.push(`/customers/${res.data.id}`);
        } else {
          toast.error(res.error || "Failed to update customer");
        }
      }
    });
  }

  const cancelHref =
    mode === "edit" && initialData?.id
      ? `/customers/${initialData.id}`
      : "/customers";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {mode === "edit" && initialData?.id && (
        <input type="hidden" name="id" value={initialData.id} />
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label
            htmlFor="name"
            className="mb-2 block text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--muted)" }}
          >
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            placeholder="e.g. John Silva"
            required
            defaultValue={initialData?.name || ""}
            disabled={isPending}
            className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "#f8fafc",
              color: "var(--foreground)",
            }}
          />
        </div>

        <div>
          <label
            htmlFor="phone"
            className="mb-2 block text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--muted)" }}
          >
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            id="phone"
            name="phone"
            placeholder="e.g. +94 77 123 4567"
            required
            defaultValue={initialData?.phone || ""}
            disabled={isPending}
            className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "#f8fafc",
              color: "var(--foreground)",
            }}
          />
        </div>


        <div>
          <label
            htmlFor="address"
            className="mb-2 block text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--muted)" }}
          >
            Address
          </label>
          <input
            id="address"
            name="address"
            placeholder="e.g. 123 Galle Road, Colombo"
            defaultValue={initialData?.address || ""}
            disabled={isPending}
            className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "#f8fafc",
              color: "var(--foreground)",
            }}
          />
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="notes"
            className="mb-2 block text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--muted)" }}
          >
            Notes & Remarks
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            placeholder="Add any additional notes about this customer..."
            defaultValue={initialData?.notes || ""}
            disabled={isPending}
            className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "#f8fafc",
              color: "var(--foreground)",
            }}
          />
        </div>
      </div>

      <div
        className="flex items-center justify-end gap-3 border-t pt-6"
        style={{ borderColor: "var(--border)" }}
      >
        <Link
          href={cancelHref}
          className="rounded-xl border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-slate-50"
          style={{ borderColor: "var(--border)", color: "var(--muted)" }}
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isPending
            ? "Saving..."
            : mode === "create"
            ? "Save Customer"
            : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
