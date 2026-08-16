# API Design

## Base

Future public API:

``` text
/api/v1
```

Internal application routes may differ, but domain behavior should be
reusable.

## Example resources

``` text
GET    /api/v1/resources
POST   /api/v1/resources
GET    /api/v1/resources/{id}
PATCH  /api/v1/resources/{id}
DELETE /api/v1/resources/{id}

GET    /api/v1/renewals
POST   /api/v1/resources/{id}/renewals

GET    /api/v1/notifications
POST   /api/v1/notifications/{id}/acknowledge
```

## Rules

-   Authenticate every non-public endpoint.
-   Workspace context must be explicit and verified.
-   Validate request and response schemas.
-   Use cursor pagination for large collections.
-   Return stable machine-readable error codes.
-   Support idempotency keys for retryable write operations where
    duplicate execution is dangerous.
-   Do not expose internal database errors.

## Error shape

``` json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Resource not found",
    "requestId": "req_..."
  }
}
```

## Public verification pages

If Duesora later has public/shared pages, expose only deliberately
public fields through a separate projection. Never serialize the
internal resource record directly.
