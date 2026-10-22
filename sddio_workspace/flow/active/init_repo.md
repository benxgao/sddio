# Rollout plan of init_repo

## Context

- "@sddio/cli" would be published to npm registry, which is generated from "packages/cli" folder.
- "@sddio/dashboard" would be published to npm registry, which is generated from "packages/dashboard" folder. (This is not planned to be implemented at this stage unless we have a clear vision)
- Once a user installed "@sddio/cli" package, the user can run `sddio init` command to initialize a new project and copy the necessary files.

## NPM package behavior

### "@sddio/cli"

#### command: sddio init

Once `sddio init` is executed:

- a new folder named as `sddio_workspace` which has the same folder/file structure like the `sddio_workspace` in the consumer project repo, which has installed the package "@sddio/cli", should be created at the root of the consumer project repo, where `sddio_workspace` is the actual workplace that user can work on.
- a new folder named as `.sddio` would also be initialized at the root of the consumer project, where `.sddio` folder and its files would be copied from `packages/cli/templates/.sddio` folder/files, which is used to store the default configuration and templates for sddio.

## Template source

- `packages/cli/templates/.sddio` is generated from the repository root `.sddio/` by `npm run sync`, which runs before every build and pack. It is git-ignored, so the root `.sddio/` stays the only copy in the repository (ADR-005).
- `sync` clears both commit cursor fields in the copied `config.json`, so no consumer inherits this repository's SHAs (ADR-006).
- `sddio_workspace/` is not shipped as template files: its layout (`spec/`, `adr/`, `discussions/`, `flow/{active,completed,reconciliation}` plus four empty seeds) is declared in `packages/cli/lib/workspace.ts`.
