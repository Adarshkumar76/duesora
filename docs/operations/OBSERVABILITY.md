# Observability

## Logs

Use structured logs with:

-   timestamp;
-   level;
-   service;
-   request/job ID;
-   workspace/resource IDs when useful;
-   event/error code.

Never log secrets.

## Metrics

Useful metrics:

-   HTTP latency/error rate;
-   queue depth;
-   job duration/failure;
-   monitor success/failure;
-   reminder delivery failure;
-   database connection health;
-   worker heartbeat;
-   scheduled jobs overdue.

## Health endpoints

Suggested:

-   `/api/health` - process is alive;
-   `/api/ready` - dependencies required to serve traffic are ready.

Do not expose sensitive configuration through health endpoints.

## Tracing

Optional OpenTelemetry can be added when operational complexity
justifies it.
