# SPEC

`SPEC` contains confirmed, durable system requirements.

## Create

Create or update `SPEC` when:

- a new requirement is confirmed
- an existing requirement changes
- implementation reveals a durable requirement

## Shape

- One requirement per bullet.
- Short statements, not paragraphs.
- The title names the requirement; the body does not repeat it.
- Follow Entry Style in `instructions.md`.

## Rules

- Record what the system must do, not how it is implemented.
- Prefer existing entries over duplicates.
- Keep requirements independently understandable.
- Do not record assumptions or temporary behavior.

## Source of Truth

`SPEC` describes confirmed requirements.

The repository describes actual implementation behavior.

If they conflict, use Reconciliation to determine which is stale.
