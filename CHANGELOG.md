# Changelog

All notable changes to Duesora should be documented here.

The project should use Semantic Versioning after releases become public.

## [Unreleased]

### Added

- **Production Multi-Stage Dockerfile & Full-Stack Compose**: Minimal Alpine Linux build running as non-root user `nextjs:nodejs` with Next.js standalone server mode and internal HTTP healthcheck (`docs/operations/DOCKER.md`).
- **Visual Spend & 12-Month Renewal Cashflow Analytics**: Interactive SVG 12-month rolling renewal cashflow forecast bar chart (`CashflowChart`) and spend distribution progress donut (`CategoryDonut`) on `/reports`.
- **Resource Dependency Mapping & Blast Radius Warning**: Inter-resource DAG dependencies with cascade deletion, API endpoints, blast radius impact alerts, and prerequisite linker card (`ResourceDependenciesCard`) on `/resources/[id]`.
- **Developer Workspace API Keys**: Secure API keys (`due_live_...`) with SHA-256 hashing, scoped permissions (`read`, `write`, `admin`), one-time reveal modal, last used timestamp, revocation, and Bearer token validation on `/settings`.
- **Open Push Notification Adapters**: Zero-cost, self-hosted and privacy-respecting push integrations for **ntfy.sh** and **Gotify** with urgent priority mapping, rich markdown/actions, event triggers, and live testing.
- **Multi-Currency Normalization**: Centralized `formatCurrencyMinor` formatter supporting USD, EUR, GBP, INR, CAD, AUD, JPY, and SGD.

### Changed

- Updated `docker-compose.yml` to orchestrate Postgres, Redis, and the Next.js standalone container with automatic database health checks.
- Extended chat notifications dispatcher and validation schemas to seamlessly handle `ntfy` and `gotify` alongside Slack, Discord, Telegram, and Microsoft Teams.

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
