# Repository Structure

Recommended monorepo:

``` text
duesora/
├── apps/
│   ├── web/                 # Next.js UI + HTTP API
│   └── worker/              # background workers
├── packages/
│   ├── core/                # domain rules/use cases
│   ├── database/            # schema, migrations, repositories
│   ├── ui/                  # shared components
│   ├── integrations/        # notification/monitor adapters
│   ├── validation/          # shared schemas
│   └── config/              # typed config
├── docs/
│   ├── adr/
│   └── ...
├── tests/
│   ├── integration/
│   └── fixtures/
├── docker/
├── scripts/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   └── workflows/
├── .env.example
├── docker-compose.yml
├── README.md
├── CONTRIBUTING.md
├── SECURITY.md
├── GOVERNANCE.md
├── SUPPORT.md
├── CHANGELOG.md
└── LICENSE
```

## Dependency direction

``` text
UI/API -> application/core -> repositories/interfaces
                              ^
                              |
                     infrastructure adapters
```

Business rules must not depend directly on UI components.

## Rules

-   Do not place business logic in React components.
-   Do not access the database from arbitrary UI modules.
-   Keep provider integrations behind interfaces/adapters.
-   Keep worker jobs thin; call shared application services.
-   Validate all external input at boundaries.
-   Avoid circular package dependencies.
