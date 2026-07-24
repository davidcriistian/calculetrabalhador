# Central Brain — Rollback and Incident Manual

## Before execution

Capture fingerprints and snapshots of all affected files. Confirm the rollback plan before applying any patch.

## Rollback trigger

Rollback is required when:

- a validator fails after application;
- the public result differs from the approved preview;
- a legal source was interpreted incorrectly;
- an unintended file changed;
- SEO, URL or calculator behavior regresses.

## Incident sequence

1. Close publication.
2. Preserve evidence.
3. Restore the approved snapshot.
4. Validate restored fingerprints.
5. Run regression tests.
6. Record a new audit event.
7. Review root cause.
8. Approve corrective action separately.

Corrections must never erase the original audit event.
