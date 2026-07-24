# Sprint 5.6.5 — Inference Integrity & Transitive Traceability

## Objective
Correct inference-path defects identified after Sprint 5.6.4 while preserving deterministic, non-authoritative execution.

## Implemented corrections

- `PROJ-AP-004` now applies only when `FACT-EMPLOYER-OWES-NOTICE = true`.
- `PROJ-AP-005` now applies only to employer-owed notice and no longer integrates service time for employee resignation.
- `factPackage.referenceDate` and `FACT-LEGAL-REFERENCE-DATE` must be identical when both are supplied.
- `FACT-COMPLETE-SERVICE-YEARS` is derived or reconciled against admission and legal-reference dates.
- `PROJ-AP-008` emits explicit `complete`, `partial`, or `blocked` consolidation state.
- Unresolved projections and their missing facts are exposed to consumers.
- Consolidated output trace now propagates actual facts, selected rules, and resolved dependencies.
- Equivalent effects are deduplicated while preserving all source projection IDs.
- Conflicting duplicate effects fail deterministically instead of silently choosing a value.

## Runtime changes

Projection Runtime version: `1.4.0`.

New authorized operations:

- `consolidation-status`
- `unresolved-projections`

`aggregate-effects` now performs semantic deduplication and conflict detection.

## Verification

- Structural tests: 92 passed.
- Projection Runtime tests: 46 passed.
- Main validator: 0 errors after manifest regeneration.
- Runtime authority remains `false`.
- Consumer readiness remains `false`.
