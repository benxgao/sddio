# Entries

## Schema

Before creating or modifying an `ADR`, `DISCUSSION`, or `SPEC` entry:

1. Read the corresponding schema in `.schema/`.
2. Follow its fields and structure.
3. Preserve its schema version.

Schema mapping:

- `ADR` → `.schema/adr.md`
- `DISCUSSION` → `.schema/discussion.md`
- `SPEC` → `.schema/spec.md`

Do not duplicate schema definitions in instruction files.

If the expected schema is missing:

1. Search `.schema/` for the closest matching schema.
2. Inspect existing entries for compatibility.
3. Do not invent a new schema unless required.

## Content

- Body content follows Entry Style in `instructions.md`.
- Frontmatter carries fields only, never prose.

## Entry Files

Entry collections use numbered Markdown files with a maximum of 100 entries.

Examples:

```text
adr_100.md       → ADR 001–100
adr_200.md       → ADR 101–200

discussions_100.md → DISC 001–100
discussions_200.md → DISC 101–200
```

Rules:

1. Never exceed 100 entries.
2. Add to the current file while capacity remains.
3. When full, create the next numbered file before adding the next entry.
4. Preserve existing IDs and ordering.
5. New files use the same schema and structure.
6. Never move or split existing entries unless required by capacity.
