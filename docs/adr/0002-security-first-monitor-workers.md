# ADR 0002: Isolate and Centralize Safe Network Access for Monitor Workers

## Status

Accepted for initial architecture.

## Context

Duesora monitors user-supplied domains and endpoints. Unrestricted
outbound requests can create SSRF and internal-network probing risk.

## Decision

All user-controlled outbound monitor connections must pass a centralized
destination validation policy. Monitor work should run in background
workers, with network restrictions where deployment infrastructure
permits.

## Consequences

-   safer architecture;
-   one place to test SSRF controls;
-   additional complexity for DNS/IP validation and redirects;
-   provider-specific monitoring must reuse the same safety layer.
