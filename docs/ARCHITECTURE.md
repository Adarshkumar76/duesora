# Architecture

## Recommended stack

-   Next.js + React + TypeScript
-   PostgreSQL
-   Drizzle ORM or Prisma
-   Redis
-   BullMQ
-   SMTP
-   local filesystem plus optional S3-compatible storage
-   Docker / Docker Compose
-   Vitest or Jest
-   Playwright
-   structured logging
-   optional OpenTelemetry

## Logical architecture

``` text
Browser
  |
Next.js Web/API
  |
Application Services
  |
  +---- PostgreSQL
  |
  +---- Redis / BullMQ ---- Worker
                           |   |   |
                         TLS Domain Reminder
                              |
                         Notifications
                     SMTP/Webhook/Adapters
```

## Boundaries

### Web/API

Authentication, request validation, response formatting, authorization
entry point.

### Core/application

Resource rules, renewal calculations, permissions, cost calculations,
reminder decisions.

### Database

Persistence only. Avoid hiding business policy inside ORM callbacks.

### Worker

Long-running/network tasks, reminders, monitoring, imports.

### Integrations

Provider-specific code behind stable interfaces.

## Reliability rules

-   API requests should not wait for slow monitor/network jobs.
-   Background jobs must be idempotent.
-   Jobs must have bounded retries and exponential backoff.
-   Failed jobs must be observable.
-   Use database transactions for multi-write invariants.
-   Use an outbox/event strategy when database state and asynchronous
    events must remain consistent.
