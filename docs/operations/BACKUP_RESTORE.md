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

## Operator CLI
 
Duesora ships with a native, pure Node.js operator CLI requiring zero host-level `pg_dump` or `tar` binaries. It is accessible via `npm run duesora -- <command>` or `node ./bin/duesora.mjs <command>`.
 
### 1. duesora doctor
 
Audits runtime conditions, environment secrets, database connection, table counts, Redis connectivity, SMTP transport, and storage directory permissions:
 
```bash
npm run duesora -- doctor
```
 
### 2. duesora backup
 
Creates an atomic `.tar.gz` archive containing:
- `manifest.json` (version, table record counts, SHA-256 checksums, timestamp)
- `database.json` (full PostgreSQL table dump in relational dependency order)
- `attachments/` (all invoices, contracts, and uploaded documents)
 
```bash
# Default output to ./backups/duesora-backup-<timestamp>.tar.gz
npm run duesora -- backup
 
# Custom output file
npm run duesora -- backup --output /mnt/safe/duesora-backup-2026-09-25.tar.gz
```
 
### 3. duesora restore <archive>
 
Restores an existing backup archive:
- Validates tar archive integrity and checks SHA-256 hashes against `manifest.json`.
- Truncates and restores database records within a single atomic PostgreSQL transaction in topological foreign-key order.
- Extracts attachment files with path traversal security protections.
 
```bash
npm run duesora -- restore ./backups/duesora-backup-2026-09-25.tar.gz
 
# Skip interactive prompt in automation pipelines
npm run duesora -- restore ./backups/duesora-backup-2026-09-25.tar.gz --force
```
