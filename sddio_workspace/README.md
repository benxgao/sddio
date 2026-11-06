# sddio workspace

The route table for this repository. Start here when the area is unknown.

## Areas

| Area                      | SPEC                   | ADR                  | What it covers                                           |
| ------------------------- | ---------------------- | -------------------- | -------------------------------------------------------- |
| Packaging                 | `SPEC-001`–`SPEC-004`  | `ADR-001`, `ADR-003` | `init` output, seed files, overwrite policy, `AGENTS.md` |
| Entries and identity      | `SPEC-008`, `SPEC-016` | `ADR-004`            | ID scheme, append-only collections, bootstrap's gap      |
| Rules and instructions    | `SPEC-006`, `SPEC-017` | `ADR-005`, `ADR-009` | Package-owned context, a claim carries its own check     |
| Cursor and reconciliation | `SPEC-007`, `SPEC-010` | `ADR-006`            | Git policy, two-commit cursor, reconciliation range      |
| Skill and prompt          | `SPEC-011`, `SPEC-013` | `ADR-008`            | `init`'s closing step, the skill as a router             |
| Release and distribution  | `SPEC-005`, `SPEC-009` | `ADR-002`, `ADR-003` | The npm tarball, invocation modes, placeholders          |
| Docs                      | —                      | —                    | `docs/`; no entry governs them yet                       |

## Collections

- `spec/` — requirements; one file per 100 entries
- `adr/` — decisions, including the alternatives that lost
- `discussions/` — open questions; a resolved one is deleted, and its ID is burned
- `flow/active/` — rollouts in progress; `flow/completed/` — finished ones

## Reading it

- Changing behaviour: read the SPEC range for the area, then the ADR that constrains it.
- Asking why: start from the ADR. A SPEC says what, never why.
- Finding a contradiction: reconcile the stale side. Do not write the fact twice.
