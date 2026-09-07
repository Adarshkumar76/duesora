# Security Policy

Security is a release requirement for Duesora.

## Reporting a vulnerability

Do **not** disclose exploitable vulnerabilities in a public issue.

Use GitHub's private vulnerability reporting/security advisory feature
when enabled. If the repository later publishes a dedicated security
email, add it here.

Include:

-   affected version/commit;
-   vulnerability type;
-   reproduction steps;
-   impact;
-   proof of concept if safe;
-   suggested mitigation if known.

## Supported versions

Before v1.0, security fixes normally target the latest release. After
v1.0, maintainers should publish an explicit support matrix.

## Security priorities

Duesora must defend against:

-   broken authorization and cross-workspace access;
-   IDOR;
-   SSRF from domain/TLS/URL monitoring;
-   XSS and unsafe HTML rendering;
-   CSRF where cookie-based authenticated writes are used;
-   SQL injection;
-   malicious file uploads;
-   webhook forgery/replay;
-   brute-force and credential attacks;
-   leaked secrets/tokens;
-   unsafe redirects;
-   dependency/supply-chain compromise.

## Secrets

Never commit secrets. Never log plaintext secrets. Integration tokens
should be encrypted at rest and scoped to minimum privileges.

## Monitoring-specific warning

Duesora accepts domains/hosts/URLs for monitoring. This creates SSRF
risk. Workers must reject prohibited destinations, including loopback,
link-local, private/internal ranges, metadata endpoints, and unsafe
redirect chains unless an explicitly designed trusted-network mode
exists.

See `docs/architecture/SECURITY_ARCHITECTURE.md`.
