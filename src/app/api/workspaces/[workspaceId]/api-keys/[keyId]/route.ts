import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { revokeWorkspaceApiKey } from "@/lib/auth/api-key";

interface RouteParams {
  params: Promise<{
    workspaceId: string;
    keyId: string;
  }>;
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
    }

    const { workspaceId, keyId } = await params;
    const success = await revokeWorkspaceApiKey(session.user.id, workspaceId, keyId);

    return NextResponse.json({ success });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to revoke API key";
    const status = message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ error: { message } }, { status });
  }
}
