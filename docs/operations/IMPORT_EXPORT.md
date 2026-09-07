# Import and Export

Data portability is a core open-source principle.

## Export

Support JSON and CSV for appropriate datasets.

Export should include enough stable identifiers and relationships to
reconstruct user-owned operational data without exposing encrypted
secret material.

## Import

Flow:

``` text
upload
 -> parse
 -> map columns
 -> validate
 -> preview
 -> duplicate detection
 -> user confirmation
 -> queued import
 -> result report
```

Never partially import silently. Report rejected rows.

## Security

Treat imported files as hostile input. Enforce size limits, parsing
limits, schema validation, and safe storage/cleanup.
