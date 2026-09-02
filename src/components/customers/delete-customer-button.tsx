"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { deleteCustomer } from "@/app/actions/customer-actions";

type DeleteCustomerButtonProps = {
  customerId: number;
  customerName: string;
};

export default function DeleteCustomerButton({
  customerId,
  customerName,
}: DeleteCustomerButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${customerName}"? All cheques belonging to this customer will also be deleted.`
    );

    if (!confirmed) return;

    startTransition(async () => {
      const res = await deleteCustomer(customerId);
      if (res.success) {
        toast.success(res.message || "Customer deleted successfully");
        router.push("/customers");
      } else {
        toast.error(res.error || "Failed to delete customer");
      }
    });
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={handleDelete}
      className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3.5 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 hover:border-red-300 disabled:opacity-50"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
      {isPending ? "Deleting..." : "Delete"}
    </button>
  );
}
