export type ChequeStatus = "PENDING" | "CLEARED" | "BOUNCED";

export type ChequeAttentionStatus =
  | "UPCOMING"
  | "DUE_SOON"
  | "OVERDUE"
  | "CLEARED"
  | "BOUNCED";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function startOfUtcDay(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export function getChequeDaysDifference(
  dueDate: Date,
  today = new Date(),
): number {
  const todayStart = startOfUtcDay(today);
  const dueDateStart = startOfUtcDay(dueDate);

  return Math.floor(
    (dueDateStart.getTime() - todayStart.getTime()) / MS_PER_DAY,
  );
}

export function getChequeAttentionStatus(
  status: ChequeStatus,
  dueDate: Date,
  today = new Date(),
): ChequeAttentionStatus {
  if (status === "CLEARED") {
    return "CLEARED";
  }

  if (status === "BOUNCED") {
    return "BOUNCED";
  }

  const differenceInDays = getChequeDaysDifference(dueDate, today);

  if (differenceInDays < 0) {
    return "OVERDUE";
  }

  if (differenceInDays <= 3) {
    return "DUE_SOON";
  }

  return "UPCOMING";
}

export function getDueUrgencyText(
  status: ChequeStatus,
  dueDate: Date,
  today = new Date(),
): string {
  if (status === "CLEARED") return "Cleared";
  if (status === "BOUNCED") return "Bounced";

  const diff = getChequeDaysDifference(dueDate, today);

  if (diff < 0) {
    const days = Math.abs(diff);
    return `${days} ${days === 1 ? "day" : "days"} overdue`;
  }
  if (diff === 0) return "Due today";
  if (diff === 1) return "Due tomorrow";
  return `Due in ${diff} days`;
}
