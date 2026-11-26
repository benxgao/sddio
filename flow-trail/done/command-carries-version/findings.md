# Findings

Evidence behind the card's conclusions. Every line was run on 2026-11-27 against HEAD `6b98b76`
(tag `v0.3.2`) unless it says otherwise.

## The command in every document was broken

```
$ npm view sddio version
npm error code E404
npm error 404 Not Found - GET https://registry.npmjs.org/sddio - Not found

$ npm view @sddio/cli version
0.3.2
```

Only the `bin` is called `sddio`; the package is scoped. So `npx sddio start` — the line in the
injected `AGENTS.md` block, in the shipped `instructions.md`, in both READMEs, in `llms.txt`, in
`docs/faq*.md`, in `TESTING.md`, `SECURITY.md` and `docs/distribution.md` — resolved to a package
that does not exist:

```
$ cd /tmp/pyprobe && npx -y sddio start
npm error 404 Note that you can also install from a
npm error 404 tarball, folder, http url, or git url.
```

## The runtime was already portable; only the string was wrong

```
$ mkdir -p /tmp/pyprobe/app && cd /tmp/pyprobe
$ printf '[project]\nname = "demo"\n' > pyproject.toml
$ npx -y @sddio/cli@0.3.2 init --yes
sddio init 0.3.2
target: /private/tmp/pyprobe
  created     .sddio/context/config.json
  ...

$ ls -a
.  ..  .sddio  AGENTS.md  app  pyproject.toml  sddio_docs
```

No `package.json`, no `node_modules`, and the scaffold is complete. The published tarball was already
a machine-level tool; the project was only pretending to own it. What it wrote did not work, though:

```
$ cat AGENTS.md
<!-- sddio:begin -->
This project uses sddio: the repository keeps what the code cannot say.
Run `npx sddio start` before changing code — it prints the entries that constrain this work.
```

## Nothing in the code reads a consumer manifest

| Path | What it resolves | Reads the project's `package.json`? |
| --- | --- | --- |
| `lib/paths.ts` `findPackageRoot` | walks up from `dist/` to the installed package | no — the first `package.json` it meets is the package's own |
| `lib/repo.ts` `findRoot` | walks up to `.sddio/context/config.json` | no |
| `lib/events.ts` `eventsPath` | `.sddio/evals/events.jsonl` inside the project | no |
| `lib/init.ts` `registerAgents` | `AGENTS.md` at the target root | no |

So the install channel was the whole problem. `lib/paths.ts` gained `version`, `lib/agents.ts`
gained `agentsSnippet(version)`, and `cli.ts`/`init.ts` consume it; no other file needed a change.

## The fixture, after the change

```
$ node packages/cli/dist/cli.js init --yes      # in a fresh python-only directory
$ cat AGENTS.md | grep start
Run `npx -y @sddio/cli@0.3.2 start` before changing code — it prints the entries that constrain this work.

$ node packages/cli/dist/cli.js start
start  .
cursor  not a git repository
entries 0 SPEC, 0 ADR, 0 DISC
```

`start` answers before the project is a repository, which is the state a Python project is in on the
first day. At the release, the same block reads `@0.4.0` — the number is never typed.

## Gates

| Gate | Result |
| --- | --- |
| `cd packages/cli && npm test` | 75 → 80 pass, 0 fail |
| `node packages/cli/dist/cli.js check --claims` | 6 claims, 6 ok, 0 drift |
| `grep -rn "npx sddio"` outside the card and the ADRs | nothing but an explanatory comment in `lib/agents.ts` |
| `grep -rn "npm i -D\|npm install --save-dev"` in prose | only the JS-repo sentence in the two READMEs and the upgrade paragraph |
| `npx -y @sddio/cli@0.3.2 --version` in an empty directory | `0.3.2`, and the directory stayed empty |

## Not measured

- `npx -y @sddio/cli@0.4.0` from a foreign repository: the release had not been approved when the
  card closed. The 0.3.2 tarball has the same layout and was measured above.
- Whether `npx pkg@<version>` beats a local `node_modules/.bin` in a JS repository that keeps the
  devDependency.
