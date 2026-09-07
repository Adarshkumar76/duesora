# Deployment

## Primary supported path

Docker Compose should be the simplest production-capable path for small
installations.

Services:

``` text
web
worker
postgres
redis
```

Optional:

``` text
reverse-proxy
object-storage
observability
```

## Production requirements

-   HTTPS;
-   strong secrets;
-   persistent PostgreSQL volume;
-   persistent attachment storage;
-   backups;
-   outbound network controls for monitor workers where possible;
-   SMTP or another configured notification path;
-   health checks;
-   resource limits;
-   regular upgrades.

## Reverse proxy

Document examples for common proxies later, but do not make one vendor
mandatory.

## Horizontal scaling

Web instances should be stateless where practical. Workers can scale by
queue. Schedulers need leader/locking semantics to avoid duplicate
scheduling.
