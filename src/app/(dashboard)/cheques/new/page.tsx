import Link from "next/link";
import { ArrowLeft, CreditCard } from "lucide-react";
import { prisma } from "@/lib/prisma";
import ChequeForm from "@/components/cheques/cheque-form";

export const dynamic = "force-dynamic";

export default async function DirectNewChequePage() {
  const customers = await prisma.customer.findMany({
    take: 10,
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      phone: true,
    },
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Header */}
      <div className="border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex items-center gap-4">
          <Link
            href="/cheques"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Add Cheque
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Create a new cheque record directly
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Cheque Details
              </h2>
              <p className="text-xs text-slate-500">
                Select customer, enter the cheque number, amount, and realization date
              </p>
            </div>
          </div>

          <ChequeForm
            mode="create"
            customers={customers}
          />
        </div>
      </div>
    </div>
  );
}
