# FLOW

`FLOW` represents implementation work.

## Create

Create or update a flow when implementation work needs persistent progress tracking.

## Rule

Keep `FLOW` focused on:

- current work
- relevant steps
- implementation state
- completion state

Do not use `FLOW` as permanent project documentation.

## Facts a FLOW carries

- Front matter carries `phases`, each with `code` and `verified` as separate markers.
- `code` means written; `verified` means a command ran and returned the expected value.
- Record the number before and the number after, each with the command that produced it.
- Write status once, in the front matter, and nowhere else.
- Name the residual at close: what was not done, and who owes it.

| Marker | Means                                    |
| ------ | ---------------------------------------- |
| `[ ]`  | Not started                              |
| `[~]`  | Started, not finished                    |
| `[v]`  | Written, not proven — no command has run |
| `[x]`  | Proven — the command ran as expected     |
| `[!]`  | Failed or blocked outside this work      |
| `[-]`  | Dropped, with the reason on the line     |

These are facts a plan records, not fields a tool validates — `ADR-004` keeps `FLOW` schema-free.

## Completion

When work is complete:

1. Validate the implementation.
2. Move the flow to `flow/completed`.
3. Run Reconciliation.
