import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Edit2,
  Calendar,
  Building,
  CreditCard,
  User,
  Phone,
  FileText,
  Clock,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  getChequeAttentionStatus,
  getDueUrgencyText,
} from "@/lib/cheque-status";
import StatusBadge from "@/components/ui/status-badge";
import QuickStatusSelector from "@/components/cheques/quick-status-selector";
import DeleteChequeButton from "@/components/cheques/delete-cheque-button";

type ChequeDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ChequeDetailsPage({
  params,
}: ChequeDetailsPageProps) {
  const { id } = await params;
  const chequeId = Number(id);

  if (!Number.isInteger(chequeId) || chequeId <= 0) {
    notFound();
  }

  const cheque = await prisma.cheque.findUnique({
    where: {
      id: chequeId,
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          phone: true,
          address: true,
        },
      },
    },
  });

  if (!cheque) {
    notFound();
  }

  const now = new Date();
  const attentionStatus = getChequeAttentionStatus(cheque.status, cheque.dueDate, now);
  const urgencyText = getDueUrgencyText(cheque.status, cheque.dueDate, now);

  const fmt = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 2,
    }).format(amount);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Bar */}
      <div className="border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/cheques"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Cheques</span>
            </Link>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Cheque #{cheque.chequeNumber}
                </h1>
                <StatusBadge status={attentionStatus} urgencyText={urgencyText} />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Received from <span className="font-semibold text-slate-800">{cheque.customer.name}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <QuickStatusSelector chequeId={cheque.id} currentStatus={cheque.status} />

            <Link
              href={`/cheques/${cheque.id}/edit`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
            >
              <Edit2 className="h-3.5 w-3.5" />
              <span>Edit</span>
            </Link>

            <DeleteChequeButton chequeId={cheque.id} />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Cheque Information */}
          <div className="space-y-6 md:col-span-2">
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3">
                Cheque Details
              </h2>

              <dl className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium uppercase text-slate-500">Cheque Number</dt>
                  <dd className="mt-1 font-mono text-sm font-bold text-slate-900">{cheque.chequeNumber}</dd>
                </div>

                <div>
                  <dt className="text-xs font-medium uppercase text-slate-500">Bank</dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-900">{cheque.bank}</dd>
                </div>

                <div>
                  <dt className="text-xs font-medium uppercase text-slate-500">Amount</dt>
                  <dd className="mt-1 text-xl font-bold text-slate-900">{fmt(Number(cheque.amount))}</dd>
                </div>

                <div>
                  <dt className="text-xs font-medium uppercase text-slate-500">Current Status</dt>
                  <dd className="mt-1">
                    <span className="inline-block font-semibold text-xs text-slate-800">
                      {cheque.status} ({urgencyText})
                    </span>
                  </dd>
                </div>


                <div>
                  <dt className="text-xs font-medium uppercase text-slate-500">Due / Realization Date</dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-900">
                    {cheque.dueDate.toLocaleDateString("en-US", {
                      weekday: "short",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-medium uppercase text-slate-500">Created At</dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-900">
                    {cheque.createdAt.toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </dd>
                </div>

                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium uppercase text-slate-500">Notes & Remarks</dt>
                  <dd className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">
                    {cheque.notes || <span className="text-slate-400 italic">No notes provided</span>}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Customer Profile Card */}
          <div>
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3">
                Customer Information
              </h2>

              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500">Name</p>
                  <Link
                    href={`/customers/${cheque.customer.id}`}
                    className="mt-0.5 block text-sm font-bold text-indigo-600 hover:underline"
                  >
                    {cheque.customer.name}
                  </Link>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase text-slate-500">Phone</p>
                  <p className="mt-0.5 text-sm font-medium text-slate-800">{cheque.customer.phone}</p>
                </div>


                <div>
                  <p className="text-xs font-medium uppercase text-slate-500">Address</p>
                  <p className="mt-0.5 text-sm font-medium text-slate-800">{cheque.customer.address ?? "—"}</p>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <Link
                    href={`/customers/${cheque.customer.id}`}
                    className="inline-flex w-full items-center justify-center rounded-md border border-slate-200 bg-slate-50 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    View Customer Profile
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
