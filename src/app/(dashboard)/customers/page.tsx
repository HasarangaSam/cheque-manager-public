import Link from "next/link";
import { Users, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import CustomersTable, { SerializedCustomer } from "@/components/customers/customers-table";

export const dynamic = "force-dynamic";

type CustomersPageProps = {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    q?: string;
  }>;
};

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(10, parseInt(params.pageSize || "25", 10) || 25));
  const query = params.q?.trim() || "";

  const where = query
    ? {
        OR: [
          { name: { contains: query, mode: "insensitive" as const } },
          { phone: { contains: query } },
          { address: { contains: query, mode: "insensitive" as const } },
          { notes: { contains: query, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  const [totalCount, customers] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { name: "asc" },
      include: {
        _count: { select: { cheques: true } },
        cheques: {
          select: {
            status: true,
            amount: true,
          },
        },
      },
    }),
  ]);

  const serializedCustomers: SerializedCustomer[] = customers.map((c) => {
    const pendingCheques = c.cheques.filter((ch) => ch.status === "PENDING");
    const pendingValue = pendingCheques.reduce(
      (sum, ch) => sum + Number(ch.amount),
      0
    );

    return {
      id: c.id,
      name: c.name,
      phone: c.phone,
      address: c.address,
      notes: c.notes,
      totalChequesCount: c._count.cheques,
      pendingChequesCount: pendingCheques.length,
      pendingValue,
    };
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Header */}
      <div className="border-b border-slate-200 bg-white px-8 py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Customer Directory</h1>
              <p className="text-xs text-slate-500">
                {totalCount} registered customer{totalCount !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <Link
            href="/customers/new"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add Customer
          </Link>
        </div>
      </div>

      <div className="px-8 py-6">
        {totalCount === 0 && !query ? (
          <div className="rounded-lg border border-slate-200 bg-white px-8 py-16 text-center shadow-sm">
            <Users className="mx-auto h-10 w-10 text-slate-300" />
            <h2 className="mt-3 text-base font-bold text-slate-800">No customers registered</h2>
            <p className="mt-1 text-xs text-slate-500">Add your first customer to start logging cheques.</p>
            <Link
              href="/customers/new"
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Add Customer
            </Link>
          </div>
        ) : (
          <CustomersTable
            customers={serializedCustomers}
            totalCount={totalCount}
            currentPage={page}
            pageSize={pageSize}
            searchQuery={query}
          />
        )}
      </div>
    </div>
  );
}

