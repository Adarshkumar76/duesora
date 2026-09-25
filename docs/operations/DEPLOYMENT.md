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

## Reverse Proxy Architecture

Turnkey reverse proxy assets are provided in [`deploy/reverse-proxy/`](file:///c:/Users/Adarsh/Desktop/duesora/deploy/reverse-proxy):

1. **Caddy (Automated Let's Encrypt HTTPS - Recommended)**:
   - Config file: [`deploy/reverse-proxy/Caddyfile`](file:///c:/Users/Adarsh/Desktop/duesora/deploy/reverse-proxy/Caddyfile)
   - Docker Compose overlay: [`deploy/reverse-proxy/docker-compose.caddy.yml`](file:///c:/Users/Adarsh/Desktop/duesora/deploy/reverse-proxy/docker-compose.caddy.yml)
   - Automatically provisions and renews TLS certificates with zero manual intervention.
   - Run alongside Duesora:
     ```bash
     DOMAIN="duesora.yourdomain.com" docker compose -f docker-compose.yml -f deploy/reverse-proxy/docker-compose.caddy.yml up -d
     ```

2. **Nginx**:
   - Config file: [`deploy/reverse-proxy/nginx.conf`](file:///c:/Users/Adarsh/Desktop/duesora/deploy/reverse-proxy/nginx.conf)
   - Includes WebSocket upgrade headers, 50MB max body size, and security headers.

## Operator CLI Verification

Run the built-in system diagnostics before opening traffic to users:

```bash
npm run duesora -- doctor
# or inside the web container:
docker compose exec web node ./bin/duesora.mjs doctor
```

## Horizontal scaling

Web instances should be stateless where practical. Workers can scale by
queue. Schedulers need leader/locking semantics to avoid duplicate
scheduling. Attachments should be backed by persistent network volumes
or S3-compatible object storage.

