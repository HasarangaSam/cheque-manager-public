"use client";

/**
 * DeleteChequeButton — form action pattern with useFormStatus
 *
 * For delete operations we use a <form> with a bound server action.
 * The confirm dialog is kept client-side for UX safety.
 *
 * Note: useFormStatus must live in a child component of the <form>.
 * That's why the button is extracted into a separate inner component.
 */

import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteCheque } from "@/app/actions/cheque-actions";
import { Trash2, Loader2 } from "lucide-react";
import { useRef } from "react";

type DeleteChequeButtonProps = {
  chequeId: number;
};

/** Inner button — must be a child of <form> to use useFormStatus. */
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
      {pending ? "Deleting…" : "Delete Cheque"}
    </button>
  );
}

export default function DeleteChequeButton({ chequeId }: DeleteChequeButtonProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const confirmed = window.confirm(
      "Are you sure you want to delete this cheque?"
    );
    if (!confirmed) return;

    const formData = new FormData(e.currentTarget);
    const res = await deleteCheque(Number(formData.get("chequeId")));

    if (res.success) {
      toast.success(res.message || "Cheque deleted successfully");
      router.push("/cheques");
    } else {
      toast.error(res.error || "Failed to delete cheque");
    }
  }

  return (
    /*
     * The <form> wraps <DeleteButton> so that useFormStatus inside
     * DeleteButton can read this form's submission state.
     */
    <form ref={formRef} onSubmit={handleSubmit}>
      <input type="hidden" name="chequeId" value={chequeId} />
      <DeleteButton />
    </form>
  );
}
