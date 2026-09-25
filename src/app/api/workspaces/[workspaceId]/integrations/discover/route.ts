import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { resolveWorkspaceId } from "@/lib/api/route-params";
import { requireWorkspaceRole } from "@/lib/auth/workspace";
import {
  verifyCloudflareToken,
  discoverCloudflareResources,
} from "@/lib/providers/cloudflare";
import { createWorkspaceResource } from "@/lib/resources/service";

const discoverRequestSchema = z.object({
  provider: z.enum(["cloudflare", "aws_route53"]).default("cloudflare"),
  apiToken: z.string().trim().min(1, "API Token is required"),
  action: z.enum(["discover", "import"]).default("discover"),
  itemsToImport: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        type: z.enum(["domain", "subscription", "other"]).default("domain"),
        status: z.enum(["active", "pending", "deactivated", "unknown"]).default("active"),
        provider: z.string().default("Cloudflare"),
        websiteUrl: z.string().optional().nullable(),
      })
    )
    .optional(),
});

export async function POST(request: NextRequest, context?: unknown) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const workspaceId = await resolveWorkspaceId(request, context);
    if (!workspaceId) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Missing or invalid workspaceId parameter" } },
        { status: 400 }
      );
    }

    await requireWorkspaceRole(session.user.id, workspaceId, "member");

    const body = await request.json().catch(() => null);
    const parsed = discoverRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid discovery payload",
            details: parsed.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { provider, apiToken, action, itemsToImport } = parsed.data;

    if (provider === "cloudflare") {
      // 1. Verify Token
      const tokenVerification = await verifyCloudflareToken(apiToken);
      if (!tokenVerification.valid) {
        return NextResponse.json(
          {
            error: {
              code: "PROVIDER_AUTH_FAILED",
              message: tokenVerification.error || "Invalid Cloudflare API Token",
            },
          },
          { status: 400 }
        );
      }

      // If user selected import action
      if (action === "import" && itemsToImport && itemsToImport.length > 0) {
        const imported = [];
        for (const item of itemsToImport) {
          try {
            const created = await createWorkspaceResource(session.user.id, {
              workspaceId,
              name: item.name,
              type: "domain",
              provider: item.provider || "Cloudflare",
              websiteUrl: item.websiteUrl || `https://${item.name}`,
              category: "Cloud / DNS",
              autoRenew: true,
            });
            if (created) imported.push(created);
          } catch (importErr) {
            console.error(`Failed to import discovered domain ${item.name}:`, importErr);
          }
        }

        return NextResponse.json({
          data: {
            success: true,
            importedCount: imported.length,
            imported,
          },
        });
      }

      // Default: Discover action
      const discoveryResult = await discoverCloudflareResources(workspaceId, apiToken);

      return NextResponse.json({
        data: discoveryResult,
      });
    }

    return NextResponse.json(
      {
        error: {
          code: "PROVIDER_NOT_SUPPORTED",
          message: `Provider ${provider} is not currently supported for auto-discovery`,
        },
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("Provider discovery error:", error);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Failed to execute provider discovery",
        },
      },
      { status: 500 }
    );
  }
}
