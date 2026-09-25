import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { workspaces, users } from "./schema";

export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    name: varchar("name", { length: 100 }).notNull(),

    keyPrefix: varchar("key_prefix", { length: 16 }).notNull(),

    keyHash: varchar("key_hash", { length: 64 }).notNull(),

    permissions: varchar("permissions", { length: 20 })
      .notNull()
      .default("read"),

    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),

    expiresAt: timestamp("expires_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("api_keys_workspace_idx").on(table.workspaceId),
    index("api_keys_hash_idx").on(table.keyHash),
  ]
);
