import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { workspaces, resources } from "./schema";

export const resourceDependencies = pgTable(
  "resource_dependencies",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),

    resourceId: uuid("resource_id")
      .notNull()
      .references(() => resources.id, { onDelete: "cascade" }),

    dependsOnResourceId: uuid("depends_on_resource_id")
      .notNull()
      .references(() => resources.id, { onDelete: "cascade" }),

    notes: varchar("notes", { length: 255 }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("resource_dependencies_workspace_idx").on(table.workspaceId),
    index("resource_dependencies_resource_idx").on(table.resourceId),
    index("resource_dependencies_depends_on_idx").on(table.dependsOnResourceId),
    unique("resource_dependencies_unique").on(
      table.resourceId,
      table.dependsOnResourceId
    ),
  ]
);
