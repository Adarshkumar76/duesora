import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";

let client: ReturnType<typeof postgres> | null = null;
let database: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (database) {
    return database;
  }

  const connectionString = env.DATABASE_URL;

  client = postgres(connectionString);
  database = drizzle(client);

  return database;
}