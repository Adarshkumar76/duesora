# Notifications

## Core channels

-   in-app;
-   SMTP email;
-   signed generic webhook.

These should be sufficient for a fully free/self-hosted deployment.

## Optional adapters

-   Discord;
-   Slack;
-   Telegram;
-   ntfy;
-   Gotify.

## Reminder offsets

Support policies such as:

-   30 days;
-   14 days;
-   7 days;
-   3 days;
-   1 day;
-   on due/expiry.

## States

``` text
pending -> sent
        -> failed
sent -> acknowledged
```

Support snooze/escalation as later states/workflows.

## Rules

-   prevent duplicate sends;
-   respect workspace/user preferences;
-   keep message templates deterministic;
-   avoid putting secrets in notifications;
-   include a direct link to the relevant resource when safe;
-   record delivery attempts without retaining sensitive provider
    responses unnecessarily.
