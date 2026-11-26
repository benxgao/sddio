# Security

## Supported versions

Only the latest published version of `@sddio/cli` is supported. This is a 0.x project: fixes ship as a new version, and nothing is backported.

## Reporting a vulnerability

Report privately through GitHub: **Security → Advisories → Report a vulnerability**. Do not open a public issue.

Include:

- the version (`npx -y @sddio/cli@latest --version`),
- the command you ran,
- what the tool read or wrote that it should not have.

## What this tool is allowed to touch

`sddio init` reads the target project and writes only inside it:

- `.sddio/` — the context layer,
- `sddio_docs/` — the project's knowledge,
- `AGENTS.md` — an appended block between `<!-- sddio:begin -->` and `<!-- sddio:end -->`.

It does not scan or write agent configuration directories, does not write outside the project, and performs no git command. Anything that contradicts that list is a security bug, not a feature request.

## What it does not do

No network calls at runtime, no telemetry, no credentials, no account.
