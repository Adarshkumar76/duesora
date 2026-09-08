import { sql } from "drizzle-orm";
import { getDb } from "@/db";

export async function GET() {
  try {
    const db = getDb();

    await db.execute(sql`SELECT 1`);

    return Response.json({
      status: "ok",
      database: "connected",
    });
  } catch {
    return Response.json(
      {
        status: "error",
        database: "disconnected",
      },
      { status: 500 }
    );
  }
}