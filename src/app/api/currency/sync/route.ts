import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { syncExchangeRates } from "@/lib/currency/sync";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const isCronAuthorized =
      process.env.CRON_SECRET &&
      authHeader === `Bearer ${process.env.CRON_SECRET}`;

    const session = await auth();
    const isUserAuthorized = Boolean(session?.user?.id);

    if (!isCronAuthorized && !isUserAuthorized) {
      return Response.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication required to sync exchange rates" } },
        { status: 401 }
      );
    }

    const result = await syncExchangeRates(true);

    return Response.json({
      data: {
        success: result.success,
        count: result.count,
        rates: result.rates,
        lastSyncedAt: result.lastSyncedAt.toISOString(),
        source: result.source,
        warning: result.error,
      },
    });
  } catch (error) {
    return Response.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Exchange rate synchronization failed",
        },
      },
      { status: 500 }
    );
  }
}
