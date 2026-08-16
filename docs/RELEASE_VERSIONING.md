# Releases and Versioning

Use Semantic Versioning when public releases begin.

``` text
MAJOR.MINOR.PATCH
```

Before v1.0, breaking changes may occur more frequently, but they must
still be documented.

## Release checklist

-   all CI passes;
-   migrations reviewed;
-   upgrade tested from previous supported version;
-   changelog updated;
-   security review for security-sensitive changes;
-   Docker image built;
-   backup/restore implications documented;
-   environment variable changes documented;
-   API/webhook changes documented;
-   release notes published.

## Breaking changes

Never surprise self-hosters. Provide:

-   what changed;
-   why;
-   migration steps;
-   rollback limitations;
-   config changes;
-   data compatibility impact.
