# Instructions

## Startup

1. Read `principles.md`
2. Read `preferences.md`
3. Read `roadmap.md`
4. Read `routes/routes.md`
5. Identify the user's intent
6. Load only the context required for that intent
7. If no usable `SPEC` exists, run Bootstrap

## Bootstrap

Bootstrap is automatic and requires no user action.

When the project has no usable `SPEC`:

1. Inspect only the minimum repository context needed to understand the existing system.
2. Extract only requirements clearly supported by code, configuration, tests, or documentation.
3. Record high-value confirmed requirements in `SPEC`.
4. Do not ask the user for information that can be derived from the repository.
5. Do not create requirements from assumptions, conventions, TODOs, comments, or future plans.
6. Prefer a small number of high-value requirements over comprehensive documentation.
7. Do not record implementation details unless they represent a lasting requirement or constraint.
8. If evidence is insufficient, leave the requirement undocumented.
9. Use the generated `SPEC` as the primary context for future requirement-related work.
10. Do not rescan information already captured in `SPEC` unless relevant artifacts have changed.

## Intent

* New requirement → `SPEC`
* Change to an existing requirement → `SPEC`
* Architectural decision → `ADR`
* Unresolved question or ambiguity → `DISCUSSION`
* Implementation work → `FLOW`
* Completed implementation → `FLOW/completed`

## Before Work

1. Locate the relevant `SPEC`
2. Check related `ADR`
3. Check unresolved `DISCUSSION`
4. Check relevant active `FLOW`
5. Do not invent missing requirements
6. Load only the smallest sufficient context

## During Work

* Follow `principles.md`
* Respect `preferences.md`
* Consider `roadmap.md` without treating it as a requirement
* Keep durable project knowledge synchronized
* Record significant information when it becomes known
* Do not record transient information merely because it was observed
* Prefer updating an existing artifact over creating a duplicate

## Knowledge Rules

Record information only when it is likely to affect future work.

Create or update an artifact when you:

* discover a confirmed requirement not represented in `SPEC` → `SPEC`
* discover an existing requirement has changed → `SPEC`
* make or confirm an important architectural decision → `ADR`
* encounter an unresolved question that affects future work → `DISCUSSION`
* discover an important constraint or trade-off → `ADR` or `DISCUSSION`
* find durable documentation inconsistent with implementation → reconcile the affected artifact

Do not create artifacts merely because:

* an implementation detail was observed
* a temporary problem was encountered
* a plan exists
* documentation would be more complete
* an artifact could theoretically be useful

## Artifact Semantics

* `SPEC` = what the system must do
* `ADR` = why an important technical decision was made
* `DISCUSSION` = what is currently unresolved
* `FLOW` = what work is being done

Keep these roles distinct.

### SPEC

`SPEC` contains confirmed, durable system requirements.

Do not treat `SPEC` as a complete description of the implementation.

The repository is the source of truth for actual implementation behavior.

When `SPEC` and implementation disagree:

1. Determine whether the requirement or implementation is stale.
2. Reconcile the affected artifact.
3. Do not silently assume either side is correct.

### ADR

Create an `ADR` only for decisions with lasting architectural or technical consequences.

Do not create an `ADR` for ordinary implementation choices.

### DISCUSSION

Use `DISCUSSION` when:

* required information is missing
* multiple valid interpretations exist
* user clarification is required
* implementation depends on an unresolved decision
* a potential requirement needs confirmation

Do not block implementation when uncertainty is non-critical and a safe, reversible assumption is possible.

When a discussion is resolved:

1. Record the durable outcome in `SPEC` or `ADR` when appropriate.
2. Resolve the `DISCUSSION`.
3. Do not duplicate the same information unnecessarily.

### FLOW

Use `FLOW` to track implementation work.

Keep `FLOW` focused on work state rather than permanent project knowledge.

When work is completed:

1. Validate the implementation.
2. Move the completed flow to `FLOW/completed`.
3. Reconcile affected `SPEC`, `ADR`, and `DISCUSSION` artifacts.

## Reconciliation

After meaningful implementation changes:

1. Check whether affected `SPEC` remains accurate.
2. Check whether an architectural decision needs to be recorded.
3. Check whether any unresolved `DISCUSSION` has been resolved.
4. Correct stale or inconsistent artifacts.
5. Do not rewrite unaffected artifacts.

Reconciliation should be minimal and automatic.

## Context Loading

* Prefer `routes.md` for navigation.
* Prefer existing artifacts over repository-wide scanning.
* Retrieve only the context required for the current task.
* Do not load unrelated artifacts.
* Do not rescan the repository when existing artifacts provide sufficient context.

## Schema

Schemas define the structure of artifact entries.

Before creating or modifying an `ADR`, `DISCUSSION`, or `SPEC` entry:

1. Locate the corresponding schema in `.schema/`.
2. Read the schema.
3. Follow its fields and structure.
4. Preserve its schema version.

Schema mapping:

* `ADR` → `.schema/adr.md`
* `DISCUSSION` → `.schema/discussions.md`
* `SPEC` → `.schema/spec.md`

Rules:

* Do not invent schema-defined fields.
* Do not rename or restructure schema-defined fields without a valid reason.
* Multiple entries may share a Markdown file when allowed.
* Do not duplicate schema definitions in `instructions.md`.

If the expected schema cannot be found:

1. Search `.schema/` for the closest matching schema.
2. Inspect existing entries for compatibility.
3. Do not invent a new schema unless explicitly required.

## Artifact Rules

* Create the smallest artifact necessary.
* Prefer updating an existing artifact over creating a duplicate.
* Do not create artifacts for completeness.
* Do not preserve stale information.
* Do not record implementation details without lasting value.
* Prefer the smallest structure that preserves future usefulness.

## Entry Files

Entries are stored in numbered Markdown files with a maximum of 100 entries per file.

Examples:

* `adr_100.md` → ADR 001–100
* `adr_200.md` → ADR 101–200
* `discussions_100.md` → DISC 001–100
* `discussions_200.md` → DISC 101–200

Apply the same rule to other numbered entry collections.

Rules:

1. Add entries to the current file while it has fewer than 100 entries.
2. Never exceed 100 entries in a file.
3. When a file reaches 100 entries, create the next numbered file before adding the next entry.
4. The next file number is the next multiple of 100.
5. Preserve existing IDs and ordering.
6. New files must use the same schema and structure as the previous file.
7. Do not move or split existing entries unless required by the file-capacity rule.
8. Create the next file automatically when needed.
