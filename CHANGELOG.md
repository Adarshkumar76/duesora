# Changelog

All notable changes to Duesora should be documented here.

The project should use Semantic Versioning after releases become public.

## [1.0.0-rc.1] - 2026-09-25

### Added

- **Automated Database Migrations Entrypoint**: Multi-stage Alpine container startup script (`docker-entrypoint.sh`) that automatically checks and applies pending database schema migrations on launch via `duesora migrate`.
- **Duesora Operator CLI Migration Engine**: New `duesora migrate` command and `npm run db:migrate` script powered by `drizzle-orm` migrator.
- **Provider Auto-Discovery & Sync Engine**: Direct integration with Cloudflare API to verify API tokens, discover DNS zones and domains, and bulk-import with preview modals.
- **Contract Cancellation & Renegotiation Assistant**: RFC-compliant formal cancellation notice generator, seat-bloat-aware renegotiation proposal builder, clipboard copy, `.txt` download, and pre-filled email client actions (`CancellationAssistantModal`).
- **Scheduled Executive Renewal & Cost Digest Engine**: Daily/weekly cost summary generator computing 7-day and 30-day upcoming commitments, seat bloat waste savings, and secure cron endpoint (`/api/cron/digest`).
- **Production Security Hardening & Rate Limiter**: Sliding-window rate limiter protecting authentication endpoints (`/api/auth/*`), input sanitization against CRLF/XSS, and security fuzz tests.
- **License & Seat Optimization Engine**: Active seat tracking, utilization percentages, idle seat bloat alerts, and recommended cost reductions.
- **Internationalization (i18n)**: Seamless multi-language switcher supporting English, Spanish, German, French, and Japanese across all pages and navigation elements.
- **Container Healthcheck Probe**: Automated HTTP `/api/health` monitoring database connectivity and system uptime with 200/503 responses.

### Changed

- Updated `Dockerfile` with build environment placeholders, unprivileged user execution (`USER nextjs`), and CLI tools in the runner stage.
- Updated `docker-compose.yml` with `RUN_MIGRATIONS=true` and healthcheck dependencies.
- Standardized Workspace Audit Log page size to 10 entries per page.
- Polished Decision & Notice dropdown UX with high-contrast styled select elements.

## Release format

For each release use:

``` text
## [0.2.0] - YYYY-MM-DD

### Added
### Changed
### Deprecated
### Removed
### Fixed
### Security
```
