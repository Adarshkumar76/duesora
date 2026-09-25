import { NextRequest } from "next/server";
import { validateBearerApiKey } from "@/lib/auth/api-key";

export interface V1AuthContext {
  workspaceId: string;
  userId: string;
  permissions: "read" | "write" | "admin";
}

/**
 * Validates Bearer API token from the Authorization header
 * and verifies permission level.
 */
export async function authenticateV1Request(
  request: NextRequest,
  requiredPermission: "read" | "write" | "admin" = "read"
): Promise<{ auth?: V1AuthContext; response?: Response }> {
  const authHeader = request.headers.get("authorization") || "";
  if (!authHeader.startsWith("Bearer ")) {
    return {
      response: Response.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "Missing or malformed Authorization header. Expected 'Bearer due_live_...'",
          },
        },
        { status: 401 }
      ),
    };
  }

  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  const verified = await validateBearerApiKey(token);

  if (!verified) {
    return {
      response: Response.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "Invalid, revoked, or expired API key",
          },
        },
        { status: 401 }
      ),
    };
  }

  const permissions = verified.permissions as "read" | "write" | "admin";

  // Check permission hierarchy
  const hierarchy: Record<"read" | "write" | "admin", number> = {
    read: 1,
    write: 2,
    admin: 3,
  };

  const userLevel = hierarchy[permissions] || 1;
  const requiredLevel = hierarchy[requiredPermission] || 1;

  if (userLevel < requiredLevel) {
    return {
      response: Response.json(
        {
          error: {
            code: "FORBIDDEN",
            message: `API key has '${permissions}' permissions, but '${requiredPermission}' is required for this operation.`,
          },
        },
        { status: 403 }
      ),
    };
  }

  return {
    auth: {
      workspaceId: verified.workspaceId,
      userId: verified.userId,
      permissions,
    },
  };
}
