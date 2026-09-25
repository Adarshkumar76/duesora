import { NextRequest } from "next/server";
import { authenticateV1Request } from "@/lib/api/v1-auth";
import { listWorkspaceRenewals } from "@/lib/renewals/service";
import type { ListRenewalsOptions } from "@/lib/renewals/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { auth, response } = await authenticateV1Request(request, "read");
  if (response || !auth) return response!;

  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search") || undefined;
  const bucket = (searchParams.get("bucket") as ListRenewalsOptions["bucket"]) || undefined;
  const decision = (searchParams.get("decision") as ListRenewalsOptions["decision"]) || undefined;
  const type = (searchParams.get("type") as ListRenewalsOptions["type"]) || undefined;
  const currency = searchParams.get("currency") || "USD";

  try {
    const result = await listWorkspaceRenewals(auth.userId, auth.workspaceId, currency, {
      search,
      bucket,
      decision,
      type,
    });

    return Response.json({
      data: result.items,
      metrics: result.metrics,
    });
  } catch (err: unknown) {
    return Response.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: err instanceof Error ? err.message : "Failed to list renewals",
        },
      },
      { status: 500 }
    );
  }
}
