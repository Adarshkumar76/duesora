# Testing Strategy

## Unit

Test:

-   recurrence calculations;
-   reminder offsets;
-   cost normalization;
-   authorization policies;
-   validation;
-   status transitions.

## Integration

Test:

-   PostgreSQL repositories;
-   transactions;
-   Redis/BullMQ jobs;
-   SMTP adapter;
-   webhook signing;
-   TLS monitor through controlled fixtures;
-   migrations.

## End-to-end

Critical flow:

``` text
register/login
 -> create workspace
 -> add resource
 -> assign owner
 -> create renewal
 -> configure reminder
 -> dashboard shows it
```

## Security tests

Mandatory cases:

-   user cannot access another workspace's resource;
-   viewer cannot perform write action;
-   guessed IDs do not bypass policy;
-   monitor rejects loopback/private/link-local/metadata targets;
-   redirects cannot bypass SSRF checks;
-   webhook signature/replay checks;
-   malicious upload rejection;
-   rate-limit behavior for auth-sensitive endpoints.

## CI gate

PR:

``` text
install -> lint -> typecheck -> unit -> integration -> build -> selected e2e
```
