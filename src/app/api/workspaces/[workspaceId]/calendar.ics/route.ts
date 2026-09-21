import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/db";
import { workspaces, resources } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { verifyCalendarToken } from "@/lib/calendar/token";
import { generateIcsCalendar } from "@/lib/calendar/ical";

interface RouteParams {
  params: Promise<{
    workspaceId: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId } = await params;
    const token = request.nextUrl.searchParams.get("token");

    // Authenticate via either session cookie or secure token
    let isAuthorized = false;

    if (token) {
      isAuthorized = verifyCalendarToken(workspaceId, token);
    }

    if (!isAuthorized) {
      const session = await auth();
      if (session?.user?.id) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return new NextResponse("Unauthorized: valid token or active session required", {
        status: 401,
        headers: { "Content-Type": "text/plain" },
      });
    }

    const db = getDb();

    // Fetch workspace
    const [workspace] = await db
      .select({ id: workspaces.id, name: workspaces.name })
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1);

    if (!workspace) {
      return new NextResponse("Workspace not found", {
        status: 404,
        headers: { "Content-Type": "text/plain" },
      });
    }

    // Fetch all active resources with renewal dates
    const items = await db
      .select({
        id: resources.id,
        name: resources.name,
        type: resources.type,
        provider: resources.provider,
        category: resources.category,
        websiteUrl: resources.websiteUrl,
        amountMinor: resources.amountMinor,
        currency: resources.currency,
        billingCycle: resources.billingCycle,
        renewalDate: resources.renewalDate,
        autoRenew: resources.autoRenew,
        description: resources.description,
      })
      .from(resources)
      .where(eq(resources.workspaceId, workspaceId))
      .orderBy(desc(resources.renewalDate));

    const icsContent = generateIcsCalendar({
      workspaceName: workspace.name,
      resources: items,
    });

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `inline; filename="${encodeURIComponent(workspace.name)}-renewals.ics"`,
        "Cache-Control": "public, max-age=1800",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to generate calendar feed";
    return new NextResponse(`Internal error: ${message}`, {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    });
  }
}
