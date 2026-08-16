# AI Coding Agent Instructions

This file is the primary instruction set for AI coding agents working on
Duesora.

## Mission

Build Duesora as a secure, maintainable, free, self-hostable open-source
product.

## Non-negotiable rules

1.  **Security first.** Never weaken authorization, SSRF protections,
    secret handling, or validation to make a feature easier.
2.  **Workspace isolation.** Every workspace-owned entity must be
    queried and authorized within the active workspace.
3.  **No secrets in source, fixtures, logs, screenshots, tests, or
    examples.**
4.  **No floating-point money.** Store integer minor units plus ISO
    currency.
5.  **No slow external network calls in request handlers** when they can
    be queued.
6.  **Jobs are idempotent.** Retrying a job must not duplicate
    notifications, renewals, or charges.
7.  **Migrations are explicit.** Never modify a production schema
    without a migration.
8.  **No destructive migration without a rollback/data-preservation
    plan.**
9.  **Validate at trust boundaries.** Browser input, API input,
    webhooks, imports, and integration responses are untrusted.
10. **Do not store third-party account passwords.**
11. **Do not add a mandatory paid dependency for core functionality.**
12. **Do not invent provider API behavior.** Verify provider contracts
    before implementation.
13. **Update tests and docs with behavior changes.**
14. **Do not silently change public API/webhook payloads.**
15. **Prefer simple code over speculative abstraction.**

## Before coding

Read:

1.  `docs/PRODUCT.md`
2.  `docs/ARCHITECTURE.md`
3.  `docs/DATABASE_SCHEMA.md`
4.  `docs/SECURITY_ARCHITECTURE.md`
5.  `docs/ENGINEERING_STANDARDS.md`
6.  relevant ADRs

Then state internally:

-   affected domain entities;
-   authorization rule;
-   validation rule;
-   migration impact;
-   asynchronous work;
-   security threats;
-   tests required.

## Feature implementation order

``` text
requirements
 -> threat/permission analysis
 -> domain model
 -> database migration if needed
 -> service/use case
 -> tests
 -> API boundary
 -> UI
 -> docs
 -> observability
```

Do not start with UI if the domain behavior is undefined.

## Architecture constraints

-   UI components do not contain business policy.
-   API handlers remain thin.
-   Database access goes through defined repositories/services.
-   Workers call shared application services.
-   Integrations implement interfaces/adapters.
-   Avoid circular dependencies.
-   Keep provider-specific code out of core domain logic.

## Authorization pattern

For any operation on a resource:

``` text
authenticate user
 -> resolve workspace membership
 -> load resource scoped to workspace
 -> evaluate action permission
 -> perform operation
 -> audit if sensitive
```

Never:

``` text
load resource by arbitrary id
 -> trust frontend workspace id
 -> update
```

## Monitoring rule

Any code that connects to a user-supplied hostname/IP/URL must use the
centralized safe-network/SSRF guard. Agents must not implement ad-hoc
`fetch(userUrl)` or socket connections outside that guard.

## Testing requirement

Every feature should consider:

-   happy path;
-   invalid input;
-   unauthorized user;
-   wrong workspace/tenant;
-   missing resource;
-   retry/idempotency;
-   external service timeout/failure;
-   timezone/date edge cases;
-   concurrency where relevant.

## Change discipline

Do not rewrite unrelated files. Do not rename public concepts casually.
Do not introduce a new framework/library when the current stack solves
the problem adequately. Explain major dependency additions in an ADR.

## Definition of done

A change is done only when lint, type-check, tests, build,
security-sensitive tests, docs, and migrations are complete.
