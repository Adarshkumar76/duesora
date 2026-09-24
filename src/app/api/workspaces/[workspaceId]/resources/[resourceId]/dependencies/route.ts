import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { requireWorkspaceRole } from "@/lib/auth/workspace";
import {
  listResourceDependencies,
  addResourceDependency,
  removeResourceDependency,
} from "@/lib/resources/dependencies";
import { z } from "zod";

interface RouteParams {
  params: Promise<{
    workspaceId: string;
    resourceId: string;
  }>;
}

const addDependencySchema = z.object({
  dependsOnResourceId: z.string().uuid("Invalid resource ID"),
  notes: z.string().max(255).optional(),
});

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
    }

    const { workspaceId, resourceId } = await params;
    await requireWorkspaceRole(session.user.id, workspaceId, "viewer");

    const data = await listResourceDependencies(workspaceId, resourceId);
    return NextResponse.json({ data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch dependencies";
    const status = message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ error: { message } }, { status });
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
    }

    const { workspaceId, resourceId } = await params;
    const body = await req.json();
    const parsed = addDependencySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { message: "Invalid input", details: parsed.error.format() } },
        { status: 400 }
      );
    }

    const created = await addResourceDependency(
      session.user.id,
      workspaceId,
      resourceId,
      parsed.data.dependsOnResourceId,
      parsed.data.notes
    );

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to add dependency";
    const status = message === "FORBIDDEN" ? 403 : message.includes("cannot depend") ? 400 : 500;
    return NextResponse.json({ error: { message } }, { status });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
    }

    const { workspaceId } = await params;
    const { searchParams } = new URL(req.url);
    const dependencyId = searchParams.get("dependencyId");

    if (!dependencyId) {
      return NextResponse.json(
        { error: { message: "dependencyId is required" } },
        { status: 400 }
      );
    }

    const success = await removeResourceDependency(session.user.id, workspaceId, dependencyId);
    return NextResponse.json({ success });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to remove dependency";
    const status = message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ error: { message } }, { status });
  }
}
