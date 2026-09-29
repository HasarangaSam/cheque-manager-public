"use client";

/**
 * CustomerForm — useActionState pattern
 *
 * Key patterns demonstrated:
 * 1. useActionState — manages the server action's return state.
 *    The action is bound with .bind() to embed the `mode` into the call.
 * 2. useFormStatus (via <SubmitButton>) — no prop drilling for isPending.
 * 3. Native <form action={formAction}> — no onSubmit, no manual FormData.
 * 4. Inline error display from action state + toast for success.
 */

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import {
  createCustomer,
  updateCustomer,
} from "@/app/actions/customer-actions";
import type { ActionResponse } from "@/types/actions";
import SubmitButton from "@/components/ui/submit-button";

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

const initialState: ActionResponse<{ id: number }> = { success: false };

export default function CustomerForm({ mode, initialData }: CustomerFormProps) {
  const router = useRouter();

  // Bind the correct action for the current mode.
  // .bind() lets us pre-configure the action without losing the
  // (prevState, formData) signature that useActionState requires.
  const action = mode === "create" ? createCustomer : updateCustomer;

  const [state, formAction, isPending] = useActionState(action, initialState);

  // Handle successful submission — navigate and toast
  useEffect(() => {
    if (state.success && state.data) {
      toast.success(state.message || (mode === "create" ? "Customer created!" : "Customer updated!"));
      router.push(`/customers/${state.data.id}`);
    }
  }, [state, mode, router]);

  const cancelHref =
    mode === "edit" && initialData?.id
      ? `/customers/${initialData.id}`
      : "/customers";

  return (
    <form action={formAction} className="space-y-6">
      {mode === "edit" && initialData?.id && (
        <input type="hidden" name="id" value={initialData.id} />
      )}

      {/* Inline error from server action state */}
      {state.error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5 text-red-700 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-red-500" />
          <span className="font-medium">{state.error}</span>
        </div>
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
            Notes &amp; Remarks
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
        {/*
         * SubmitButton reads useFormStatus() internally.
         * No isPending prop needed — it subscribes to the <form> above.
         */}
        <SubmitButton
          label={mode === "create" ? "Save Customer" : "Save Changes"}
          pendingLabel="Saving…"
          className="cursor-pointer"
          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" } as React.CSSProperties}
        />
      </div>
    </form>
  );
}
