# Central Brain — Operations Manual

## Daily operation

1. Run structural integrity validation.
2. Run governance regression tests.
3. Review unresolved references and validator status.
4. Review audit summary for failures or blocked states.
5. Confirm publication gates remain closed.

## Before any governed change

1. Confirm the official source.
2. Create or update the canonical rule proposal.
3. Run impact analysis.
4. Collect required approvals.
5. Build a controlled execution plan.
6. Generate preview and evidence.
7. Run all validators.
8. Review rollback plan.
9. Publish only after explicit human approval.

## Required commands

- `node scripts/validate-structural-integrity.js`
- `node scripts/run-governance-regression-tests.js`
- `node scripts/validate-governance-test-report.js`
- `node scripts/generate-governance-audit-ledger.js`
- `node scripts/validate-governance-audit-ledger.js`
- `node scripts/run-end-to-end-governance-simulation.js`
- `node scripts/validate-end-to-end-governance-simulation.js`
- `node scripts/validate-final-readiness.js`

## Failure handling

Any failure closes the publication gate. The operator must correct the source metadata or proposal, regenerate projections and rerun validation. Never bypass a failing validator.
