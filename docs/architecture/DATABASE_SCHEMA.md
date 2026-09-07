# Database Schema

PostgreSQL is recommended because Duesora has strongly related entities,
ownership, history, and audit requirements.

## ID strategy

Use opaque UUID/ULID-style identifiers. Never rely on sequential IDs as
an authorization mechanism.

## Core tables

### users

``` text
id
email
email_verified_at
name
password_hash nullable
status
created_at
updated_at
```

### workspaces

``` text
id
name
slug
type: personal | organization
default_currency
timezone
created_at
updated_at
```

### memberships

``` text
id
workspace_id FK
user_id FK
role: owner | admin | member | viewer
created_at
updated_at

UNIQUE(workspace_id, user_id)
```

### teams

``` text
id
workspace_id FK
name
created_at
updated_at
```

### team_members

``` text
team_id FK
user_id FK
UNIQUE(team_id, user_id)
```

### resources

``` text
id
workspace_id FK
type
name
description nullable
provider nullable
external_url nullable
environment nullable
criticality: low | normal | high | critical
status: active | under_review | planned_cancel | cancelled | expired | archived
metadata JSONB
created_by FK users
created_at
updated_at
archived_at nullable
```

Every resource query must be scoped by `workspace_id`.

### resource_owners

``` text
id
resource_id FK
user_id nullable FK
team_id nullable FK
is_primary boolean
created_at
```

Require exactly one owner target per row.

### tags

``` text
id
workspace_id FK
name
color_token nullable
UNIQUE(workspace_id, name)
```

### resource_tags

``` text
resource_id FK
tag_id FK
UNIQUE(resource_id, tag_id)
```

### renewals

``` text
id
resource_id FK
kind: billing | expiry | contract | notice | warranty | custom
next_at
timezone
recurrence_rule nullable
auto_renew nullable
notice_days nullable
status
created_at
updated_at
```

### cost_entries

Append history instead of overwriting:

``` text
id
resource_id FK
amount_minor BIGINT
currency CHAR(3)
billing_interval
effective_from
effective_to nullable
source: manual | import | integration
created_at
```

Use integer minor units; do not use floating point for money.

### reminder_policies

``` text
id
workspace_id FK
resource_id nullable FK
name
enabled
created_at
updated_at
```

### reminder_offsets

``` text
id
policy_id FK
offset_minutes
channel
escalation_level
```

### notifications

``` text
id
workspace_id FK
resource_id nullable FK
user_id nullable FK
type
channel
status: pending | sent | failed | acknowledged
scheduled_for
sent_at nullable
acknowledged_at nullable
dedupe_key UNIQUE
payload JSONB
created_at
```

### monitors

``` text
id
resource_id FK
type: tls | domain | custom
enabled
target
schedule
configuration JSONB
last_checked_at nullable
next_check_at nullable
created_at
updated_at
```

### monitor_observations

Append-only history:

``` text
id
monitor_id FK
status
observed_at
expires_at nullable
fingerprint nullable
data JSONB
error_code nullable
duration_ms nullable
```

### integrations

``` text
id
workspace_id FK
type
name
encrypted_credentials nullable
configuration JSONB
status
created_at
updated_at
```

### webhook_endpoints

``` text
id
workspace_id FK
url
encrypted_secret
enabled
event_types
created_at
updated_at
```

### attachments

``` text
id
workspace_id FK
resource_id nullable FK
storage_key
original_name
content_type
size_bytes
checksum
uploaded_by
created_at
```

### audit_events

Prefer append-only:

``` text
id
workspace_id FK
actor_user_id nullable
action
entity_type
entity_id
request_id nullable
ip_hash nullable
user_agent_summary nullable
metadata JSONB
created_at
```

## Indexes

At minimum:

-   resources `(workspace_id, status)`
-   resources `(workspace_id, type)`
-   renewals `(next_at, status)`
-   memberships `(user_id, workspace_id)`
-   notifications `(status, scheduled_for)`
-   monitors `(enabled, next_check_at)`
-   audit_events `(workspace_id, created_at DESC)`

## Deletion

Prefer archive/soft-delete for operational resources. Account/workspace
deletion must have an explicit retention and cascade strategy. Never
silently orphan secrets or attachments.
