# Rollout plan of init_repo

## Context

- "@sddio/cli" would be published to npm registry, which is generated from "packages/cli" folder.
- "@sddio/dashboard" would be published to npm registry, which is generated from "packages/dashboard" folder. (This is not planned to be implemented at this stage unless we have a clear vision)
- Once a user installed "@sddio/cli" package, the user can run `sddio init` command to initialize a new project and copy the necessary files.

## sddio init

Once `sddio init` is executed:

- `sddio_workspace` folder is only used for the current `sddio` project, while `sddio` folder is used for the consumer project, and `sddio` share the same functionality as`sddio_workspace`.
- a folder named as `sddio` which has the same folder/file structure like the `sddio_workspace` in the consumer project repo should be created in the root of the consumer project, where `sddio`/`sddio_workspace` is the actual workplace that user can work on.
- `.sddio` would also be initialized in the root of the consumer project, which is used to store the configuration of the consumer project for sddio.
- `.sddio/templates` folder and its files would be copied from `packages/cli/templates` folder/files, which is used to store the default templates for sddio.
- `.sddio/custom/templates` folder shares exactly the same folder/file structure like that in `packages/cli/templates`, as well as `.sddio/templates`, in the consumer project repo, which is managed and customised by the users and used to override the default templates (`.sddio/templates`) for sddio.
