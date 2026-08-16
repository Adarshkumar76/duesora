# CI/CD

## Pull request pipeline

-   dependency install with lockfile;
-   formatting/lint;
-   TypeScript type-check;
-   unit tests;
-   integration tests;
-   production build;
-   security/dependency checks;
-   migration validation.

## Release pipeline

-   create version tag;
-   build immutable artifacts/images;
-   generate release notes;
-   publish checksums where useful;
-   publish migration/upgrade notes;
-   never release from an unreviewed local working tree.

## Secret safety

Forked/untrusted PRs must not receive production secrets. CI output must
not print credentials. Use least-privilege tokens and short-lived
credentials where supported.
