import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { z } from "zod";

export const dynamic = "force-dynamic";

const profileUpdateSchema = z.object({
  name: z.string().min(1, "Name cannot be empty").max(100, "Name is too long").optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, "New password must be at least 8 characters").optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { message: "Unauthorized. Please sign in." } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = profileUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            message: parsed.error.issues[0]?.message || "Invalid input data",
            details: parsed.error.format(),
          },
        },
        { status: 400 }
      );
    }

    const { name, currentPassword, newPassword } = parsed.data;

    if (!name && !newPassword) {
      return NextResponse.json(
        { error: { message: "Nothing to update." } },
        { status: 400 }
      );
    }

    const db = getDb();
    const [existingUser] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        passwordHash: users.passwordHash,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!existingUser) {
      return NextResponse.json(
        { error: { message: "User account not found." } },
        { status: 404 }
      );
    }

    const updateFields: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) {
      updateFields.name = name.trim();
    }

    // Handle password change if requested
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: { message: "Current password is required to set a new password." } },
          { status: 400 }
        );
      }

      if (!existingUser.passwordHash) {
        return NextResponse.json(
          { error: { message: "Account has no password set. Please use password reset." } },
          { status: 400 }
        );
      }

      const isValidCurrent = await verifyPassword(currentPassword, existingUser.passwordHash);
      if (!isValidCurrent) {
        return NextResponse.json(
          { error: { message: "The current password you entered is incorrect." } },
          { status: 400 }
        );
      }

      const newHash = await hashPassword(newPassword);
      updateFields.passwordHash = newHash;
    }

    const [updated] = await db
      .update(users)
      .set(updateFields)
      .where(eq(users.id, session.user.id))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
      });

    return NextResponse.json({
      data: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
      },
      message: newPassword
        ? "Profile details and password updated successfully."
        : "Profile name updated successfully.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update profile";
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}
