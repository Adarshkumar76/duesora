import { sql } from "drizzle-orm";
import { getDb } from "@/db";

export async function GET() {
  const health: {
    status: "ok" | "degraded" | "error";
    timestamp: string;
    uptime: number;
    services: {
      database: "connected" | "disconnected";
    };
  } = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: "disconnected",
    },
  };

  try {
    const db = getDb();
    await db.execute(sql`SELECT 1`);
    health.services.database = "connected";
  } catch {
    health.services.database = "disconnected";
    health.status = "degraded";
  }

  const httpStatus = health.status === "ok" ? 200 : 503;

  return Response.json(health, { status: httpStatus });
}
