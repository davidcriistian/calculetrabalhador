# Controlled ingestion runbook

Each legal domain is ingested as a self-contained batch. The batch is the only accepted unit of change.

## Folder boundaries

- `registries/`: canonical state only.
- `ingestion/batches/`: pending or reviewed change sets.
- `schemas/`: machine-enforced contracts.
- `engines/`: deterministic behavior.
- `governance/`: approval and identity policies.
- `state/`: readiness and operational state.
- `audit/`: generated evidence, never legal knowledge.
- `migration/`: legacy mapping, never canonical authority.

A failed batch must leave canonical registries unchanged.
