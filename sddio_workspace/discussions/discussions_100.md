<!-- schema version: 1.0.0 -->
<!-- Multiple entries allowed. Frontmatter belongs to the following entry. -->

## <!-- entry -->

id: DISC-001
type: question
status: open
refs: []

---

## FLOW "Open Questions" vs DISCUSSION IDs

The FLOW template's Open Questions section uses a `C-XXXX` ID scheme and states that blocking questions must be answered by the user before the dependent phase starts.

Questions:

- Should those questions live as DISCUSSION entries (referenced via `refs`) instead, so there is only one question-ID system?
- If both are kept, what is the boundary: `C-*` for phase-blocking questions only, `DISC-*` for durable open knowledge?
- In this repository, should the questions in this file be referenced from `init_repo.md` (e.g. `refs: [DISC-001..DISC-022]`), or left unlinked?
