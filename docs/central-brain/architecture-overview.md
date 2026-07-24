# Central Brain — Architecture Overview

## Purpose

The Central Brain is a governance layer that connects legal rules, calculators, articles, clusters, nuclei, review workflows, evidence, approvals, tests and audit records.

It does not replace the public application. It governs changes before they reach the public application.

## Core layers

1. **Canonical legal rules** — minimum rule contract, sources, versions, validity and fingerprints.
2. **Dependency authority** — typed relations between rules, calculators and editorial consumers.
3. **Editorial impact** — aggregation across articles, clusters, nuclei and pillar pages.
4. **Impact analysis** — read-only determination of affected assets and review scope.
5. **Controlled execution planning** — approved plans, preconditions, operations and rollback.
6. **Preview and evidence** — proposal manifests, validator evidence and publication gate.
7. **Reference normalization** — canonical paths, unresolved references and validator resolution.
8. **Structural integrity** — schemas, vocabularies and cross-file consistency.
9. **Regression tests** — positive, negative, deterministic and mutation-guard scenarios.
10. **Observability and audit** — correlated events, fingerprints and append-only projections.
11. **End-to-end simulation** — approved, blocked, validator-failure and rollback scenarios.
12. **Finalization and operations** — documentation, responsibilities, readiness and known limits.

## Operating principle

The system follows:

`detect → analyze → plan → approve → preview → validate → publish manually → audit`

Publication is closed by default. No automatic mutation is permitted.

## Source-of-truth policy

Manual authority files are kept separate from generated projections. Generated artifacts are read-only and must never silently overwrite legacy catalogs or public files.

## Safety boundaries

The Central Brain does not guarantee legal correctness by itself. Official-source verification and human legal review remain mandatory.
