import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

let client: ReturnType<typeof postgres> | null = null;
let database: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (database) {
    return database;
  }

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not defined");
  }

  client = postgres(connectionString);

  database = drizzle(client);

  return database;
}