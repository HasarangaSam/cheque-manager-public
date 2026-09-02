import Link from "next/link";
import {
  Users,
  CreditCard,
  AlertTriangle,
  Clock,
  Plus,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  getChequeAttentionStatus,
  getDueUrgencyText,
  getChequeDaysDifference,
} from "@/lib/cheque-status";
import ChequesTable, { SerializedCheque } from "@/components/cheques/cheques-table";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [customers, cheques] = await Promise.all([
    prisma.customer.findMany({
      select: { id: true },
    }),
    prisma.cheque.findMany({
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
  ]);

  const now = new Date();

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

  const totalCustomers = customers.length;
  const totalCheques = cheques.length;

  const overdueCheques = serializedCheques.filter((c) => c.attentionStatus === "OVERDUE");
  const dueSoonCheques = serializedCheques.filter((c) => c.attentionStatus === "DUE_SOON");
  const pendingCheques = serializedCheques.filter((c) => c.status === "PENDING");
  const clearedCheques = serializedCheques.filter((c) => c.status === "CLEARED");

  const overdueAmount = overdueCheques.reduce((sum, c) => sum + c.amount, 0);
  const dueSoonAmount = dueSoonCheques.reduce((sum, c) => sum + c.amount, 0);
  const pendingAmount = pendingCheques.reduce((sum, c) => sum + c.amount, 0);

  const fmt = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 2,
    }).format(amount);

  const stats = [
    {
      label: "Overdue Cheques",
      value: overdueCheques.length,
      sub: overdueAmount > 0 ? fmt(overdueAmount) : "None overdue",
      icon: AlertTriangle,
      border: "border-red-200",
      bg: "bg-red-50",
      text: "text-red-700",
      subColor: "text-red-800 font-bold",
      href: "/cheques",
      alert: overdueCheques.length > 0,
    },
    {
      label: "Due This Week",
      value: dueSoonCheques.length,
      sub: dueSoonAmount > 0 ? fmt(dueSoonAmount) : "None due this week",
      icon: Clock,
      border: "border-amber-200",
      bg: "bg-amber-50",
      text: "text-amber-700",
      subColor: "text-amber-800 font-bold",
      href: "/cheques",
      alert: dueSoonCheques.length > 0,
    },
    {
      label: "Total Pending Value",
      value: pendingCheques.length,
      sub: fmt(pendingAmount),
      icon: CreditCard,
      border: "border-slate-200",
      bg: "bg-slate-50",
      text: "text-slate-700",
      subColor: "text-slate-900 font-bold",
      href: "/cheques",
    },
    {
      label: "Active Customers",
      value: totalCustomers,
      sub: `${totalCheques} total cheques registered`,
      icon: Users,
      border: "border-slate-200",
      bg: "bg-slate-50",
      text: "text-slate-700",
      subColor: "text-slate-600",
      href: "/customers",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Header */}
      <div className="border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Cheque Operations Dashboard
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time realization tracking, overdue alerts, and customer cheque management
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/customers/new"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-sm hover:bg-slate-50 transition-colors"
            >
              <Users className="h-3.5 w-3.5" />
              New Customer
            </Link>
            <Link
              href="/cheques/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-500 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Cheque
            </Link>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Critical Overdue Warning Banner */}
        {overdueCheques.length > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-red-200 bg-red-50/90 p-4 text-red-950 shadow-sm">
            <div className="flex items-start sm:items-center gap-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600 mt-0.5 sm:mt-0" />
              <div>
                <p className="text-sm font-bold">
                  Action Required: {overdueCheques.length} Cheque{overdueCheques.length === 1 ? " is" : "s are"} Overdue ({fmt(overdueAmount)})
                </p>
                <p className="text-xs text-red-800 mt-0.5">
                  These cheques have passed their due realization date. Update status or deposit promptly.
                </p>
              </div>
            </div>
            <Link
              href="/cheques"
              className="self-start sm:self-auto rounded-lg bg-red-600 hover:bg-red-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-colors whitespace-nowrap"
            >
              View Overdue
            </Link>
          </div>
        )}

        {/* Operational Stat Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link
                key={stat.label}
                href={stat.href}
                className={`group block rounded-xl border p-4.5 transition-all hover:border-indigo-200 hover:shadow-md ${stat.border} bg-white shadow-sm`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {stat.label}
                  </span>
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.bg} ${stat.text}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-black text-slate-900 tracking-tight">
                    {stat.value}
                  </p>
                  <p className={`mt-1 text-xs ${stat.subColor}`}>
                    {stat.sub}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Live Cheque Management Ledger */}
        <div className="space-y-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Cheque Ledger & Quick Actions
              </h2>
              <p className="text-xs text-slate-500">
                Search, filter by due status, update status instantly, or edit cheque details
              </p>
            </div>
            <Link
              href="/cheques"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline inline-flex items-center gap-1"
            >
              <span>View full register</span>
              <span>→</span>
            </Link>
          </div>

          <ChequesTable cheques={serializedCheques} showCustomerColumn={true} />
        </div>
      </div>
    </div>
  );
}
