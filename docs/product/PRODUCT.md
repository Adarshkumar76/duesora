# Product Specification

## Vision

Duesora is an open operational inventory for things that renew, expire,
cost money, or require an accountable owner.

## Four pillars

### Inventory

What resources exist?

### Ownership

Who is responsible for each resource?

### Cost

What is the recurring or renewal financial commitment?

### Expiry

When does the resource renew, expire, require notice, or require action?

## Resource types

Domains, TLS certificates, SaaS, cloud, hosting, APIs, licenses,
contracts, warranties, documents, and custom resources.

## Primary users

-   individual developers;
-   startups;
-   agencies;
-   DevOps/IT teams;
-   operations teams;
-   small businesses.

## Core workflows

### Add a resource

``` text
Create resource
 -> classify
 -> assign workspace
 -> assign owner
 -> add cost
 -> add expiry/renewal
 -> configure reminders
 -> optional automated monitor
```

### Renewal lifecycle

``` text
Upcoming
 -> Needs review
 -> Approved to renew / Cancel / Negotiate
 -> Renewed / Cancelled / Intentionally expired
```

### Automated monitoring

``` text
Scheduler
 -> queue job
 -> validate destination
 -> perform safe check
 -> store observation
 -> compare state
 -> create event
 -> notification rules
```

## Dashboard

Show:

-   monthly and annual recurring commitment;
-   upcoming 7/30/60/90-day renewals;
-   expired items;
-   unowned critical resources;
-   cost by category/team/client;
-   monitoring failures;
-   recent changes;
-   quick add/import/scan actions.

## UX requirements

-   responsive;
-   keyboard accessible;
-   clear empty states;
-   bulk actions;
-   saved filters;
-   global search;
-   timezone-aware dates;
-   understandable status language;
-   no destructive action without confirmation where data loss is
    possible.

## Product rule

A feature should strengthen at least one pillar: inventory, ownership,
cost, or expiry.
