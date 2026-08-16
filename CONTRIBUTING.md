# Contributing to Duesora

Thank you for contributing.

## Before starting

1.  Search existing issues and pull requests.
2.  For large features, open a proposal/discussion before
    implementation.
3.  Security vulnerabilities must follow `SECURITY.md`, not public
    issues.
4.  Keep changes focused. Avoid unrelated refactors in the same PR.

## Development workflow

``` text
issue/proposal
    -> feature branch
    -> implementation
    -> tests
    -> pull request
    -> CI
    -> review
    -> merge
```

Never develop directly on protected `main`.

## Branch naming

-   `feat/ssl-monitoring`
-   `fix/duplicate-reminders`
-   `docs/docker-install`
-   `refactor/resource-service`
-   `security/webhook-validation`

## Commit convention

Use Conventional Commit-style messages:

-   `feat: add TLS expiry monitor`
-   `fix: prevent duplicate reminder delivery`
-   `docs: document SMTP configuration`
-   `test: add recurrence calculation tests`
-   `refactor: extract notification service`
-   `chore: update dependencies`
-   `security: restrict outbound monitor targets`

## Pull request requirements

A PR should:

-   explain the problem and solution;
-   link related issues;
-   include tests for behavior changes;
-   update docs for user-facing/configuration changes;
-   include migration steps for schema/config changes;
-   pass lint, type-check, tests, and build;
-   avoid introducing secrets or credentials;
-   preserve tenant/workspace authorization boundaries.

## Definition of done

Code is not done until:

-   behavior works;
-   error paths are handled;
-   authorization is verified;
-   tests exist;
-   logs are useful and do not expose secrets;
-   docs are updated;
-   migration/rollback impact is understood.

See `docs/ENGINEERING_STANDARDS.md` and `docs/AI_AGENT_INSTRUCTIONS.md`.
