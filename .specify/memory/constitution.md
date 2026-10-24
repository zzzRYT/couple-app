# Couple App Constitution

## Core Principles

### I. User Safety and Privacy
Features MUST collect and expose only data needed for their stated purpose. Sensitive processing MUST be disclosed and protected by an explicit, revocable user choice where required.

### II. Deterministic Boundaries
Untrusted input MUST be validated at system boundaries. User or model supplied data MUST NOT be treated as executable code or authority to change application behavior.

### III. Accessible and Understandable Experience
User-facing functionality MUST preserve accessibility, legibility, and clear recovery paths. Important state changes MUST be visible and understandable to affected users.

### IV. Verifiable Changes
Changes to shared data, security boundaries, or public contracts MUST have documented validation evidence. Automated checks MUST cover critical invariants and failure cases.

### V. Small, Reversible Design
The simplest design that meets documented requirements MUST be preferred. Changes to persisted data MUST support safe migration, recovery, or an explicit deletion policy.

## Additional Constraints

Project plans MUST distinguish confirmed requirements from proposals. Proposals MUST include alternatives and decision owners. Secrets MUST remain outside source control, application bundles, and logs.

## Development Workflow

Work MUST follow the repository's current specifications and project guidance. Before delivery, contributors MUST review changes for privacy, accessibility, security, and compatibility with documented contracts. Validation claims MUST identify the checks actually performed.

## Governance

This constitution governs project plans and implementation decisions. Any change to these principles requires a documented rationale and review by the project owner. Versioning follows semantic versioning: MAJOR for incompatible governance changes, MINOR for new or materially expanded principles, and PATCH for clarifications. Each change MUST update the version and amendment date. Feature plans MUST record a constitution check before and after design; a justified exception MUST identify the principle, reason, and mitigation. Reviews MUST verify compliance with applicable principles and constraints.

**Version**: 1.0.0 | **Ratified**: 2026-10-24 | **Last Amended**: 2026-10-24
