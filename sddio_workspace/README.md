# sddio workspace

The route table for this repository. Start here when the area is unknown.

## Areas

| Area                      | SPEC                              | ADR                             | What it covers                                              |
| ------------------------- | --------------------------------- | ------------------------------- | ----------------------------------------------------------- |
| Packaging                 | `SPEC-003`, `SPEC-004`, `SPEC-005` | `ADR-001`, `ADR-003`            | `init` output, overwrite policy, `AGENTS.md`, call modes    |
| Entry contract            | `SPEC-016`                        | `ADR-004`, `ADR-012`            | What earns an entry, bootstrap's floor                      |
| Rules and instructions    | `SPEC-006`, `SPEC-007`            | `ADR-005`, `ADR-009`, `ADR-012` | Package-owned context, evidence travels with the rule       |
| Cursor and reconciliation | `SPEC-010`                        | `ADR-006`                       | Two-commit cursor, failing loudly, reconciliation range     |
| Hooks and workflow        | `SPEC-018`                        | `ADR-011`                       | A hook triggers updates; work lives in flow-trail           |
| Skill and prompt          | `SPEC-013`                        | `ADR-008`                       | The skill as a router, printed and never installed          |
| Release and distribution  | `SPEC-009`                        | `ADR-002`, `ADR-010`            | Placeholder package, the npm tarball, npm as the only channel |
| Docs                      | —                                 | —                               | `docs/`; no entry governs them yet                          |

## Collections

- `spec/` — requirements; one file per 100 entries
- `adr/` — decisions, including the alternatives that lost
- `discussions/` — open questions; a resolved one is deleted, and its ID is burned

Work in progress is not stored here — see `ADR-011`.

## Reading it

- Changing behaviour: read the SPEC range for the area, then the ADR that constrains it.
- Asking why: start from the ADR. A SPEC says what, never why.
- Finding a contradiction: reconcile the stale side. Do not write the fact twice.
