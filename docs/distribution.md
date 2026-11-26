# Distribution

The manual steps around a release. Everything that can be automated already is: `.github/workflows/ci.yml` runs tests and verifies the tarball, and `publish.yml` publishes on a `v*` tag behind a required reviewer.

Work through this once, then keep it as a checklist for every release.

## 1. Repository

- [ ] **Make it public.** Settings → General → Danger Zone → Change visibility. Until this is done, every badge, the README diagram, the `Releases` link and the npm page image are broken for everyone outside the repo.
- [ ] **About → Description:** `A spec-driven development tool for coding agents. The spec lives in your repo.`
- [ ] **About → Topics:** `spec-driven-development`, `coding-agents`, `context-engineering`, `adr`, `agents-md`, `ai-agents`, `claude-code`
- [ ] **Social preview:** Settings → General → Social preview → export `assets/social-preview.svg` to a 1280×640 PNG and upload it (GitHub does not accept SVG here).
- [ ] **Private vulnerability reporting:** Settings → Code security → enable. `SECURITY.md` points reporters there.
- [ ] **Discussions:** Settings → Features → enable, if you want a place for usage questions that are not issues.

## 2. npm

- [ ] Create the `sddio` organisation on npmjs.com and add your account with write access. Scoped packages need the scope to exist before the first publish; otherwise the release fails with `E404`.
- [ ] Create a **granular access token** scoped to `@sddio`, read and write. Write the expiry date down somewhere you will see it — an expired token fails with `E401` and looks like a code bug.
- [ ] Decide the 2FA policy on the package's access page. With "require two-factor authentication and disallow tokens" the token can only **stage** a version; a maintainer approves it afterwards. That is the recommended setting, and it means every release has two steps.
- [ ] GitHub → Settings → Environments → New environment `npm-publish` → add yourself as a required reviewer. Without it the publish job runs unattended.
- [ ] GitHub → Settings → Secrets and variables → Actions → `NPM_TOKEN` = that token.

## 3. First release

- [ ] `packages/cli/package.json` reads `0.1.0`. Nothing else carries a version.
- [ ] `cd packages/cli && npm test` is green locally.
- [ ] `git tag v0.1.0 && git push origin v0.1.0`
- [ ] Approve the `Publish` run under Actions.
- [ ] Run `npx npm@12 stage list @sddio/cli`: a staged `0.1.0` means the token could not bypass 2FA. Approve it with `npx npm@12 stage approve <stage-id>` (asks for a one-time code). The run is red until this is done, on purpose.
- [ ] Commit the npm badge into both READMEs — there is a comment marking the spot. The version stays out of prose; the badge is generated.

## 4. Verify the published artefact

- [ ] `npm view @sddio/cli version` → `0.1.0`. The registry takes a couple of minutes to make a new version public; a 404 right after the run is normal, and the run itself waits up to ten minutes for it.
- [ ] In an empty directory with no `package.json`: `npx -y @sddio/cli@latest --version` prints the release, and `npx -y @sddio/cli@latest init` writes `.sddio/`, `sddio_docs/` and `AGENTS.md` — `ls -a` shows no `node_modules` and no `package.json`. The block in `AGENTS.md` must carry that same version, pinned.
- [ ] `npmjs.com/package/@sddio/cli` shows the package README with the diagram. The image loads from `master` on GitHub, so a private repository means a broken image.
- [ ] `github.com/benxgao/sddio/releases` resolves — the READMEs link there.

## 5. Announce

- [ ] Record a 30-second terminal capture: `init` → paste the prompt → the agent writes `spec/spec_100.md`. Stop before the agent finishes; the point is that the file appears.
- [ ] Use the same three beats everywhere: what breaks without it (session amnesia), the one command, the honest limit (nothing fails CI when the workspace drifts).
- [ ] Keep a fourth beat for readers who will not install it: the three questions, and explicit permission to take them without the CLI. On 少数派 and 掘金 people bookmark an idea, not a command — `README.md#the-three-questions` is written for exactly that.
- [ ] Channels, in order of fit: r/ClaudeAI and r/ChatGPTCoding, Show HN, 掘金 / 少数派 for the Chinese README, then one or two `awesome-*` lists that actually curate rather than collect.
- [ ] Never post the same text twice in the same place. When someone asks "how is this different from Spec Kit", link the README section instead of re-pitching.

## 6. Discoverability

The repository page is the landing page, so it is also the meta description, the snippet and the source that assistants quote.

- [ ] **About → Description** is what Google prints under the result: `A spec-driven development tool for coding agents. The spec lives in your repo.` Keep it under 160 characters and name the category before the benefit — a slogan in that field wastes the only snippet you control.
- [ ] **First paragraph stays self-contained.** It begins `sddio is a spec-driven development tool that keeps the spec in the repository` — a sentence with the subject, the category and the differentiator, before any aphorism. Generators quote that block, or nothing.
- [ ] **Headings are queries.** The two comparison sections are question-shaped (`How is it different from Spec Kit and OpenSpec?`) to match what people type; keep new sections in that form and put the answer in the first 40–80 words, before the nuance.
- [ ] **`llms.txt` at the repository root** carries the citable one-liner, key facts and canonical links. Update it whenever a page is added, renamed or dropped — a stale link list is worse than none.
- [ ] **One canonical copy.** GitHub is canonical; the npm README is a shorter landing page and the Chinese README links back. Do not paste the full README into npm, Dev.to and 掘金 without a link home — the duplicates compete with each other.
- [ ] **Alt text and SVG metadata.** Every image needs alt text describing what it shows, not "diagram"; `assets/how-it-works.svg` carries `<title>` and `<desc>`, which is what image search reads.
- [ ] **npm metadata.** `description` and `keywords` in `packages/cli/package.json` drive npm search and the snippet on npmjs.com. Update them in the same commit as a repositioning, not months later.
- [ ] **Do not stuff.** Repeating "spec-driven development AI agent" in every heading reads as spam to both crawlers and people; this page has one term per section and that is the ceiling.

## 7. Measure

- [ ] Insights → Traffic: views, clones and referrers after week one. Referrers tell you which channel was worth repeating.
- [ ] Downloads: `https://api.npmjs.org/downloads/point/last-week/@sddio/cli`
- [ ] The one signal that matters: an issue or discussion that quotes a `DISCUSSION` entry. That means the workspace is being read, not just installed.

## Known gaps

`check` can fail CI when the knowledge falls behind `HEAD`, but no command can tell whether an entry still says the right thing — that stays the agent's reading. Both READMEs say so; do not paper over it in announcements — the honest limit is part of the pitch.
