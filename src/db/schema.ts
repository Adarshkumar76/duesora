import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  pgEnum,
  unique,
  text,
  integer,
  boolean,
  primaryKey,
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

export const resourceTypeEnum = pgEnum("resource_type", [
  "domain",
  "ssl_certificate",
  "subscription",
  "hosting",
  "cloud_service",
  "software_license",
  "contract",
  "warranty",
  "document",
  "custom",
]);

export const resourceStatusEnum = pgEnum("resource_status", [
  "active",
  "inactive",
  "expired",
  "archived",
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),

  email: varchar("email", { length: 255 }).notNull().unique(),

  name: varchar("name", { length: 120 }),

  passwordHash: varchar("password_hash", { length: 255 }),

  emailVerifiedAt: timestamp("email_verified_at", {
    withTimezone: true,
  }),

  status: varchar("status", { length: 20 }).notNull().default("active"),

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

export const resources = pgTable("resources", {
  id: uuid("id").defaultRandom().primaryKey(),

  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),

  name: varchar("name", { length: 200 }).notNull(),

  type: resourceTypeEnum("type").notNull(),

  status: resourceStatusEnum("status").notNull().default("active"),

  category: varchar("category", { length: 60 }),

  ownerId: uuid("owner_id").references(() => users.id, {
    onDelete: "set null",
  }),

  description: text("description"),

  provider: varchar("provider", { length: 120 }),

  websiteUrl: varchar("website_url", { length: 2048 }),

  amountMinor: integer("amount_minor"),

  currency: varchar("currency", { length: 3 }).default("USD").notNull(),

  billingCycle: varchar("billing_cycle", { length: 20 }).default("yearly").notNull(),

  renewalDate: timestamp("renewal_date", {
    withTimezone: true,
  }),

  autoRenew: boolean("auto_renew").default(true).notNull(),

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

export const tags = pgTable(
  "tags",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),

    name: varchar("name", { length: 50 }).notNull(),

    colorToken: varchar("color_token", { length: 20 }).default("slate").notNull(),

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
    unique("tags_workspace_name_unique").on(table.workspaceId, table.name),
  ],
);

export const resourceTags = pgTable(
  "resource_tags",
  {
    resourceId: uuid("resource_id")
      .notNull()
      .references(() => resources.id, { onDelete: "cascade" }),

    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.resourceId, table.tagId] }),
  ],
);

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),

  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),

  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  resourceId: uuid("resource_id").references(() => resources.id, {
    onDelete: "set null",
  }),

  title: varchar("title", { length: 255 }).notNull(),

  message: text("message").notNull(),

  type: varchar("type", { length: 50 }).notNull().default("system"),

  severity: varchar("severity", { length: 20 }).notNull().default("info"),

  status: varchar("status", { length: 20 }).notNull().default("unread"),

  metadata: text("metadata"),

  readAt: timestamp("read_at", {
    withTimezone: true,
  }),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});

export const reminderLogs = pgTable(
  "reminder_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),

    resourceId: uuid("resource_id")
      .notNull()
      .references(() => resources.id, { onDelete: "cascade" }),

    channel: varchar("channel", { length: 30 }).notNull().default("in_app"),

    intervalDays: integer("interval_days").notNull(),

    cycleKey: varchar("cycle_key", { length: 50 }).notNull(),

    recipient: varchar("recipient", { length: 255 }).notNull(),

    status: varchar("status", { length: 20 }).notNull().default("sent"),

    dispatchedAt: timestamp("dispatched_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("reminder_logs_resource_channel_interval_cycle_unique").on(
      table.resourceId,
      table.channel,
      table.intervalDays,
      table.cycleKey
    ),
  ]
);


