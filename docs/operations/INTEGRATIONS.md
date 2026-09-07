# Integration Architecture

## Principles

-   core functionality cannot require a proprietary integration;
-   provider code lives behind adapters;
-   least-privilege credentials;
-   encrypted credentials;
-   explicit connect/disconnect;
-   clear sync status;
-   rate-limit handling;
-   retries must be safe.

## Interface categories

-   notification adapter;
-   monitor adapter;
-   import adapter;
-   identity adapter;
-   storage adapter.

## Credential lifecycle

``` text
connect
 -> validate
 -> encrypt/store
 -> use with least privilege
 -> rotate
 -> revoke/disconnect
 -> remove retained secret
```

Do not store third-party passwords.
