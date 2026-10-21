# @sddio/cli

Copies the sddio `.sddio/` context and `sddio_workspace/` scaffolding into a project and registers the sddio snippet in `AGENTS.md`.

## Usage

```bash
npm install --save-dev @sddio/cli
npx sddio init
```

```text
sddio init [--dir <path>] [--force] [--dry-run]
```

| Command / flag | Effect                                                                              |
| -------------- | ----------------------------------------------------------------------------------- |
| `init`         | Create `.sddio/`, `sddio_workspace/` and the seed collections; register `AGENTS.md` |
| `--dir <path>` | Target project root (default: current directory)                                    |
| `--force`      | Overwrite existing files, including `sddio_workspace/`                              |
| `--dry-run`    | Report what would change without writing                                            |

`.sddio/` is package-owned and refreshed on init; `sddio_workspace/` is user-owned and only overwritten with `--force`. A run that finds everything already up to date reports all files as skipped.

## Development

```bash
npm install
npm run build
npm test
npm pack
```

See `TESTING.md` for testing the packed tarball in another local project.
