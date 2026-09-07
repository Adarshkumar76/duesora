# Duesora Documentation Directory

Welcome to the **Duesora** technical and operational documentation. All documentation is structured into specialized categories to help developers, self-hosters, and contributors quickly locate what they need.

---

## 📑 Documentation Index

### 1. 🏛️ Architecture & System Design
System foundations, database modeling, security boundaries, and async task execution.

- [Architecture Overview](architecture/ARCHITECTURE.md) — System layers, boundaries, and component interaction
- [Database Schema](architecture/DATABASE_SCHEMA.md) — Relational schema, Drizzle ORM models, indexes & enums
- [Security Architecture](architecture/SECURITY_ARCHITECTURE.md) — Multi-tenancy isolation, SSRF prevention, credentials encryption
- [API Design](architecture/API_DESIGN.md) — RESTful conventions, pagination, error formats, rate limiting
- [Repository Structure](architecture/REPOSITORY_STRUCTURE.md) — Source directory layout and architectural boundaries
- [Jobs & Queues](architecture/JOBS_AND_QUEUES.md) — Background workers, BullMQ queues, scheduled recurrence

---

### 2. 🎯 Product & Design
Product philosophy, core features, roadmap, and visual design assets.

- [Product Strategy](product/PRODUCT.md) — Mission, target audiences, core problems, and design promises
- [Features Spec](product/FEATURES.md) — Renewal tracking, ownership assignment, cost analytics
- [Roadmap](product/ROADMAP.md) — Development milestones from Phase 0 foundation to v1.0
- [Branding Guidelines](product/BRANDING.md) — Color palettes, typography, logos, tone of voice
- [UX & Accessibility](product/UX_ACCESSIBILITY.md) — WCAG standards, keyboard navigation, responsiveness
- [UI Mockups & Stories](assets/designs/README.md) — Complete 22-page desktop mockups and technical story matrix

---

### 3. 🛠️ Development & Engineering
Coding standards, testing methodologies, and git workflow.

- [Engineering Standards](development/ENGINEERING_STANDARDS.md) — Code style, validation rules, error handling
- [Branching & Contribution Workflow](development/BRANCHING_AND_CONTRIBUTION_WORKFLOW.md) — Git branches, PR guidelines, commit conventions
- [Testing Strategy](development/TESTING.md) — Vitest unit tests, integration test suites, mocks

---

### 4. ⚙️ Operations & Deployment
Self-hosting setups, containers, observability, and maintenance routines.

- [Deployment Guide](operations/DEPLOYMENT.md) — Production deployment guidelines and strategies
- [Docker Setup](operations/DOCKER.md) — Docker Compose services (App, PostgreSQL, Redis)
- [CI/CD Pipelines](operations/CI_CD.md) — GitHub Actions automated checks and tests
- [Monitoring](operations/MONITORING.md) — Health checks, domain monitoring, TLS expiration tracking
- [Observability](operations/OBSERVABILITY.md) — Structured logging, metrics, error tracing
- [Performance Guidelines](operations/PERFORMANCE.md) — Query optimization, caching strategies
- [Backup & Restore](operations/BACKUP_RESTORE.md) — Database backup strategies, point-in-time recovery
- [Notifications Engine](operations/NOTIFICATIONS.md) — In-app alerts, email notifications, digest schedules
- [Integrations Architecture](operations/INTEGRATIONS.md) — Third-party cloud, DNS, and billing providers
- [Webhooks Architecture](operations/WEBHOOKS.md) — Inbound event ingestion and outbound dispatch
- [Import & Export](operations/IMPORT_EXPORT.md) — CSV/JSON bulk import, data export guarantees
- [Release & Versioning](operations/RELEASE_VERSIONING.md) — SemVer release lifecycle, changelogs

---

### 5. 📜 Architecture Decision Records (ADRs)
Historic and active architectural decision documents.

- [ADR Guide](adr/README.md) — How to propose, review, and document ADRs
- [ADR 0001: Use PostgreSQL](adr/0001-use-postgresql.md) — Decision to use PostgreSQL as the primary database
- [ADR 0002: Security-First Monitor Workers](adr/0002-security-first-monitor-workers.md) — Outbound network isolation and SSRF defense

---

### 6. ⚖️ Legal, Privacy & Governance
Compliance, privacy standards, community governance, and self-hosted terms.

- [Privacy Principles](legal/PRIVACY.md) — Zero-telemetry by default and data ownership principles
- [Self-Hosted Terms](legal/TERMS_SELF_HOSTED.md) — Terms and operational responsibilities for self-hosters
- [Community Governance](community/GOVERNANCE.md) — Project leadership, decision-making, and contribution roles

---

### 7. 🔗 Essential Root Documents
Key community documents maintained directly at the project root:

- [README.md](../README.md) — Project homepage, quickstart, overview, and features
- [LICENSE](../LICENSE) — Apache 2.0 / MIT Open Source License
- [SECURITY.md](../SECURITY.md) — Vulnerability reporting policy and security disclosures
- [SUPPORT.md](../SUPPORT.md) — Community support channels and troubleshooting
- [TRADEMARK.md](../TRADEMARK.md) — Brand and trademark guidelines
- [CONTRIBUTING.md](../CONTRIBUTING.md) — How to contribute to Duesora
- [CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md) — Community code of conduct
