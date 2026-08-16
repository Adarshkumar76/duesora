# ADR 0001: Use PostgreSQL as the Primary Database

## Status

Accepted for initial architecture.

## Context

Duesora has relational concepts including workspaces, memberships,
owners, renewals, historical costs, notifications, monitoring
observations, and audit records.

## Decision

Use PostgreSQL as the primary source of truth.

## Consequences

Benefits:

-   relational integrity;
-   transactions;
-   strong indexing/query capabilities;
-   JSONB remains available for provider-specific metadata;
-   mature self-hosting ecosystem.

Costs:

-   contributors need PostgreSQL, mitigated by Docker Compose;
-   schema changes require disciplined migrations.
