import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { listUserWorkspaces } from "@/lib/auth/workspace";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      {
        error: {
          code: "UNAUTHORIZED",
          message: "You must be signed in to view your workspaces.",
        },
      },
      { status: 401 }
    );
  }

  const userWorkspaces = await listUserWorkspaces(session.user.id);

  return NextResponse.json(
    {
      data: userWorkspaces,
    },
    { status: 200 }
  );
}
