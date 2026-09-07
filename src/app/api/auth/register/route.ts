import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users, workspaces, memberships } from "@/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { registerSchema } from "@/lib/auth/register-schema";

function generateSlug(name: string): string {
  const sanitized = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
  const suffix = crypto.randomUUID().slice(0, 6);
  return `${sanitized || "workspace"}-${suffix}`;
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parseResult = registerSchema.safeParse(json);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid registration input",
            details: parseResult.error.format(),
          },
        },
        { status: 400 },
      );
    }

    const { name, email, password } = parseResult.data;
    const db = getDb();

    // Check if user already exists
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        {
          error: {
            code: "CONFLICT",
            message: "An account with this email address already exists",
          },
        },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);
    const workspaceSlug = generateSlug(name);
    const workspaceName = `${name}'s Workspace`;

    // Atomic transaction: create user + workspace + owner membership
    const result = await db.transaction(async (tx) => {
      const [newUser] = await tx
        .insert(users)
        .values({
          email,
          name,
          passwordHash,
          status: "active",
        })
        .returning({
          id: users.id,
          email: users.email,
          name: users.name,
        });

      const [newWorkspace] = await tx
        .insert(workspaces)
        .values({
          name: workspaceName,
          slug: workspaceSlug,
          type: "personal",
          defaultCurrency: "INR",
          timezone: "Asia/Kolkata",
        })
        .returning({
          id: workspaces.id,
          slug: workspaces.slug,
          name: workspaces.name,
        });

      await tx.insert(memberships).values({
        userId: newUser.id,
        workspaceId: newWorkspace.id,
        role: "owner",
      });

      return { user: newUser, workspace: newWorkspace };
    });

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    console.error("Failed to register user:", error);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to create account. Please try again.",
        },
      },
      { status: 500 },
    );
  }
}
