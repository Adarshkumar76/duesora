# Security Architecture

Security is a design constraint, not a cleanup phase.

## Threat model

Protect:

-   account identity;
-   workspace boundaries;
-   renewal/cost/business metadata;
-   integration credentials;
-   attachments;
-   notification endpoints;
-   monitoring infrastructure.

Assume attackers may:

-   create malicious resource URLs;
-   guess resource IDs;
-   compromise a normal member account;
-   send forged webhooks;
-   upload malicious files;
-   abuse invitation/reset flows;
-   attempt to extract secrets through logs/errors;
-   exploit dependency or CI/CD weaknesses.

## Authorization

-   Deny by default.
-   Validate permissions on every request.
-   Scope every resource by workspace.
-   Do not trust IDs supplied by the client.
-   Never authorize only in the frontend.
-   Test cross-tenant access explicitly.
-   Prefer policy functions/services that are reused by API and jobs.

## SSRF controls

Monitoring is the highest-risk subsystem.

For untrusted targets:

1.  Parse using a strict URL/host parser.
2.  Permit only intended schemes/protocols.
3.  Resolve DNS before connection.
4.  Reject loopback, private, link-local, multicast, reserved, and
    metadata ranges.
5.  Re-check resolved addresses after redirects.
6.  Limit redirect count.
7.  Set connection/read timeouts.
8.  Limit response size.
9.  Do not forward user cookies/credentials.
10. Consider isolated worker networking/egress policy.
11. Log blocked attempts without exposing secrets.

IPv4 and IPv6 must both be handled.

## Authentication

-   Secure, HttpOnly, SameSite cookies for browser sessions.
-   Rotate/invalidate sessions on sensitive account changes.
-   Rate-limit login/reset endpoints.
-   Use strong password hashing if passwords are supported.
-   Verify email changes.
-   Add 2FA later.
-   Use OIDC/OAuth with minimal scopes when added.

## Secrets

-   `.env` files never committed.
-   Production secrets come from deployment secret storage.
-   Integration credentials encrypted at rest.
-   Separate encryption key from database.
-   Never print secrets in logs/errors.
-   Support rotation and revocation.
-   CI secrets must not be exposed to untrusted fork jobs.

## Webhooks

Outgoing:

-   sign payloads;
-   include timestamp/event ID;
-   document verification;
-   retry with backoff;
-   do not leak internal secrets.

Incoming:

-   verify provider signature before parsing trusted semantics;
-   prevent replay;
-   use idempotency keys;
-   rate-limit;
-   log verification failures.

## Uploads

-   allowlist file types where possible;
-   enforce size limits;
-   generate server-side storage names;
-   never execute uploaded content;
-   serve risky content as attachment or from isolated origin;
-   scan when appropriate;
-   verify authorization on download.

## Web security

-   validate all input;
-   parameterized database access;
-   output encoding;
-   CSP where practical;
-   CSRF protection for cookie-authenticated state changes;
-   secure headers;
-   safe redirect allowlists;
-   rate limits;
-   request size limits.

## Audit

Audit sensitive events:

-   role/member changes;
-   integration creation/rotation;
-   resource deletion;
-   export;
-   login/security changes;
-   webhook changes;
-   API key lifecycle.

Audit records must not contain raw secrets.

## Security release gate

A feature cannot ship if:

-   authorization paths are untested;
-   secrets can appear in logs;
-   migrations risk silent data loss;
-   untrusted network targets bypass SSRF policy;
-   critical dependency vulnerabilities are ignored without documented
    risk acceptance.
