<!-- schema version: 1.0.0 -->
<!-- Multiple entries allowed. Frontmatter belongs to the following entry. -->

<!-- entry -->
---
id: DISC-027
type: concern
status: open
refs: [SPEC-005]
---

## Who bumps the version

Undefined today. The version lives in `packages/cli/package.json`; there is no changesets setup; a `v*` tag
is what publishes, and it has to match the file.

- Drift, measured: `HEAD` is committed as "Release v0.2.0", `packages/cli/package.json` still says `0.1.0`,
  and the only tag is `v0.1.0`.
- Removing a shipped command (`skill --print`) makes the gap user-visible, not cosmetic.

Options:

1. **Manual bump in the release PR** — explicit, reviewable, no write-back token.
2. **CI bump and commit** — needs `contents: write`, writes to master, complicates branch protection.

Recommendation: option 1. CI asserts the version is greater than the published one, and tags `v<x.y.z>` only after a successful publish.
