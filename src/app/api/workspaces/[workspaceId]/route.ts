import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { requireWorkspaceRole } from "@/lib/auth/workspace";
import { getDb } from "@/db";
import { workspaces } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  defaultCurrency: z.enum(["USD", "EUR", "GBP", "INR"]).optional(),
  timezone: z.string().max(100).optional(),
  reminderDays: z.array(z.number().int().min(0).max(365)).optional(),
});

interface RouteParams {
  params: Promise<{
    workspaceId: string;
  }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
    }

    const { workspaceId } = await params;
    await requireWorkspaceRole(session.user.id, workspaceId, "admin");

    const body = await request.json();
    const parsed = updateWorkspaceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { message: "Invalid input", details: parsed.error.format() } },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (parsed.data.name !== undefined) updateData.name = parsed.data.name.trim();
    if (parsed.data.defaultCurrency !== undefined) updateData.defaultCurrency = parsed.data.defaultCurrency;
    if (parsed.data.timezone !== undefined) updateData.timezone = parsed.data.timezone.trim();
    if (parsed.data.reminderDays !== undefined) {
      updateData.reminderDays = JSON.stringify(
        Array.from(new Set(parsed.data.reminderDays)).sort((a, b) => b - a)
      );
    }

    const db = getDb();
    const [updated] = await db
      .update(workspaces)
      .set(updateData)
      .where(eq(workspaces.id, workspaceId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: { message: "Workspace not found" } }, { status: 404 });
    }

    return NextResponse.json({ data: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update workspace";
    const status = message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ error: { message } }, { status });
  }
}
