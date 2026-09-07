# Jobs and Queues

Redis + BullMQ is the recommended initial queue.

## Queues

-   `monitor-tls`
-   `monitor-domain`
-   `reminders`
-   `notifications`
-   `imports`
-   `maintenance`

## Job rules

-   deterministic/idempotent job keys where possible;
-   bounded retries;
-   exponential backoff;
-   timeout;
-   concurrency limits;
-   dead-letter/failed-job visibility;
-   structured logs;
-   no secret payloads when an ID/reference can be used.

## Reminder idempotency

Generate a stable dedupe key from:

``` text
resource + renewal + policy + offset + recipient + channel
```

Enforce uniqueness at the database layer.

## Scheduling

A scheduler identifies due work and enqueues jobs. Workers perform
external operations. Avoid putting long external requests inside the
scheduler transaction.

## Failure model

Transient failure -\> retry. Permanent validation/configuration failure
-\> fail without endless retry. Security policy rejection -\> fail and
record safe reason.
