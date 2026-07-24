# Automation boundaries

Automations are consumers and workflow executors. They must never invent, overwrite, or silently approve legal knowledge.

## Required sequence

1. Create one ingestion batch.
2. Run schema and reference preflight.
3. Obtain legal review.
4. Obtain technical review.
5. Obtain explicit approval.
6. Generate and validate projections.
7. Stage a new immutable dataset snapshot.
8. Commit only after every blocking gate passes.
9. Append an audit event and run impact analysis.

## Forbidden actions

- Direct writes to canonical registries.
- Reusing IDs for different content.
- Replacing historical versions.
- Publishing a projection without provenance and fingerprints.
- Marking a domain consumer-ready without approved rules and published projections.
