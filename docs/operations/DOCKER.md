# Docker Standards

## Goals

A new user should not manually install PostgreSQL or Redis.

## Target

``` bash
cp .env.example .env
docker compose up -d
```

## Image rules

-   run as non-root where practical;
-   minimal runtime image;
-   pin major/runtime versions;
-   health checks;
-   no secrets baked into image layers;
-   deterministic builds;
-   migrations handled explicitly;
-   graceful shutdown for web/workers.

## Volumes

Persist:

-   PostgreSQL data;
-   local attachment data if local storage is used.

Redis should not be the sole source of truth for critical business data.
