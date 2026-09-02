import Link from "next/link";
import { CreditCard, Plus, AlertTriangle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  getChequeAttentionStatus,
  getDueUrgencyText,
  getChequeDaysDifference,
} from "@/lib/cheque-status";
import ChequesTable, {
  SerializedCheque,
  StatusCounts,
} from "@/components/cheques/cheques-table";
import type { Prisma } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

type ChequesPageProps = {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    q?: string;
    status?: string;
  }>;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function startOfUtcDay(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export default async function ChequesPage({ searchParams }: ChequesPageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const pageSize = Math.min(
    100,
    Math.max(10, parseInt(params.pageSize || "50", 10) || 50),
  );
  const query = params.q?.trim() || "";
  const statusParam = (params.status || "ALL").toUpperCase();

  const now = new Date();
  const todayStart = startOfUtcDay(now);
  const threeDaysAhead = new Date(
    todayStart.getTime() + 3 * MS_PER_DAY + (MS_PER_DAY - 1),
  );

  // Build search filter conditions
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

  // Status specific filter
  let statusCondition: Prisma.ChequeWhereInput = {};
  if (statusParam === "OVERDUE") {
    statusCondition = { status: "PENDING", dueDate: { lt: todayStart } };
  } else if (statusParam === "DUE_SOON") {
    statusCondition = {
      status: "PENDING",
      dueDate: { gte: todayStart, lte: threeDaysAhead },
    };
  } else if (statusParam === "UPCOMING") {
    statusCondition = { status: "PENDING", dueDate: { gt: threeDaysAhead } };
  } else if (statusParam === "CLEARED") {
    statusCondition = { status: "CLEARED" };
  } else if (statusParam === "BOUNCED") {
    statusCondition = { status: "BOUNCED" };
  } else if (statusParam === "PENDING") {
    statusCondition = { status: "PENDING" };
  }

  const finalWhere: Prisma.ChequeWhereInput = {
    AND: [searchFilter, statusCondition],
  };

  // Run aggregate/counts and paginated items query concurrently
  const [
    allCount,
    overdueCount,
    dueSoonCount,
    upcomingCount,
    clearedCount,
    bouncedCount,
    totalFilteredCount,
    cheques,
    overdueChequesAgg,
  ] = await Promise.all([
    prisma.cheque.count({ where: searchFilter }),
    prisma.cheque.count({
      where: {
        AND: [searchFilter, { status: "PENDING", dueDate: { lt: todayStart } }],
      },
    }),
    prisma.cheque.count({
      where: {
        AND: [
          searchFilter,
          {
            status: "PENDING",
            dueDate: { gte: todayStart, lte: threeDaysAhead },
          },
        ],
      },
    }),
    prisma.cheque.count({
      where: {
        AND: [
          searchFilter,
          { status: "PENDING", dueDate: { gt: threeDaysAhead } },
        ],
      },
    }),
    prisma.cheque.count({
      where: { AND: [searchFilter, { status: "CLEARED" }] },
    }),
    prisma.cheque.count({
      where: { AND: [searchFilter, { status: "BOUNCED" }] },
    }),
    prisma.cheque.count({ where: finalWhere }),
    prisma.cheque.findMany({
      where: finalWhere,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { dueDate: "asc" },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    }),
    prisma.cheque.aggregate({
      where: { status: "PENDING", dueDate: { lt: todayStart } },
      _sum: { amount: true },
      _count: { _all: true },
    }),
  ]);

  const serializedCheques: SerializedCheque[] = cheques.map((c) => {
    const attentionStatus = getChequeAttentionStatus(c.status, c.dueDate, now);
    const urgencyText = getDueUrgencyText(c.status, c.dueDate, now);
    const daysDifference = getChequeDaysDifference(c.dueDate, now);

    return {
      id: c.id,
      chequeNumber: c.chequeNumber,
      bank: c.bank,
      amount: Number(c.amount),
      dueDate: c.dueDate.toISOString(),
      status: c.status,
      notes: c.notes,
      attentionStatus,
      urgencyText,
      daysDifference,
      customer: {
        id: c.customer.id,
        name: c.customer.name,
        phone: c.customer.phone,
      },
    };
  });

  const statusCounts: StatusCounts = {
    ALL: allCount,
    OVERDUE: overdueCount,
    DUE_SOON: dueSoonCount,
    UPCOMING: upcomingCount,
    CLEARED: clearedCount,
    BOUNCED: bouncedCount,
  };

  const totalOverdueCount = overdueChequesAgg._count._all || 0;
  const overdueTotalAmount = Number(overdueChequesAgg._sum.amount || 0);

  const fmt = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 2,
    }).format(amount);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Header */}
      <div className="border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm shrink-0">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Cheques Register
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Track, realize, and update status of all incoming customer
                cheques
              </p>
            </div>
          </div>
          <Link
            href="/cheques/new"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white transition-colors hover:bg-indigo-500 shadow-sm shadow-indigo-600/20"
          >
            <Plus className="h-4 w-4" />
            <span>Add Cheque</span>
          </Link>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Urgent Attention Alert Banner if overdue exist */}
        {totalOverdueCount > 0 && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-red-200 bg-red-50/90 p-4 text-red-900 shadow-sm">
            <div className="flex items-start sm:items-center gap-3">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-600 mt-0.5 sm:mt-0" />
              <div>
                <p className="text-sm font-bold">
                  {totalOverdueCount}{" "}
                  {totalOverdueCount === 1 ? "Cheque is" : "Cheques are"}{" "}
                  Overdue ({fmt(overdueTotalAmount)})
                </p>
                <p className="text-xs text-red-700 mt-0.5">
                  Please contact the respective customers or deposit
                  immediately.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Interactive Table */}
        <ChequesTable
          cheques={serializedCheques}
          showCustomerColumn={true}
          totalCount={totalFilteredCount}
          currentPage={page}
          pageSize={pageSize}
          searchQuery={query}
          currentStatusFilter={statusParam}
          statusCounts={statusCounts}
        />
      </div>
    </div>
  );
}
