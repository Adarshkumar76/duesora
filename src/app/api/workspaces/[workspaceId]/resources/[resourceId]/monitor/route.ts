import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { requireWorkspaceRole } from "@/lib/auth/workspace";
import { getResourceById } from "@/lib/resources/service";
import {
  getMonitorForResource,
  getMonitorLogsForResource,
  probeAndSaveResource,
} from "@/lib/monitors/service";

interface RouteParams {
  params: Promise<{
    workspaceId: string;
    resourceId: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
    }

    const { workspaceId, resourceId } = await params;
    await requireWorkspaceRole(session.user.id, workspaceId, "viewer");

    const [monitor, logs] = await Promise.all([
      getMonitorForResource(resourceId, workspaceId),
      getMonitorLogsForResource(resourceId, workspaceId, 10),
    ]);

    return NextResponse.json({
      data: {
        monitor,
        logs,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch monitor status";
    const status = message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ error: { message } }, { status });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
    }

    const { workspaceId, resourceId } = await params;
    await requireWorkspaceRole(session.user.id, workspaceId, "member");

    const resource = await getResourceById(workspaceId, resourceId);
    if (!resource) {
      return NextResponse.json({ error: { message: "Resource not found" } }, { status: 404 });
    }

    const monitor = await probeAndSaveResource({
      id: resource.id,
      workspaceId: resource.workspaceId,
      name: resource.name,
      websiteUrl: resource.websiteUrl,
      type: resource.type,
    });

    const logs = await getMonitorLogsForResource(resourceId, workspaceId, 10);

    return NextResponse.json({
      data: {
        monitor,
        logs,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to run monitor check";
    const status = message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ error: { message } }, { status });
  }
}
