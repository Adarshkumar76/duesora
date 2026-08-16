# Duesora

**Know what you own. Know what's due.**

Duesora is a free and open-source renewal, expiry, ownership, and
recurring-cost management platform for individuals, developers, teams,
agencies, startups, and small businesses.

## Product pillars

1.  **Inventory** - What do we own?
2.  **Ownership** - Who is responsible for it?
3.  **Cost** - What does it cost?
4.  **Expiry** - When does it renew or expire?

## What Duesora tracks

-   Domains
-   TLS/SSL certificates
-   SaaS subscriptions
-   Hosting and VPS resources
-   Cloud services
-   API plans and credits
-   Software licenses
-   Vendor contracts
-   Warranties
-   Business documents
-   Custom resources

## Core promise

Duesora should remain useful without paid dependencies. The self-hosted
application must not require a commercial Duesora subscription.

## Quick start target

``` bash
git clone <your-duesora-repository>
cd duesora
cp .env.example .env
docker compose up -d
```

Then open `http://localhost:3000`.

> The commands above describe the target developer experience. Keep them
> accurate as the implementation evolves.

## Documentation map

Start with:

-   `docs/PRODUCT.md`
-   `docs/ARCHITECTURE.md`
-   `docs/DATABASE_SCHEMA.md`
-   `docs/SECURITY_ARCHITECTURE.md`
-   `docs/AI_AGENT_INSTRUCTIONS.md`
-   `docs/ROADMAP.md`
-   `CONTRIBUTING.md`
-   `SECURITY.md`

## Open-source principles

-   Self-hosting is first-class.
-   No artificial user/resource limit in the community codebase.
-   No mandatory proprietary cloud dependency.
-   Data export must remain available.
-   Security-sensitive defaults should be safe.
-   Breaking changes require migration documentation.
-   Core features must remain understandable and maintainable.

## Status

Duesora is under active design/development. APIs, schemas, and
deployment instructions may change before v1.0.

## License

MIT. See `LICENSE`.
