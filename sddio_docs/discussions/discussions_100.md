<!-- schema version: 1.0.0 -->
<!-- Multiple entries allowed. Frontmatter belongs to the following entry. -->

<!-- entry -->
---
id: DISC-027
type: concern
status: resolved
refs: [SPEC-005]
---

## Who bumps the version

Decided: the bump is a manual commit of its own, `Release v<x.y.z>`, touching only
`packages/cli/package.json` and its two version strings in `package-lock.json`. No changesets, no CI write-back.
That commit is what the annotated tag points at, and the tag is what publishes.

- Why not `CI bump and commit`: it needs `contents: write` and writes to master, which is the branch protection
  this repository relies on.
- The tag is created **before** the publish, not after — `publish.yml` is triggered by the tag. The old
  recommendation said "tag only after a successful publish", which the workflow cannot express; the
  `Confirm the version is public` step is what catches a tag that published nothing.
- Practised twice: `v0.2.1` (`b799890`) and `v0.3.0` (`53d737c`). Both were one commit of three lines.
- The minor number is not cosmetic on 0.x: `0.3.0` was chosen over `0.2.2` because the default hook and the
  exit code of `check` both changed, so a patch number would have understated what users must do to upgrade.
