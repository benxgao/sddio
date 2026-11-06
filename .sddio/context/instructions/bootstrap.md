# Bootstrap

Bootstrap automatically establishes the minimum `SPEC` for an existing project.

## Process

1. Inspect the minimum repository context needed to understand the system.
2. Extract only requirements supported by code, configuration, tests, or documentation.
3. Record only high-value, durable requirements.
4. Leave unsupported requirements undocumented.
5. Do not ask the user for information already derivable from the repository.
6. Do not infer requirements from assumptions, conventions, TODOs, comments, or future plans.
7. Use the generated `SPEC` for future requirement-related work.
8. Record at least one `DISCUSSION` for what the repository cannot settle.
9. Write the route table described below.

## Route Table

Bootstrap writes `sddio_workspace/README.md`, the index that makes its own output findable.

- One row per area that has entries — not one row per entry.
- A row names the area, the `SPEC` range it holds, the `ADR` that governs it, and one sentence of scope.
- Rows only for entries that exist; a placeholder row teaches nothing.
- Regenerate the table when an entry is added or an area appears.

## Honest First Screen

Bootstrap writes a `SPEC` of claims, so it also writes the doubt that qualifies them.

- Always record at least one `DISCUSSION` entry; a bootstrapped workspace with none reads as complete.
- Record the single most material gap — the one whose answer would change future work.
- Prefer: intent behind the code, unverified external dependencies, competing interpretations of the same module.
- Add a second entry only when it changes a different decision; this is a floor, not a quota.
- The entry satisfies `instructions/discussion.md`; code records structure, not intent, so a real gap always exists.
- Never record a decorative question to satisfy this rule.

## Limits

- Do not comprehensively document the repository.
- Do not record implementation details without lasting value.
- Do not repeatedly scan information already captured in `SPEC`.
- Bootstrap requires no user action.
