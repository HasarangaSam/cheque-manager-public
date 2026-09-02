"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateChequeStatus } from "@/app/actions/cheque-actions";
import type { ChequeStatus } from "@/lib/cheque-status";
import { Loader2 } from "lucide-react";

type QuickStatusSelectorProps = {
  chequeId: number;
  currentStatus: ChequeStatus;
};

export default function QuickStatusSelector({
  chequeId,
  currentStatus,
}: QuickStatusSelectorProps) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<ChequeStatus>(currentStatus);

  function handleStatusChange(newStatus: ChequeStatus) {
    if (newStatus === status) return;
    
    const previousStatus = status;
    setStatus(newStatus);

    startTransition(async () => {
      const res = await updateChequeStatus(chequeId, newStatus);
      if (res.success) {
        toast.success(res.message || `Cheque status updated to ${newStatus}`);
      } else {
        setStatus(previousStatus);
        toast.error(res.error || "Failed to update cheque status");
      }
    });
  }

  const styles: Record<
    ChequeStatus,
    { border: string; bg: string; text: string }
  > = {
    PENDING: {
      border: "border-amber-300",
      bg: "bg-amber-50",
      text: "text-amber-800",
    },
    CLEARED: {
      border: "border-emerald-300",
      bg: "bg-emerald-50",
      text: "text-emerald-800",
    },
    BOUNCED: {
      border: "border-rose-300",
      bg: "bg-rose-50",
      text: "text-rose-800",
    },
  };

  return (
    <div className="relative inline-flex items-center">
      <select
        disabled={isPending}
        value={status}
        onChange={(e) => handleStatusChange(e.target.value as ChequeStatus)}
        className={`h-7 cursor-pointer appearance-none rounded-md border pl-2 pr-6 text-xs font-semibold tracking-wide outline-none transition-all hover:opacity-90 focus:ring-1 focus:ring-slate-400 ${
          styles[status].border
        } ${styles[status].bg} ${styles[status].text} ${
          isPending ? "opacity-60" : ""
        }`}
      >
        <option value="PENDING">PENDING</option>
        <option value="CLEARED">CLEARED</option>
        <option value="BOUNCED">BOUNCED</option>
      </select>
      <div className="pointer-events-none absolute right-1.5 flex items-center">
        {isPending ? (
          <Loader2 className="h-3 w-3 animate-spin text-slate-500" />
        ) : (
          <span className="text-[10px] text-slate-500">▼</span>
        )}
      </div>
    </div>
  );
}
