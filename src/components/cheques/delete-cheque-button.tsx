"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteCheque } from "@/app/actions/cheque-actions";
import { Trash2, Loader2 } from "lucide-react";

type DeleteChequeButtonProps = {
  chequeId: number;
};

export default function DeleteChequeButton({
  chequeId,
}: DeleteChequeButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    const confirmed = window.confirm("Are you sure you want to delete this cheque?");
    if (!confirmed) return;

    startTransition(async () => {
      const res = await deleteCheque(chequeId);
      if (res.success) {
        toast.success(res.message || "Cheque deleted successfully");
        router.push("/cheques");
      } else {
        toast.error(res.error || "Failed to delete cheque");
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
      {isPending ? "Deleting..." : "Delete Cheque"}
    </button>
  );
}
