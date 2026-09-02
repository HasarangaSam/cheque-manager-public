import type { ChequeAttentionStatus } from "@/lib/cheque-status";

const config: Record<
  ChequeAttentionStatus,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  OVERDUE: {
    label: "Overdue",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-500",
  },
  DUE_SOON: {
    label: "Due Soon",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  UPCOMING: {
    label: "Upcoming",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  CLEARED: {
    label: "Cleared",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  BOUNCED: {
    label: "Bounced",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    dot: "bg-rose-500",
  },
};

type StatusBadgeProps = {
  status: ChequeAttentionStatus;
  urgencyText?: string;
};

export default function StatusBadge({ status, urgencyText }: StatusBadgeProps) {
  const c = config[status];

  return (
    <div className="inline-flex flex-col items-start gap-0.5">
      <span
        className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-semibold tracking-wide ${c.bg} ${c.text} ${c.border}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
        {c.label}
      </span>
      {urgencyText && (
        <span className="text-[11px] font-medium text-slate-500">
          {urgencyText}
        </span>
      )}
    </div>
  );
}
