# Webhooks

## Outgoing event examples

-   `resource.created`
-   `resource.updated`
-   `resource.expiring`
-   `resource.expired`
-   `resource.owner_missing`
-   `monitor.check_failed`
-   `cost.changed`
-   `reminder.acknowledged`

## Delivery

Each event should have:

-   unique event ID;
-   event type;
-   timestamp;
-   workspace-safe payload;
-   signature.

## Signature concept

Use a documented HMAC signature with a per-endpoint secret and
timestamp. Consumers must be able to reject old/replayed payloads.

## Retries

Retry transient failures with exponential backoff. Provide delivery
history and a manual redelivery mechanism later.

Never include integration secrets or unrelated private fields in webhook
payloads.
