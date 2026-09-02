import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Edit3 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import ChequeForm from "@/components/cheques/cheque-form";

type EditChequePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditChequePage({ params }: EditChequePageProps) {
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
        },
      },
    },
  });

  if (!cheque) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Header */}
      <div className="border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex items-center gap-4">
          <Link
            href={`/cheques/${cheque.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Edit Cheque #{cheque.chequeNumber}
            </h1>
            <p className="text-xs text-slate-500">
              Customer: <span className="font-semibold text-slate-800">{cheque.customer.name}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <ChequeForm
            mode="edit"
            customerId={cheque.customer.id}
            customerName={cheque.customer.name}
            initialData={{
              id: cheque.id,
              chequeNumber: cheque.chequeNumber,
              bank: cheque.bank,
              amount: Number(cheque.amount),
              status: cheque.status,
              dueDate: cheque.dueDate,
              notes: cheque.notes,
            }}
          />
        </div>
      </div>
    </div>
  );
}
