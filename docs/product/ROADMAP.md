# Roadmap

## v0.1 - Foundation (Completed)

- [x] auth (Credentials, GitHub, Google);
- [x] workspaces & multi-tenancy;
- [x] resource CRUD;
- [x] tags/categories;
- [x] ownership assignment;
- [x] renewal tracking & manual renewal actions;
- [x] recurring cost calculations;
- [x] unified dashboard;
- [x] in-app + SMTP reminders;
- [x] webhooks (HMAC SHA-256 signing);
- [x] CSV/JSON export/import;
- [x] multi-stage Dockerfile & Docker Compose.

## v0.2 - Monitoring (Completed)

- [x] TLS / SSL certificate monitor;
- [x] domain metadata monitor;
- [x] monitor status history & latency logs;
- [x] custom reminder policies (days before renewal array);
- [x] calendar / iCal export (`.ics`);
- [x] multi-currency rates & real-time sync;
- [x] worker & database health checks (`/api/health`).

## v0.3 - Teams (Completed)

- [x] tokenized workspace invitations;
- [x] RBAC (Owner, Admin, Member, Viewer);
- [x] team roster & member role management;
- [x] comprehensive audit logging;
- [x] bulk resource operations (tagging, ownership, deletion);
- [x] reminder escalation policies;
- [x] multi-channel notification adapters (Slack, Discord, Telegram, Teams, ntfy.sh, Gotify).

## v0.4 - Intelligence (Completed)

- [x] resource cost history & rate change tracking;
- [x] workspace budgets & spend thresholds;
- [x] price-change alerts & notifications;
- [x] document & invoice attachments;
- [x] resource dependency mapping & blast radius;
- [x] developer workspace API keys (`due_live_...`);
- [x] visual spend analytics & 12-month renewal cashflow forecasting.

## v1.0 - Stable self-hosted platform (In Progress)

- [x] stable workspace API & developer keys;
- [x] multi-stage Alpine Docker container;
- [x] automated backup / restore / migration CLI tooling (`duesora doctor`, `migrate`, `backup`, `restore`);
- [x] visual interactive dependency graph & blast radius explorer;
- [x] license & seat utilization optimizer (idle seat waste detection & downsize suggestions);
- [x] i18n localization (English, Spanish, German, French, Japanese);
- [x] production security hardening & sliding-window rate limiting;
- [x] scheduled executive renewal & cost digest engine;
- [x] contract cancellation & renegotiation assistant;
- [x] provider auto-discovery & sync engine (Cloudflare domain & DNS zones);
- [x] document & invoice metadata extraction engine with user confirmation;
- [x] outgoing webhook event dispatcher & delivery inspector;
- [x] automated security & configuration auditor CLI (`duesora audit`);
- [x] advanced multi-filter & saved views (urgency, spend, idle seats);
- [ ] AWS Route 53 Provider Auto-Discovery;
- [ ] plugin architecture.

Roadmap items are intentions, not promised dates.
