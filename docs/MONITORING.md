# Resource Monitoring

## TLS monitor

Input: hostname and optional port.

Output:

-   certificate fingerprint;
-   issuer;
-   subject/SAN summary;
-   valid-from;
-   valid-to;
-   observed time;
-   error/status.

All connections must pass centralized SSRF/network policy.

## Domain monitor

Prefer authoritative standardized sources such as RDAP where available.
Domain registration/expiry information is inconsistent across
registries, so:

-   mark values as detected vs user-entered;
-   store source and observation time;
-   do not promise expiry detection for every TLD;
-   handle rate limits;
-   do not scrape sites when a stable authorized mechanism exists.

## Monitor lifecycle

``` text
scheduled
 -> queued
 -> destination validated
 -> checked
 -> observation stored
 -> state compared
 -> event generated if meaningful
```

## Alert examples

-   TLS expires within threshold;
-   domain expiry moved/changed;
-   monitor repeatedly fails;
-   certificate fingerprint unexpectedly changes.

Avoid noisy alerts. Deduplicate and allow acknowledgement.
