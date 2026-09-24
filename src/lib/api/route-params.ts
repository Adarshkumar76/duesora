import { NextRequest } from "next/server";

/**
 * Robustly extracts the `workspaceId` from Next.js 16 RouteContext, params promise,
 * or direct URL pathname regex fallback.
 */
export async function resolveWorkspaceId(
  request: NextRequest,
  contextOrParams?: unknown
): Promise<string | null> {
  // 1. Try to extract from context/params object or promise
  if (contextOrParams && typeof contextOrParams === "object") {
    try {
      const anyCtx = contextOrParams as Record<string, unknown>;
      const rawParams = anyCtx.params !== undefined ? anyCtx.params : anyCtx;
      const resolved = await Promise.resolve(rawParams);
      if (
        resolved &&
        typeof resolved === "object" &&
        "workspaceId" in resolved &&
        typeof (resolved as { workspaceId: unknown }).workspaceId === "string"
      ) {
        const id = (resolved as { workspaceId: string }).workspaceId.trim();
        if (id) return id;
      }
    } catch {
      // Continue to URL fallback if params resolution fails
    }
  }

  // 2. URL Pathname Fallback: /api/workspaces/:workspaceId/...
  try {
    const pathname = request.nextUrl?.pathname || new URL(request.url).pathname;
    const match = pathname.match(/\/api\/workspaces\/([^/]+)/);
    if (match && match[1] && match[1] !== "switch") {
      const extracted = decodeURIComponent(match[1]).trim();
      if (extracted) return extracted;
    }
  } catch {
    // Ignore URL parse errors
  }

  return null;
}

/**
 * Robustly extracts both `workspaceId` and `resourceId` from Next.js 16 RouteContext,
 * params promise, or direct URL pathname regex fallback.
 */
export async function resolveResourceRouteParams(
  request: NextRequest,
  contextOrParams?: unknown
): Promise<{ workspaceId: string | null; resourceId: string | null }> {
  let workspaceId: string | null = null;
  let resourceId: string | null = null;

  if (contextOrParams && typeof contextOrParams === "object") {
    try {
      const anyCtx = contextOrParams as Record<string, unknown>;
      const rawParams = anyCtx.params !== undefined ? anyCtx.params : anyCtx;
      const resolved = await Promise.resolve(rawParams);
      if (resolved && typeof resolved === "object") {
        const resObj = resolved as Record<string, unknown>;
        if (typeof resObj.workspaceId === "string" && resObj.workspaceId.trim()) {
          workspaceId = resObj.workspaceId.trim();
        }
        if (typeof resObj.resourceId === "string" && resObj.resourceId.trim()) {
          resourceId = resObj.resourceId.trim();
        }
      }
    } catch {
      // Continue to fallback
    }
  }

  // URL Pathname Fallback: /api/workspaces/:workspaceId/resources/:resourceId/...
  try {
    const pathname = request.nextUrl?.pathname || new URL(request.url).pathname;
    if (!workspaceId) {
      const wsMatch = pathname.match(/\/api\/workspaces\/([^/]+)/);
      if (wsMatch && wsMatch[1] && wsMatch[1] !== "switch") {
        workspaceId = decodeURIComponent(wsMatch[1]).trim();
      }
    }
    if (!resourceId) {
      const resMatch = pathname.match(/\/resources\/([^/]+)/);
      if (resMatch && resMatch[1] && !["import", "export", "bulk"].includes(resMatch[1])) {
        resourceId = decodeURIComponent(resMatch[1]).trim();
      }
    }
  } catch {
    // Ignore URL parse errors
  }

  return { workspaceId, resourceId };
}
