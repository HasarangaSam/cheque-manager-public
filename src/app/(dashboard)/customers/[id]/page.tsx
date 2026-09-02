import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Phone,
  MapPin,
  FileText,
  Plus,
  Edit2,
  CreditCard,
  DollarSign,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  getChequeAttentionStatus,
  getDueUrgencyText,
  getChequeDaysDifference,
} from "@/lib/cheque-status";
import ChequesTable, { SerializedCheque } from "@/components/cheques/cheques-table";
import DeleteCustomerButton from "@/components/customers/delete-customer-button";

type CustomerDetailsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CustomerDetailsPage({
  params,
}: CustomerDetailsPageProps) {
  const { id } = await params;
  const customerId = Number(id);

  if (!Number.isInteger(customerId) || customerId <= 0) notFound();

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      cheques: { orderBy: { dueDate: "asc" } },
    },
  });

  if (!customer) notFound();

  const now = new Date();

  const serializedCheques: SerializedCheque[] = customer.cheques.map((c) => {
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
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
      },
    };
  });

  const totalCheques = customer.cheques.length;
  const pendingCheques = customer.cheques.filter((c) => c.status === "PENDING");
  const clearedCheques = customer.cheques.filter((c) => c.status === "CLEARED");
  const bouncedCheques = customer.cheques.filter((c) => c.status === "BOUNCED");

  const totalAmount = customer.cheques.reduce((sum, c) => sum + Number(c.amount), 0);
  const pendingAmount = pendingCheques.reduce((sum, c) => sum + Number(c.amount), 0);

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
            <Link
              href="/customers"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Customers</span>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{customer.name}</h1>
              <p className="text-xs text-slate-500">
                Registered on {customer.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/customers/${customer.id}/cheques/new`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-500 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Cheque</span>
            </Link>
            <Link
              href={`/customers/${customer.id}/edit`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
            >
              <Edit2 className="h-3.5 w-3.5" />
              <span>Edit</span>
            </Link>
            <DeleteCustomerButton
              customerId={customer.id}
              customerName={customer.name}
            />
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Info & Metrics Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Contact Details Card */}
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-3">
              Customer Contact Info
            </h2>
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-semibold text-slate-900">{customer.phone}</span>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                <span className="text-sm text-slate-700">{customer.address ?? "—"}</span>
              </div>
              {customer.notes && (
                <div className="flex items-start gap-2.5 pt-2 border-t border-slate-100">
                  <FileText className="h-4 w-4 text-slate-400 mt-0.5" />
                  <span className="text-xs text-slate-600 whitespace-pre-wrap">{customer.notes}</span>
                </div>
              )}
            </div>
          </div>

          {/* Cheque Summary KPIs */}
          <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-xs font-bold uppercase text-slate-500">Total Cheques</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{totalCheques}</p>
              <p className="mt-0.5 text-xs text-slate-500">{fmt(totalAmount)}</p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4">
              <p className="text-xs font-bold uppercase text-amber-700">Pending</p>
              <p className="mt-1 text-2xl font-black text-amber-800">{pendingCheques.length}</p>
              <p className="mt-0.5 text-xs font-bold text-amber-700">{fmt(pendingAmount)}</p>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4">
              <p className="text-xs font-bold uppercase text-emerald-700">Cleared</p>
              <p className="mt-1 text-2xl font-black text-emerald-800">{clearedCheques.length}</p>
              <p className="mt-0.5 text-xs text-emerald-600">Realized</p>
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50/50 p-4">
              <p className="text-xs font-bold uppercase text-red-700">Bounced</p>
              <p className="mt-1 text-2xl font-black text-red-800">{bouncedCheques.length}</p>
              <p className="mt-0.5 text-xs text-red-600">Action needed</p>
            </div>
          </div>
        </div>

        {/* Customer Cheques Ledger with Quick Actions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Customer Cheques Ledger</h2>
            <Link
              href={`/customers/${customer.id}/cheques/new`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 hover:underline"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Cheque for {customer.name}
            </Link>
          </div>

          <ChequesTable cheques={serializedCheques} showCustomerColumn={false} />
        </div>
      </div>
    </div>
  );
}
