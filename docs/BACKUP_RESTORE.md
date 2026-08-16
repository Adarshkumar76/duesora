# Backup and Restore

Self-hosting is incomplete without recovery.

## Back up

At minimum:

1.  PostgreSQL database.
2.  Uploaded attachments/object storage.
3.  Deployment configuration excluding replaceable secrets where
    appropriate.
4.  Encryption key material through the operator's secure secret backup
    process.

## Consistency

Document whether database and attachment snapshots must be coordinated.
A restore should not silently create database references to missing
files.

## Restore test

A backup is not trusted until a restore has been tested.

Recommended release/operator practice:

-   scheduled backups;
-   retention policy;
-   encrypted backup storage;
-   off-host copy;
-   periodic restore drill;
-   documented recovery time expectations.

## Future CLI

Target commands:

``` text
duesora backup
duesora restore <archive>
duesora doctor
```
