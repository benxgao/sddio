# Instructions

## Startup

1. Read `principles.md`
2. Read `preferences.md`
3. Read `roadmap.md`
4. Read `../routes/routes.md`
5. Identify the user's intent
6. Load only the relevant project context

## Intent

- New requirement → `SPEC`
- Change to existing requirement → `SPEC`
- Architectural decision → `ADR`
- Unclear requirement or unresolved question → `DISCUSSION`
- Implementation work → `FLOW`
- Completed implementation → `FLOW/completed`

## Before Work

1. Locate the relevant `SPEC`
2. Check related `ADR`
3. Check unresolved `DISCUSSION`
4. Check active `FLOW`
5. Do not invent missing requirements

## Before Rollout

When planning implementation:

- Check whether the plan introduces a new requirement → record `SPEC`
- Check whether the plan changes an existing requirement → update `SPEC`
- Check whether the plan requires an architectural decision → record `ADR`
- Check whether an important question cannot be resolved from existing artifacts → record `DISCUSSION`
- Do not create artifacts merely to document the plan

## During Work

- Follow `principles.md`
- Respect `preferences.md`
- Mind `roadmap.md`
- Keep project artifacts synchronized
- Record information when it becomes significant, not only after implementation

### Record When Needed

Create or update an artifact when you:

- discover a requirement that is not documented → `SPEC`
- discover that an existing requirement has changed → `SPEC`
- make or confirm an architectural decision → `ADR`
- encounter an unresolved question or ambiguity → `DISCUSSION`
- discover an important constraint or trade-off → `ADR` or `DISCUSSION`
- find existing documentation inconsistent with the implementation → update the affected artifact
- discover information that will affect future work → record it in the appropriate artifact

### Ask Through DISCUSSION

Use `DISCUSSION` when:

- required information is missing
- multiple valid interpretations exist
- user clarification is required
- implementation depends on an unresolved decision
- a potential requirement needs confirmation

Do not block implementation when the uncertainty is non-critical and a safe, reversible assumption is possible.

## After Work

1. Validate implementation
2. Update `FLOW`
3. Update affected `SPEC` when required
4. Record architectural decisions in `ADR`
5. Resolve or preserve relevant `DISCUSSION`
6. Remove or correct stale artifacts when discovered

## Context Loading

- Do not load unrelated artifacts
- Prefer `routes.md` for navigation
- Prefer targeted retrieval over repository-wide reading
- Read the smallest sufficient context

## Schema

Schemas define the structure of artifact entries.

- Before creating or modifying an `ADR`, `DISCUSSION`, or `SPEC` entry, locate and read its schema in `.schema/`.
- Use the corresponding schema as the source of truth for entry structure and fields.
- Do not invent, omit, rename, or restructure schema-defined fields without a valid reason.
- If a schema exists, follow it even when existing entries use an older or inconsistent structure.
- Preserve the schema version specified by the schema.
- Multiple entries may exist in the same Markdown file when allowed by the schema.
- Do not duplicate schema definitions in `instructions.md`.

### Schema Mapping

- `ADR` → `.schema/adr.md`
- `DISCUSSION` → `.schema/discussions.md`
- `SPEC` → `.schema/spec.md`

If the expected schema cannot be found:

1. Search `.schema/` for the closest matching schema.
2. Inspect existing entries for compatibility.
3. Do not invent a new schema unless explicitly required.

## Artifact Rules

- Create the smallest artifact necessary

- Prefer updating an existing artifact over creating a duplicate

- Do not create artifacts merely for completeness

- Do not record implementation details unless they have lasting value

- Keep `SPEC`, `ADR`, and `DISCUSSION` distinct:
  - `SPEC` = what the system must do
  - `ADR` = why an important technical decision was made
  - `DISCUSSION` = what is still unclear or unresolved
  - `FLOW` = what work is being done

- When a `DISCUSSION` is resolved, update the affected `SPEC` or `ADR` and resolve the `DISCUSSION`

- Do not use `ADR` or `DISCUSSION` as a substitute for `SPEC`

## Entry Files

Entries are stored in numbered Markdown files with a fixed capacity of 100 entries per file.

- `adr_100.md` → ADR 001–100
- `adr_200.md` → ADR 101–200
- `discussions_100.md` → DISC 001–100
- `discussions_200.md` → DISC 101–200
- Apply the same rule to other entry collections using numbered files.

### Rules

1. Add a new entry to the current file if it contains fewer than 100 entries.
2. When the current file reaches 100 entries, create the next numbered file before adding another entry.
3. Never exceed 100 entries in a file.
4. The next file number is the next multiple of 100.
5. Preserve entry IDs and ordering when creating a new file.
6. Proactively create the next file when the current file becomes full; do not wait for the user to request it.
7. New files must use the same schema and structure as the previous file.
8. Do not split or move existing entries unless explicitly requested.

### Example

When `adr_100.md` receives ADR-100:

- `adr_100.md` is now full.
- Before creating ADR-101, create `adr_200.md`.
- Add ADR-101 to `adr_200.md`.

When `discussions_100.md` receives DISC-100:

- `discussions_100.md` is now full.
- Before creating DISC-101, create `discussions_200.md`.
- Add DISC-101 to `discussions_200.md`.
