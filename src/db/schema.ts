import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  pgEnum,
  unique,
  index,
  text,
  integer,
  boolean,
  primaryKey,
  doublePrecision,
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

// Resources Table (with renewal decision and governance fields)
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

  renewalDecision: varchar("renewal_decision", { length: 30 })
    .default("none")
    .notNull(),

  decisionNotes: text("decision_notes"),

  cancellationNoticeDays: integer("cancellation_notice_days"),

  cancellationDeadline: timestamp("cancellation_deadline", {
    withTimezone: true,
  }),

  decidedByUserId: uuid("decided_by_user_id").references(() => users.id, {
    onDelete: "set null",
  }),

  decidedAt: timestamp("decided_at", {
    withTimezone: true,
  }),

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

export const webhookEndpoints = pgTable("webhook_endpoints", {
  id: uuid("id").defaultRandom().primaryKey(),

  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),

  url: varchar("url", { length: 2048 }).notNull(),

  description: varchar("description", { length: 255 }),

  secret: varchar("secret", { length: 255 }).notNull(),

  events: text("events").notNull().default('["*"]'),

  active: boolean("active").notNull().default(true),

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

export const webhookDeliveries = pgTable("webhook_deliveries", {
  id: uuid("id").defaultRandom().primaryKey(),

  webhookEndpointId: uuid("webhook_endpoint_id")
    .notNull()
    .references(() => webhookEndpoints.id, { onDelete: "cascade" }),

  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),

  event: varchar("event", { length: 100 }).notNull(),

  payload: text("payload").notNull(),

  statusCode: integer("status_code"),

  responseBody: text("response_body"),

  durationMs: integer("duration_ms"),

  error: text("error"),

  status: varchar("status", { length: 20 }).notNull().default("pending"),

  deliveredAt: timestamp("delivered_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});

export const resourceMonitors = pgTable(
  "resource_monitors",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),

    resourceId: uuid("resource_id")
      .notNull()
      .references(() => resources.id, { onDelete: "cascade" }),

    hostname: varchar("hostname", { length: 255 }).notNull(),

    status: varchar("status", { length: 50 }).notNull().default("unknown"),

    tlsIssuer: varchar("tls_issuer", { length: 255 }),
    tlsSubject: varchar("tls_subject", { length: 255 }),
    tlsValidFrom: timestamp("tls_valid_from", { withTimezone: true }),
    tlsValidTo: timestamp("tls_valid_to", { withTimezone: true }),
    tlsDaysRemaining: integer("tls_days_remaining"),
    tlsProtocol: varchar("tls_protocol", { length: 50 }),

    dnsNameservers: text("dns_nameservers"),
    dnsIpv4: text("dns_ipv4"),

    latencyMs: integer("latency_ms"),
    lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
    errorMessage: text("error_message"),

    lastAlertStatus: varchar("last_alert_status", { length: 50 }),
    lastAlertedAt: timestamp("last_alerted_at", { withTimezone: true }),

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
    unique("resource_monitors_resource_unique").on(table.resourceId),
    index("resource_monitors_workspace_idx").on(table.workspaceId),
  ],
);

export const resourceMonitorLogs = pgTable(
  "resource_monitor_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    monitorId: uuid("monitor_id")
      .notNull()
      .references(() => resourceMonitors.id, { onDelete: "cascade" }),

    resourceId: uuid("resource_id")
      .notNull()
      .references(() => resources.id, { onDelete: "cascade" }),

    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),

    status: varchar("status", { length: 50 }).notNull(),
    latencyMs: integer("latency_ms"),
    tlsDaysRemaining: integer("tls_days_remaining"),
    message: text("message"),

    checkedAt: timestamp("checked_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("resource_monitor_logs_monitor_idx").on(table.monitorId),
    index("resource_monitor_logs_resource_idx").on(table.resourceId),
  ],
);

export const workspaceInvitations = pgTable(
  "workspace_invitations",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),

    email: varchar("email", { length: 255 }).notNull(),

    role: membershipRoleEnum("role").notNull().default("member"),

    token: varchar("token", { length: 255 }).notNull().unique(),

    invitedBy: uuid("invited_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),

    acceptedAt: timestamp("accepted_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("workspace_invitations_workspace_idx").on(table.workspaceId),
    index("workspace_invitations_email_idx").on(table.email),
    unique("workspace_invitations_workspace_email_unique").on(
      table.workspaceId,
      table.email
    ),
  ]
);

export const workspaceNotificationChannels = pgTable(
  "workspace_notification_channels",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),

    provider: varchar("provider", { length: 30 }).notNull(), // 'slack' | 'discord'

    name: varchar("name", { length: 100 }).notNull(),

    webhookUrl: varchar("webhook_url", { length: 2048 }).notNull(),

    events: text("events").notNull().default('["*"]'),

    active: boolean("active").notNull().default(true),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("workspace_notification_channels_workspace_idx").on(table.workspaceId),
  ]
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),

    actorId: uuid("actor_id").references(() => users.id, {
      onDelete: "set null",
    }),

    action: varchar("action", { length: 100 }).notNull(),

    entityType: varchar("entity_type", { length: 50 }).notNull(),

    entityId: varchar("entity_id", { length: 255 }),

    entityName: varchar("entity_name", { length: 255 }),

    details: text("details"),

    ipAddress: varchar("ip_address", { length: 45 }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("audit_logs_workspace_idx").on(table.workspaceId),
    index("audit_logs_created_at_idx").on(table.createdAt),
    index("audit_logs_action_idx").on(table.action),
  ]
);

export const workspaceBudgets = pgTable(
  "workspace_budgets",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),

    monthlyBudgetMinor: integer("monthly_budget_minor"),

    annualBudgetMinor: integer("annual_budget_minor"),

    currency: varchar("currency", { length: 3 }).notNull().default("USD"),

    alertThresholdPct: integer("alert_threshold_pct").notNull().default(80),

    alertEmailsEnabled: boolean("alert_emails_enabled").notNull().default(true),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("workspace_budgets_workspace_id_unique").on(table.workspaceId),
    index("workspace_budgets_workspace_idx").on(table.workspaceId),
  ]
);

export const resourceCostHistory = pgTable(
  "resource_cost_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    resourceId: uuid("resource_id")
      .notNull()
      .references(() => resources.id, { onDelete: "cascade" }),

    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),

    previousAmountMinor: integer("previous_amount_minor"),

    newAmountMinor: integer("new_amount_minor").notNull(),

    currency: varchar("currency", { length: 3 }).notNull().default("USD"),

    previousBillingCycle: varchar("previous_billing_cycle", { length: 20 }),

    newBillingCycle: varchar("new_billing_cycle", { length: 20 }),

    changePercentageBps: integer("change_percentage_bps").default(0).notNull(),

    changedByUserId: uuid("changed_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),

    changeReason: varchar("change_reason", { length: 255 }),

    effectiveDate: timestamp("effective_date", { withTimezone: true })
      .defaultNow()
      .notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("resource_cost_history_resource_idx").on(table.resourceId),
    index("resource_cost_history_workspace_idx").on(table.workspaceId),
    index("resource_cost_history_created_at_idx").on(table.createdAt),
  ]
);

export const resourceDocuments = pgTable(
  "resource_documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    resourceId: uuid("resource_id")
      .notNull()
      .references(() => resources.id, { onDelete: "cascade" }),

    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),

    fileName: varchar("file_name", { length: 255 }).notNull(),

    fileSize: integer("file_size").notNull(),

    mimeType: varchar("mime_type", { length: 100 }).notNull(),

    storagePath: varchar("storage_path", { length: 500 }).notNull(),

    uploadedByUserId: uuid("uploaded_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("resource_documents_resource_idx").on(table.resourceId),
    index("resource_documents_workspace_idx").on(table.workspaceId),
    index("resource_documents_created_at_idx").on(table.createdAt),
  ]
);

export const exchangeRates = pgTable("exchange_rates", {
  currency: varchar("currency", { length: 3 }).primaryKey(),

  rateToUsd: doublePrecision("rate_to_usd").notNull(),

  source: varchar("source", { length: 50 })
    .notNull()
    .default("open-exchange-rates"),

  fetchedAt: timestamp("fetched_at", { withTimezone: true })
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});


