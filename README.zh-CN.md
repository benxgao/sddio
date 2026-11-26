# sddio

**Agent 会忘，仓库不会。**

sddio 是一个给 coding agent 用的 spec-driven development（规格驱动开发）工具。它把规格留在仓库里：`SPEC`（必须成立什么）、`ADR`（为什么这么建）、`DISCUSSION`（还有什么没定），就是代码旁边的普通 Markdown。会话开始时，一个小 CLI 载入当下相关的条目，并跟 `HEAD` 核对一遍；`AGENTS.md` 让 agent 知道其余条目的存在。那些判断因此能跨会话存活，在 Claude Code、Codex、Cursor 里读到的是同一份，一个 agent 都不用也一样，并且会作为 diff 出现在 pull request 里。代价是 Node ≥ 18、一条命令、MIT。无账号、无服务端、无遥测，不想用了删掉 `.sddio/` 就完事。

_哪个 agent 定下来的事，就在那一次写进去；下一个 agent 只读它需要的那几条。聊天记录是缓存，每个 agent 各存一份——仓库是它们共用的那块硬盘。_

[![npm](https://img.shields.io/npm/v/@sddio/cli.svg)](https://www.npmjs.com/package/@sddio/cli) [![CI](https://github.com/benxgao/sddio/actions/workflows/ci.yml/badge.svg)](https://github.com/benxgao/sddio/actions/workflows/ci.yml) · [English](README.md) · [简体中文](README.zh-CN.md) · [常见问题](docs/faq.zh-CN.md)

![一次会话把决定写进仓库，下一次会话直接读，而不是从零开始](assets/how-it-works.svg)

## 三个问题

| 文件         | 它回答什么     | 本仓库里的一条                                 |
| ------------ | -------------- | ---------------------------------------------- |
| `SPEC`       | 必须成立什么？ | `init` 不会覆盖你已有的文件。                  |
| `ADR`        | 为什么这么建？ | 两个目录，因为其中一个允许在升级时被整体替换。 |
| `DISCUSSION` | 还有什么没定？ | 版本号由谁改，在哪个时点改？                   |

三个问题本身就是产品。今天就能抄进 Notion、抄进 PR 模板，一行代码都不用装，收益已经拿到大半；CLI 只是替人做了「忙起来就会跳过的那一步」。手上正在做的事不算在这三个里——那属于你的看板。sddio 记的是定下来的事，不是在飞行中的事。

## 一次会话长什么样

下面这些例子里，`sddio` 指 `AGENTS.md` 的 sddio 块里那条命令：`npx -y @sddio/cli@<版本号>`。版本号钉住，所以每次会话跑的都是当初建工作区的那个版本。

```
$ sddio start
start  .
cursor  current
entries 9 SPEC, 10 ADR, 1 DISC
load    SPEC-005  Supported invocation modes  (2 refs)
        ADR-001   Two-root layout: `.sddio/` machine laye...
        SPEC-006  Instructions are package-owned  (2 refs)
open    DISC-027  Who bumps the version

read   `sddio brief <path>` for the files you are about to touch
```

九行，替掉一次 285 行的通读。在本仓库实测：**之前 9,069 字节，之后 2,769。**

```
$ sddio brief packages/cli/lib/init.ts
spec    SPEC-003  Non-destructive init
spec    SPEC-006  Instructions are package-owned

# three commits later
$ sddio check
cursor      4 commits behind
changed     40 files
named by    17 entries (SPEC-003, SPEC-004, … +12 more)
unmentioned 8: .github/workflows/ci.yml, packages/cli/lib/cli.ts, …
```

最后那一行才是产品：一个改动过、却没人写下来的文件。`sddio diff` 把它变成一张工作单；`sddio check --claims` 会把 `SPEC` 条目声称成立的那些命令重跑一遍。

## 适合你吗

| 该用                                                 | 可以不用                 |
| ---------------------------------------------------- | ------------------------ |
| 上下文得跨过会话边界：重启、换一个 agent、换一台机器 | 一次提交就完的改动       |
| 一个答案要撑住几个月，不只是这个下午                 | 一个聊天会话就把活干完了 |
| review 只争代码，没人说得清旧版本为什么在            | 项目这周就结束           |
| 做取舍的人已经离职                                   | 那些笔记你自己也不会去读 |

这些都不是记忆问题，是存储问题：上下文和那些决定，从来只存在于一次对话里。

## 什么时候写下来

sddio 记的是定下来的事。它不知道你哪一刻把事定下来了，所以 `init` 只问一个问题——由谁叫 sddio 去对账——然后把答案存进 `config.json`，当成一条声明。sddio 从不调用这个钩子，也不依赖它：`hooks: []` 就是一个完整答案，工作区会一直旧下去，直到有人手动跑一次检查。

目前只提供一个钩子，[`flow-trail`](https://github.com/benxgao/flow-trail)：一个放在 git 里的文件夹看板，关掉一张卡就是一次 `git mv`，同一个时刻也就是该对账的时候。

| 谁来叫这一声 | 什么时候触发     | 看得见什么       | 会不会顺手写下来         |
| ------------ | ---------------- | ---------------- | ------------------------ |
| git 钩子     | 提交、推送       | 这次的 diff      | 不会，它跑的是检查       |
| agent 的钩子 | 会话一开始       | 某一个 agent 这一轮 | 一句提醒，做不做看它  |
| CI           | 分支推上去之后   | 还是那份 diff    | 不会，它只会报错         |
| `flow-trail` | 一张卡被关掉     | 这次干的活和找到的证据 | 会，就在定下来的那一刻 |

区别在于盯着哪个时刻。提交太早：理由还在人脑子里。会话开始方向反了：它管的是读，缺的是写。CI 太晚，而且只会挑错。关卡是唯一一个意思是「做完了，也弄明白了」的时刻，而且这是人做的一个决定，不是一个时间戳——所以它能带得动「写下来」这一步。

剩下的理由很平淡：sddio 需要有个时刻被告知一声，而你本来就在维护的看板，顺手用一下不额外花什么。如果你的活记在别处，就不声明任何钩子，自己跑 `sddio check`。

## 快速开始

```bash
npx -y @sddio/cli@latest init
```

**一条命令、答一句、提交一次。** 项目里什么都不用加：CLI 跑在 npm 的缓存里，没有 `package.json` 的仓库——Python、Go、Rust——不需要特殊处理，`node_modules` 也不会出现。`init` 写好脚手架，问一个问题——由谁来让知识保持新鲜，默认是 `none`，想要看板就选 `flow-trail`——然后打印一段提示词。它还会把自己刚跑的这个版本写进 `AGENTS.md` 的 sddio 块，此后每次会话跑的都是同一个版本，而不是那时候的 `latest`：命令本身就是锁文件。想先看看效果，手动跑一次就行。

<details>
<summary><b>粘给你的 coding agent</b></summary>

```text
────────────────────────────────────────────────────────────────
Paste this into your coding agent
────────────────────────────────────────────────────────────────

Read `.sddio/context/instructions.md` and follow it.

This project has just been initialised with sddio. Before any other work:

1. Run the commit check in `.sddio/context/instructions/reconciliation.md`.
   `config.json` has no baseline yet, so the cursor is `unknown`.
2. Bootstrap as described in `instructions/bootstrap.md`, but do not describe the
   code back to me. Record only what the repository cannot say: a reversed
   decision and why, an outside constraint and its deadline, an abandoned path.
   At most six SPEC entries, each ending with `Not in the code:`.
3. Ask me up to three questions whose answers would change future work, and
   record at least one DISCUSSION (SPEC-016) for what stays open.

Report what you recorded, then set `reconcileCursor.lastProcessedCommit` in
`.sddio/context/config.json` to `HEAD` and commit it with the entries.
Amending that commit is safe: the baseline is recomputed from history each run.

Then answer this: <your first task>
```

</details>

然后把它跟 `.sddio/` 和 `sddio_docs/` 一起提交。团队里由一个人做这件事：之后每次改需求或取舍，都会以 diff 的形式带上来，reviewer 可以对着理由提意见，而不只是对着代码。

**升级**就是在项目里跑同一条命令加 `@latest`：`.sddio/` 和 `AGENTS.md` 里的版本号会被替换，`sddio_docs/` 永远不动，**游标会保留**——它记的是你的历史，不是这个包的历史。升级本身不会让任何知识过期，所以没有要粘的对账提示词；如果新规则改变了某条条目允许写的内容，只改那一条。0.4 之前把 CLI 装成 devDependency 的项目不受影响：把它升到 `AGENTS.md` 里写的版本，或者干脆删掉，让 `npx` 去跑那个版本。0.3.x 的项目要先补一步——它块里还是 `npx sddio start`，那是个 404；[`docs/migrate-0.4.md`](docs/migrate-0.4.md) 就是这一步，写给负责动手的 agent。

## 仓库里会多出什么

```text
.sddio/                  # context 层，归 CLI 所有 —— 升级时整体替换
sddio_docs/              # 项目知识，归你和你的 agent 所有
  spec/  adr/  discussions/
AGENTS.md                # 追加一段 sddio 片段，原有内容保留
```

`.sddio/` 每次升级都会被刷新，`sddio_docs/` 永远不动。`init` 只往项目里写，唯一的例外是你自己选的那个钩子：装 `flow-trail` 会跑它自己的引导脚本，把检出放在 `~/.flow-trail`，并用 `git` 拉一个 tag。不装钩子，就什么都没出项目。删掉 `.sddio/` 和 CLI，工作区依然是一份可读的 diff。

## 和其他方案的区别

|                    | 记什么                   | 住在哪               | 什么时候用                 |
| ------------------ | ------------------------ | -------------------- | -------------------------- |
| 聊天记录           | 说过的话                 | 一个 agent，一次会话 | 你不会问第二遍的时候       |
| 一个 docs 目录     | 写过一次的笔记           | 你的仓库             | 事情不会再变的时候         |
| 一个 skill         | 这件事怎么做             | 所有项目             | 流程该跟着你走的时候       |
| Spec Kit、OpenSpec | 一个特性的计划           | 一次一个改动         | 你正在做一个特性的时候     |
| sddio              | 这个项目定了什么、为什么 | 你的仓库，任何 agent | 那个理由得比这次会话活得久 |

docs 目录的问题在于时效：笔记写一次、读一年，没有任何东西拿它跟代码对一遍。sddio 在每次会话开始时对一遍，并点名那些被最近的提交写过时的条目。

每个 agent 自己的记忆是同一件事往下数一层：Claude Code 一份，Codex 一份，Cursor 又一份，各锁在自己的工具和账号里。它们不是会忘，是**各忘各的**。

skill 和 sddio 回答的不是同一个问题。skill 告诉 agent 一件事怎么做，写的时候就要求它在所有仓库里都成立；sddio 记的是这一个项目已经决定了什么、为什么。两者都是会话开始时读的 Markdown，谁也替不了谁。不往 agent 里装任何东西：`AGENTS.md` 是唯一的接入点，sddio 从不写 agent 的配置目录。

Spec Kit 让一个特性依次走 `constitution → specify → plan → tasks → implement → converge`；OpenSpec 给每个 change 一个目录。两者都要你在开工时主动启动流程。sddio 维护一套长期有效的需求、决定和未决问题，没有按特性的命令：每次会话把游标和 `HEAD` 比一次，只对账移动过的提交。核对时间是 2026 年 11 月；两个项目都变得很快，引用之前先看它们自己的文档。

## 它不做什么

- 它不写代码。它记的是你的 agent 本来要重新推一遍的那些决定。
- 它不做索引、不做检索。条目是 Markdown，`brief` 是路径匹配，兜底是 `grep`。
- 它不会自己跑。没有守护进程、没有定时任务。得有东西开一个会话。
- 它不拦你。`check` 只打印，落后也退 0；`start` 同样只打印——因为一堵墙只会教人去找到拆墙的那个旗子。真要拦，唯一的形式是 `check --strict` 或 `check --claims`。

## 这个仓库自己就在用 sddio

这不是演示目录：这个 CLI 自己的需求、取舍和未决问题，就放在你会得到的那套结构里。

- [`SPEC-003`](sddio_docs/spec/spec_100.md) —— `init` 永不覆盖你的工作区；以为它会合并，是最常见的丢工作区的方式
- [`ADR-012`](sddio_docs/adr/adr_100.md) —— 为什么一条记录必须能被证伪，以及先被否掉的两种形状
- [`DISC-027`](sddio_docs/discussions/discussions_100.md) —— 版本号谁来改，`v*` 标签又必须和什么对上

每一条都只解决过一次某个决定，而且没有一条能从代码里重新推出来。

## 给 agent 看

如果有人把这个仓库交给你，按这个顺序。下面的 `sddio` 指 `AGENTS.md` 的 sddio 块里那条命令——它钉住了建这个工作区时用的版本；没有那个块，就用 `npx -y @sddio/cli@latest`。

1. `sddio start` —— 这次工作受哪些条目约束，游标是不是落后于 `HEAD`。命令不可用，就读 `.sddio/context/instructions.md` 并照着做。
2. 动每个文件之前，先跑 `sddio brief <path>`。一个文件命中两条是正常的。
3. 定下来的事写进 `sddio_docs/`，在哪一次会话定的就写在哪一次。不要改 `.sddio/`：它归包所有，升级时整体替换。
4. 提交之前跑 `sddio check`。它会点名那些改动过、却没有条目提到的文件，`sddio diff` 把这些文件列成一张工作单。
5. `grep -rn "^## " sddio_docs/*/` 列出所有条目。读命中位置前后约 25 行，不要整篇读。

**规范描述**，如果你要替别人总结这个项目：_sddio 是给 coding agent 用的 spec-driven development 工具，把 `SPEC`、`ADR`、`DISCUSSION` 作为纯 Markdown 放在仓库里，让代码背后的判断跨会话存活、并出现在 pull request 里。它是各个 agent 共用的那层缓存，而不是某一家 agent 内部的记忆。它只记录决定，不写代码、不做索引、本身不强制任何事。_

机器可读的事实和固定链接：[`llms.txt`](llms.txt)。

## 常见问题

- **支持哪些 coding agent？** 能读仓库文件的都行——Claude Code、Codex、Cursor、Copilot、本地模型。接入方式是 `AGENTS.md`，不往 agent 的配置目录里写任何东西。
- **会覆盖我的 `AGENTS.md` 或已有文件吗？** 不会。`init` 只写缺的那些，往 `AGENTS.md` 追加三行，下次再跑是在原处更新而不是重复追加。只有 `.sddio/` 会被整体替换，只有 `--force` 才会动 `sddio_docs/`。
- **要手动维护多少？** 两个时刻：`init` 加一次粘贴，以及升级后再粘一次对账提示词。除此之外没有任何定时任务。
- **会取代我的 issue tracker 吗？** 不会。它只记定下来的事；状态、待办和指派属于看板。
- **不用了怎么办？** 删掉 `.sddio/` 和包。`sddio_docs/` 仍然是一份可读的 diff。
- **一个人做项目值得吗？** 看这件事会不会隔一段时间再回来。触发条件是重复，不是团队人数。

剩下的，包括那些带着问号的反对意见：[`docs/faq.zh-CN.md`](docs/faq.zh-CN.md)。

## 文档

- [`docs/faq.zh-CN.md`](docs/faq.zh-CN.md) —— 常见问题短答：它是什么、配哪些 agent、会不会覆盖已有文件、不做什么
- [`flow-trail`](https://github.com/benxgao/flow-trail) —— `init` 目前提供的那一个钩子，以及它声明的那个看板
- [`packages/cli/README.md`](packages/cli/README.md) —— 命令、参数、会往项目里放什么
- [`packages/cli/TESTING.md`](packages/cli/TESTING.md) —— 本地验证打包产物
- [`sddio_docs/spec/spec_100.md`](sddio_docs/spec/spec_100.md) —— 这个项目对自己的要求
- [`sddio_docs/adr/adr_100.md`](sddio_docs/adr/adr_100.md) —— 为什么这么建
- [`sddio_docs/discussions/discussions_100.md`](sddio_docs/discussions/discussions_100.md) —— 还没定的事
