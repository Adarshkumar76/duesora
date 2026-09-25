# Changelog

All notable changes to Duesora should be documented here.

The project should use Semantic Versioning after releases become public.

## [1.0.0] - 2026-09-25

### Added

- **Living Interactive Simulation Hero**: High-fidelity product simulation in hero section featuring timed story scrubbers, play/pause controls, live ICANN radar sweep, SaaS waste optimizer, Slack alert preview, and integer spend telemetry.
- **Multilingual Animated Headline**: Dynamic rotation of value propositions in the hero section with slide-up transitions, fully translated across English, German, Spanish, French, and Japanese.
- **Live Radar Sweep in Domains Table**: Real-time ICANN/TLS automated radar sweep animation and visual probing state in `/domains`.
- **1-Click Autonomous Seat Trimming**: Instant optimization action directly within resource seats card to eliminate idle seat waste.
- **Animated Blast Radius Graph Flow**: Dynamic traveling amber particle simulation along cubic bezier curves in `/dependencies` visual dependency graph.

### Changed

- **Native Duesora Identity & Harmonization**: Fully unified all UI components, badges, and documentation under authentic Duesora branding.
- **Modernized Technology Stack**: Formalized support for Next.js 16 and React 19 across the core runtime and landing preview.

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
- **Plugin Architecture & SDK**: Extensible modular plugin runtime (`src/lib/plugins/`) with provider and notification adapters, reference plugins for Cloudflare and ntfy.sh, and `duesora plugins` inspection CLI.
- **Public API v1 & Interactive OpenAPI Docs**: Bearer token authenticated REST API (`/api/v1/resources`, `/api/v1/renewals`), OpenAPI 3.1 specification (`/api/openapi.json`), and interactive documentation explorer (`/api/docs`).
- **Document & Invoice Metadata Extraction Engine**: Rule-based currency, date, vendor, and amount minor parsing from invoices and contracts with user confirmation modal.
- **Outgoing Webhook Event Dispatcher & Delivery Inspector**: Extended workspace webhook events (`renewal.approaching`, `decision.updated`, `budget.exceeded`, `seats.waste_detected`) with signature verification and in-app delivery history.
- **Automated Security & Configuration Auditor CLI**: `duesora audit` command and `/api/health/security` diagnostic probe inspecting session secrets, SSL enforcement, rate limiting, and database access.
- **Advanced Multi-Filter & Custom Saved Views**: Quick filter presets for subscriptions (`All Active`, `Expiring < 30d`, `High Spend`, `Overdue`, `Auto-Renew Active`).
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
