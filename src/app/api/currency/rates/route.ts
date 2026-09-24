import { getEffectiveExchangeRates } from "@/lib/currency/sync";

export const dynamic = "force-dynamic";

export async function GET(_request?: Request) {
  try {
    const { rates, lastSyncedAt, source } = await getEffectiveExchangeRates();

    return Response.json({
      data: {
        base: "USD",
        rates,
        lastSyncedAt: lastSyncedAt.toISOString(),
        source,
      },
    });
  } catch (error) {
    return Response.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Failed to retrieve exchange rates",
        },
      },
      { status: 500 }
    );
  }
}
