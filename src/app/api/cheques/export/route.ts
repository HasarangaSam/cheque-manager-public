import { getSession } from "@/lib/auth";
import { getChequeFilters } from "@/lib/cheque-filters";
import { prisma } from "@/lib/prisma";
import { chequeExportFilterSchema } from "@/lib/validations";

const csvDateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Colombo",
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

function escapeCsvValue(value: string | number | null): string {
  const normalizedValue = value === null ? "" : String(value);
  // Prevent spreadsheet applications from interpreting user-entered values as formulas.
  const safeValue = /^[=+\-@]/.test(normalizedValue)
    ? `'${normalizedValue}`
    : normalizedValue;

  return `"${safeValue.replaceAll('"', '""')}"`;
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parseResult = chequeExportFilterSchema.safeParse({
    q: searchParams.get("q"),
    status: searchParams.get("status"),
  });

  const { q: query, status } = parseResult.success
    ? parseResult.data
    : { q: "", status: "ALL" };

  const { where } = getChequeFilters(query, status);

  const cheques = await prisma.cheque.findMany({
    where,
    orderBy: { dueDate: "asc" },
    select: {
      chequeNumber: true,
      bank: true,
      amount: true,
      dueDate: true,
      status: true,
      notes: true,
      createdAt: true,
      customer: {
        select: {
          name: true,
          phone: true,
        },
      },
    },
  });

  const header = [
    "Cheque Number",
    "Customer",
    "Phone",
    "Bank",
    "Amount (LKR)",
    "Due Date",
    "Status",
    "Notes",
    "Created At",
  ];
  const rows = cheques.map((cheque) => [
    cheque.chequeNumber,
    cheque.customer.name,
    cheque.customer.phone,
    cheque.bank,
    cheque.amount.toFixed(2),
    csvDateFormatter.format(cheque.dueDate),
    cheque.status,
    cheque.notes,
    csvDateFormatter.format(cheque.createdAt),
  ]);
  const csv = [header, ...rows]
    .map((row) => row.map(escapeCsvValue).join(","))
    .join("\r\n");
  const filename = `cheques-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
