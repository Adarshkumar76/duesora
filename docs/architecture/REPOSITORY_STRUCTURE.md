# Repository Structure

Duesora structure:

``` text
duesora/
├── src/                     # Next.js App Router, components, db & libraries
├── public/                  # Static assets & brand icons
├── drizzle/                 # Database migrations & schemas
├── docs/
│   ├── adr/
│   ├── assets/              # Design mockups, UI specs & assets
│   └── ...
├── .github/
│   └── workflows/
├── .env.example
├── .env.local               # Local development environment (git-ignored)
├── docker-compose.yml
├── drizzle.config.ts
├── next.config.ts
├── package.json
├── package-lock.json
├── tsconfig.json
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
