| Date | Change | Measured before | Why no folder |
| --- | --- | --- | --- |
| 2026-11-23 | `--prune`, so removing an orphan stops meaning "reset everything" | 1.7 kB of entries emptied by `--force` in one consumer | one flag, one commit |
| 2026-11-27 | A migration guide for 0.3.x projects instead of a `migrate` command | one `init` and one `npm uninstall` cover every 0.3.x tree; the block each one carries is a 404 that `init` rewrites in place | a command would live for one release and then be dead code |
