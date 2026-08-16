# Start Here - AI Agent Build Order

When using an AI coding agent, do not ask it to "build the whole app" in
one prompt.

## Phase 0 - Foundation

Ask the agent to:

1.  initialize monorepo;
2.  configure TypeScript strict mode;
3.  add formatting/linting;
4.  create Docker Compose for PostgreSQL + Redis;
5.  create typed environment validation;
6.  add CI skeleton;
7.  add health endpoint;
8.  add testing framework.

Stop and verify.

## Phase 1 - Identity and tenancy

Build:

-   users;
-   authentication;
-   workspaces;
-   memberships;
-   roles;
-   centralized authorization policy.

Before proceeding, write tests proving one workspace cannot access
another.

## Phase 2 - Resource inventory

Build:

-   resources;
-   tags;
-   owners;
-   filters;
-   resource UI.

## Phase 3 - Renewals and costs

Build:

-   renewals;
-   recurrence;
-   cost history;
-   dashboard;
-   timezone behavior.

## Phase 4 - Reminder engine

Build:

-   policies;
-   scheduler;
-   BullMQ jobs;
-   in-app notifications;
-   SMTP;
-   deduplication/idempotency.

## Phase 5 - Monitoring

Build the centralized safe-network layer **before** TLS/domain monitors.

Then:

-   TLS monitor;
-   observations;
-   alerts;
-   domain/RDAP monitor.

## Phase 6 - Team/open-source maturity

Build:

-   invites;
-   audit log;
-   imports/exports;
-   webhooks;
-   backup/restore;
-   docs;
-   release process.

## Prompt pattern

For each feature, instruct the agent:

> Read the Duesora architecture, database, security, engineering, and
> AI-agent instruction docs first. Implement only \[feature\]. Identify
> authorization, validation, migration, security, idempotency, and test
> requirements before changing code. Do not modify unrelated files. Do
> not weaken workspace isolation or SSRF controls. Update tests and
> docs.

This keeps agent work reviewable.
