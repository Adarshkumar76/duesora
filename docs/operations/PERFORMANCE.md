# Performance

## Guardrails

-   paginate large collections;
-   index common workspace/status/date queries;
-   avoid N+1 queries;
-   move external calls to workers;
-   bound upload sizes;
-   bound external response sizes;
-   bound queue retries;
-   cache only where correctness is preserved.

## Measure

Track:

-   dashboard query latency;
-   API p95 latency;
-   job queue delay;
-   monitor duration;
-   database slow queries;
-   frontend bundle size.

Do not add caching as a substitute for fixing incorrect queries.
