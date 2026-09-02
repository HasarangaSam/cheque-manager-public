import type { Prisma } from "@/generated/prisma/client";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function startOfUtcDay(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

/** Build the search and status filters shared by the register and CSV export. */
export function getChequeFilters(query: string, status: string, now = new Date()) {
  const todayStart = startOfUtcDay(now);
  const threeDaysAhead = new Date(
    todayStart.getTime() + 3 * MS_PER_DAY + (MS_PER_DAY - 1),
  );

  const searchFilter: Prisma.ChequeWhereInput = query
    ? {
        OR: [
          { chequeNumber: { contains: query, mode: "insensitive" } },
          { bank: { contains: query, mode: "insensitive" } },
          { notes: { contains: query, mode: "insensitive" } },
          { customer: { name: { contains: query, mode: "insensitive" } } },
        ],
      }
    : {};

  let statusCondition: Prisma.ChequeWhereInput = {};
  if (status === "OVERDUE") {
    statusCondition = { status: "PENDING", dueDate: { lt: todayStart } };
  } else if (status === "DUE_SOON") {
    statusCondition = {
      status: "PENDING",
      dueDate: { gte: todayStart, lte: threeDaysAhead },
    };
  } else if (status === "UPCOMING") {
    statusCondition = { status: "PENDING", dueDate: { gt: threeDaysAhead } };
  } else if (status === "CLEARED") {
    statusCondition = { status: "CLEARED" };
  } else if (status === "BOUNCED") {
    statusCondition = { status: "BOUNCED" };
  } else if (status === "PENDING") {
    statusCondition = { status: "PENDING" };
  }

  return {
    searchFilter,
    todayStart,
    threeDaysAhead,
    where: { AND: [searchFilter, statusCondition] } satisfies Prisma.ChequeWhereInput,
  };
}
