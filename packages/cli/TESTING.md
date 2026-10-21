# Testing `@sddio/cli` locally

How to build the tarball and run it against another project on this machine, without publishing.

## 1. Build and pack

```bash
cd packages/cli
npm install          # first time only
npm run build
npm test
npm pack             # writes sddio-cli-0.1.0.tgz
```

`npm pack` runs `prepack`, so `dist/` is rebuilt even if you forget. The file name follows the version in `package.json`.

## 2. Inspect the tarball before installing

```bash
tar -tzf sddio-cli-0.1.0.tgz | sort
```

Must contain:

```text
package/dist/cli.js
package/templates/.sddio/context/instructions.md
package/templates/.sddio/context/instructions/.schema/adr.md
package/templates/sddio_workspace/spec/spec_100.md
package/templates/sddio_workspace/flow/active/template.md
```

Must not contain `package/lib/` (TypeScript source) or `package/test/`.

If the `.sddio` and `.schema` directories are missing, the `files` field is wrong — dot directories pack correctly, so this is always a manifest problem.

## 3. Install it into another local project

```bash
cd /absolute/path/to/packages/cli
TGZ="$(pwd)/$(npm pack --silent | tail -1)"

cd ~/code/some-project          # any project; keep a scratch repo for this
npm install --save-dev "$TGZ"

npx sddio init --dry-run        # preview, writes nothing
npx sddio init
```

An absolute path is required for `npm install`; a relative one resolves against the target project.

To check the global path as well:

```bash
npm install -g "$TGZ"
sddio --version
npm uninstall -g @sddio/cli
```

## 4. What a correct run looks like

- `.sddio/context/` is populated, including `instructions/.schema/`.
- `sddio_workspace/{spec,adr,discussions}/…_100.md` exist and start with the schema header.
- `sddio_workspace/flow/{active,completed,reconciliation}` exist; `completed` and `reconciliation` are empty by design.
- `AGENTS.md` contains the `<!-- sddio:begin -->` / `<!-- sddio:end -->` block; pre-existing content above it is untouched.
- A second `npx sddio init` reports `created 0, overwritten 0, skipped 22`.
- Editing `sddio_workspace/adr/adr_100.md` and re-running leaves the edit alone; `--force` replaces it.
- `--dry-run` leaves the project byte-for-byte unchanged.

## 5. Re-testing after a code change

```bash
cd packages/cli && npm run build && npm pack
```

Install into a **new** scratch directory each time. npm caches installed tarballs by integrity, so reinstalling the same version into a project that already has it can silently reuse the old copy. To reuse a project instead:

```bash
npm install --force "$TGZ"
```

## 6. Cleanup

```bash
npm uninstall @sddio/cli
rm -rf .sddio sddio_workspace AGENTS.md   # scratch projects only
```

## 7. Common failures

| Symptom | Cause |
| ------- | ----- |
| `Cannot find module '…/dist/cli.js'` | `dist/` was not built before packing |
| `Templates are missing from the package` | `templates` dropped from `files` or from the tarball |
| `E404` when publishing | the `@sddio` scope does not exist or the token lacks access |
| `E402` when publishing | `publishConfig.access` is not `public` |
| `E401` when publishing | `NPM_TOKEN` expired or was never set |
| Yesterday's behaviour after a reinstall | stale `.tgz` or a cached install — use a fresh directory |

## 8. What CI already checks

No need to repeat these by hand: build and tests on Node 18/20/22, tarball contents (required files present, `lib/` and `test/` absent), and an install of the packed artefact into a scratch project followed by `sddio init`.

Local testing is for the things CI cannot know: the real consumer project, pre-existing `AGENTS.md` content, and what the output actually reads like.
