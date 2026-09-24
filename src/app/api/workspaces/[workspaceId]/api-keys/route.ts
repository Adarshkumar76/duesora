import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  listWorkspaceApiKeys,
  createWorkspaceApiKey,
} from "@/lib/auth/api-key";
import { z } from "zod";

interface RouteParams {
  params: Promise<{
    workspaceId: string;
  }>;
}

const createKeySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  permissions: z.enum(["read", "read_write"]).default("read"),
});

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
    }

    const { workspaceId } = await params;
    const keys = await listWorkspaceApiKeys(session.user.id, workspaceId);
    return NextResponse.json({ data: keys });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to list API keys";
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

    const { workspaceId } = await params;
    const body = await req.json();
    const parsed = createKeySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { message: "Invalid input", details: parsed.error.format() } },
        { status: 400 }
      );
    }

    const created = await createWorkspaceApiKey(
      session.user.id,
      workspaceId,
      parsed.data.name,
      parsed.data.permissions
    );

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create API key";
    const status = message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ error: { message } }, { status });
  }
}
