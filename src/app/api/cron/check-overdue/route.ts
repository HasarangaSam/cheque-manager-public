import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getChequeDaysDifference } from "@/lib/cheque-status";
import { sendOverdueNotificationEmail, OverdueChequeItem } from "@/lib/email";
import { AUTH_COOKIE_NAME, verifySessionToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

function getStartOfTodayUtc(date = new Date()): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

/**
 * Validates request authorization:
 * 1. Vercel Cron header: Authorization: Bearer <CRON_SECRET>
 * 2. URL search param: ?secret=<CRON_SECRET>
 * 3. Logged-in admin session cookie
 * 4. Local development bypass (if CRON_SECRET is not configured)
 */
async function isAuthorized(request: NextRequest): Promise<boolean> {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const searchParams = request.nextUrl.searchParams;
  const querySecret = searchParams.get("secret");

  // Check Bearer token or query param
  if (cronSecret) {
    if (authHeader === `Bearer ${cronSecret}` || querySecret === cronSecret) {
      return true;
    }
  } else if (process.env.NODE_ENV !== "production") {
    // In local dev without CRON_SECRET, allow execution for testing
    return true;
  }

  // Check active admin session cookie
  const sessionToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (sessionToken) {
    const session = await verifySessionToken(sessionToken);
    if (session) return true;
  }

  return false;
}

export async function GET(request: NextRequest) {
  try {
    const authorized = await isAuthorized(request);
    if (!authorized) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or missing CRON_SECRET / session" },
        { status: 401 },
      );
    }

    const todayStart = getStartOfTodayUtc();
    const now = new Date();

    // Query all uncleared (pending) cheques whose due date has passed
    const overdueCheques = await prisma.cheque.findMany({
      where: {
        status: "PENDING",
        dueDate: {
          lt: todayStart,
        },
      },
      include: {
        customer: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
      orderBy: {
        dueDate: "asc",
      },
    });

    if (overdueCheques.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No uncleared overdue cheques found. No email sent.",
        checkedAt: now.toISOString(),
        count: 0,
      });
    }

    // Format cheques for email
    const emailItems: OverdueChequeItem[] = overdueCheques.map((c) => {
      const diff = getChequeDaysDifference(c.dueDate, now);
      const daysOverdue = diff < 0 ? Math.abs(diff) : 1;

      return {
        id: c.id,
        chequeNumber: c.chequeNumber,
        bank: c.bank,
        amount: c.amount.toString(),
        dueDate: c.dueDate,
        customer: {
          name: c.customer.name,
          phone: c.customer.phone || "",
        },
        daysOverdue,
      };
    });

    // Send single summary email notification
    const emailResult = await sendOverdueNotificationEmail({
      cheques: emailItems,
    });

    // Update notified timestamp on all uncleared overdue cheques in this summary
    const ids = overdueCheques.map((c) => c.id);
    await prisma.cheque.updateMany({
      where: {
        id: {
          in: ids,
        },
      },
      data: {
        overdueNotifiedAt: now,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Overdue summary email sent for ${overdueCheques.length} uncleared cheque(s).`,
      count: overdueCheques.length,
      chequeIds: ids,
      emailResult,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Error checking overdue cheques:", error);
    return NextResponse.json(
      {
        error: "Failed to process overdue cheques",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
