"use client";

/**
 * DeleteCustomerButton — same form action + useFormStatus pattern as DeleteChequeButton.
 * See delete-cheque-button.tsx for full pattern explanation.
 */

import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { deleteCustomer } from "@/app/actions/customer-actions";

type DeleteCustomerButtonProps = {
  customerId: number;
  customerName: string;
};

/** Inner button — child of <form> so useFormStatus can subscribe to form state. */
function DeleteButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3.5 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 hover:border-red-300 disabled:opacity-50"
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}

export default function DeleteCustomerButton({
  customerId,
  customerName,
}: DeleteCustomerButtonProps) {
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const confirmed = window.confirm(
      `Are you sure you want to delete "${customerName}"? All cheques belonging to this customer will also be deleted.`
    );
    if (!confirmed) return;

    const formData = new FormData(e.currentTarget);
    const res = await deleteCustomer(Number(formData.get("customerId")));

    if (res.success) {
      toast.success(res.message || "Customer deleted successfully");
      router.push("/customers");
    } else {
      toast.error(res.error || "Failed to delete customer");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input type="hidden" name="customerId" value={customerId} />
      <DeleteButton />
    </form>
  );
}
