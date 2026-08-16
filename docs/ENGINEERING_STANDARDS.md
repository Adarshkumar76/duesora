# Engineering Standards

## TypeScript

-   Enable strict mode.
-   Avoid `any`; use `unknown` at untrusted boundaries and narrow it.
-   Prefer explicit domain types.
-   Never use non-null assertions to bypass legitimate uncertainty.
-   Validate runtime data with a schema validator.

## Error handling

Use typed/domain errors where practical:

-   validation;
-   unauthenticated;
-   forbidden;
-   not found;
-   conflict;
-   rate limited;
-   dependency unavailable.

Do not expose stack traces or sensitive internal details to users.

## Dates

-   Store timestamps in UTC.
-   Store the relevant timezone for human schedules.
-   Do not calculate renewal rules using string manipulation.
-   Test DST/timezone boundaries.

## Money

-   integer minor units;
-   ISO 4217 currency code;
-   preserve source currency;
-   make exchange-rate source/date explicit if conversion is added.

## Logging

Structured fields:

``` json
{
  "level": "info",
  "service": "reminder-worker",
  "requestId": "...",
  "workspaceId": "...",
  "resourceId": "...",
  "event": "reminder.sent"
}
```

Do not log tokens, passwords, cookies, authorization headers, full
sensitive payloads, or document contents.

## Database

-   migrations checked into source;
-   foreign keys where appropriate;
-   indexes justified by queries;
-   transactions for invariants;
-   avoid N+1 queries;
-   pagination for collections;
-   archive instead of destructive delete when operational history
    matters.

## API

-   version public API;
-   stable error shape;
-   pagination;
-   request IDs;
-   rate limits;
-   idempotency for retryable creation/actions;
-   OpenAPI documentation when public API is introduced.

## Accessibility

Target WCAG 2.2 AA:

-   semantic HTML;
-   keyboard navigation;
-   visible focus;
-   accessible names;
-   contrast;
-   reduced motion;
-   responsive layouts.

## Performance

Measure before optimizing, but prohibit obvious unbounded behavior:
unlimited list reads, unlimited uploads, unbounded job retries, or
unbounded external responses.
