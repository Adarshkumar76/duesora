import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  pgEnum,
  unique,
} from "drizzle-orm/pg-core";

export const workspaceTypeEnum = pgEnum("workspace_type", [
  "personal",
  "organization",
]);

export const membershipRoleEnum = pgEnum("membership_role", [
  "owner",
  "admin",
  "member",
  "viewer",
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),

  email: varchar("email", { length: 255 }).notNull().unique(),

  name: varchar("name", { length: 120 }),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});

export const workspaces = pgTable("workspaces", {
  id: uuid("id").defaultRandom().primaryKey(),

  name: varchar("name", { length: 120 }).notNull(),

  slug: varchar("slug", { length: 120 }).notNull().unique(),

  type: workspaceTypeEnum("type").notNull().default("personal"),

  defaultCurrency: varchar("default_currency", { length: 3 })
    .notNull()
    .default("INR"),

  timezone: varchar("timezone", { length: 100 })
    .notNull()
    .default("Asia/Kolkata"),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});

export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    role: membershipRoleEnum("role").notNull().default("member"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("memberships_workspace_user_unique").on(
      table.workspaceId,
      table.userId,
    ),
  ],
);
