# sddio

**Agent 会忘，仓库不会。**

sddio 是给 coding agent 用的 **spec-driven development**，把缓存放在 agent 之外。三种 Markdown 跟代码放在一起：`SPEC`（必须成立什么）、`ADR`（为什么这么做）、`DISCUSSION`（还有什么没定）。哪个 agent 定下的事，哪个 agent 写下来；下一个打开仓库的 agent，只读它需要的那几条。它跨会话存活，出现在 pull request 里，不绑定任何 agent。不用 agent 也行。

_聊天记录是缓存，而且每个 agent 各存一份。仓库是它们共用的那块硬盘。_

[English](README.md) · [简体中文](README.zh-CN.md)

[![npm](https://img.shields.io/npm/v/@sddio/cli.svg)](https://www.npmjs.com/package/@sddio/cli)
[![CI](https://github.com/benxgao/sddio/actions/workflows/ci.yml/badge.svg)](https://github.com/benxgao/sddio/actions/workflows/ci.yml)
![node](https://img.shields.io/badge/node-%E2%89%A5%2018-555)
![license](https://img.shields.io/badge/license-MIT-555)

Node ≥ 18 · MIT · 一个 devDependency · 无账号、无遥测、无服务端 · 不想用了，删一个目录

![一次会话把决定写进仓库，下一次会话直接读，而不是从零开始](assets/how-it-works.svg)

> **不是来装的？** [三个问题](#三个问题) · [一次会话长什么样](#一次会话长什么样) · [它不做什么](#它不做什么) · [常见问题](docs/faq.zh-CN.md)
>
> **已经在用 sddio？** [升级](#升级) · [给 agent 看](#给-agent-看) · [版本记录](https://github.com/benxgao/sddio/releases)

## 它什么时候回本

- 同一个需求，你向 agent 解释到第三遍，它又问了。
- 一次改动落地，review 只争代码，没人说得清旧版本为什么存在。
- 有人离职，唯一的取舍记录跟着他的聊天记录一起走了。
- 你换了个 agent，它把上一个已经做过的决定又推一遍，结论偶尔还不一样。

这些都不是记忆问题，是存储问题：那些判断从来只存在于一次对话里。

## 三个问题

sddio 治的就是这个，办法一点也不浪漫：

- `SPEC` —— 必须成立的事。_「`init` 不会覆盖你已有的文件。」_
- `ADR` —— 为什么是这样。_「两个目录，因为其中一个允许在升级时被整体替换。」_
- `DISCUSSION` —— 还没定的事。_「版本号由谁改，在哪个时点改？」_

三个问题本身就是产品。今天就能抄进 Notion、抄进 PR 模板，一行代码都不用装，收益已经拿到大半。CLI 只是替人做了「忙起来就会跳过的那一步」。

手上正在做的事不算在这三个里。那属于你的看板——sddio 记的是定下来的事，不是在飞行中的事。

## 一次会话长什么样

```
$ npx sddio start
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
$ npx sddio brief packages/cli/lib/init.ts
spec    SPEC-003  Non-destructive init
spec    SPEC-006  Instructions are package-owned
```

三个提交之后，同一个仓库会这么说：

```
$ npx sddio check
cursor      4 commits behind
changed     40 files
named by    17 entries (SPEC-003, SPEC-004, … +12 more)
unmentioned 8: .github/workflows/ci.yml, packages/cli/lib/cli.ts, …
```

最后那一行才是产品：一个改动过、却没人写下来的文件。`sddio diff` 把它变成一张工作单；`sddio check --claims` 会把 `SPEC` 条目声称成立的那些命令重跑一遍。

## 快速开始

```bash
npm install --save-dev @sddio/cli
npx sddio init
```

**装一次 → 答一句 → 提交一次。** `init` 写好脚手架，问一个问题——由谁来让知识保持新鲜——然后打印一段提示词。默认的钩子是 `flow-trail`，选了它就会把看板装进 `flow-trail/`。此后 `AGENTS.md` 会让 agent 在会话开头跑一次 `sddio start`。想先看看效果，手动跑一次就行。

<details>
<summary><b>粘给你的 coding agent</b></summary>

```text
────────────────────────────────────────────────────────────────
Paste this into your coding agent
────────────────────────────────────────────────────────────────

Read `.sddio/context/instructions.md` and follow it.

This project has just been initialised with sddio. Before any other work:

1. Run the commit check in `.sddio/context/instructions/reconciliation.md`.
   `config.json` has no baseline yet, so the state is `unknown`.
2. Bootstrap as described in `instructions/bootstrap.md`, but do not describe the
   code back to me. Record only what the repository cannot say: a reversed
   decision and why, an outside constraint and its deadline, an abandoned path.
   At most six SPEC entries, each ending with `Not in the code:`.
3. Ask me up to three questions whose answers would change future work, and
   record at least one DISCUSSION (SPEC-016) for what stays open.
4. Report what you recorded, then set `reconcileCursor.lastProcessedCommit` to
   `HEAD` and `reconcileCursor.previousCommit` to `HEAD^` in
   `.sddio/context/config.json` (`null` at a root commit).

Then answer this: <your first task>
```

</details>

然后把它跟 `.sddio/` 和 `sddio_docs/` 一起提交。

## 仓库里会多出什么

```text
.sddio/                  # context 层，归 CLI 所有 —— 升级时整体替换
sddio_docs/              # 项目知识，归你和你的 agent 所有
  spec/  adr/  discussions/
AGENTS.md                # 追加一段 sddio 片段，原有内容保留
```

`.sddio/` 每次升级都会被刷新，`sddio_docs/` 永远不动。`init` 只往项目里写，唯一的例外是你自己选的那个钩子：装 `flow-trail` 会跑它自己的引导脚本，把检出放在 `~/.flow-trail`，并用 `git` 拉一个 tag。不装钩子，就什么都没出项目。删掉 `.sddio/` 和 CLI，工作区依然是可读的 diff——文件本身就是产物，不是产物的缓存。

## 为什么不直接写聊天记录，或者建个 docs 目录？

不会再变的东西，写 docs 目录挺好。差别在时效性：笔记写一次、读一年，没有任何东西拿它跟代码对一遍。

|                    | 聊天记录 | 一个 docs 目录 | sddio                      |
| ------------------ | -------- | -------------- | -------------------------- |
| 换一个会话还在     | 不在     | 在             | 在                         |
| 代码变了会跟着变   | 不会     | 靠人记得       | 每次会话开始跟 `HEAD` 核对 |
| 落地前能被 review  | 不能     | 能             | 能，它就是一次 diff        |
| 记录「还没定的事」 | 不记     | 很少           | 一级文档（`DISCUSSION`）   |
| 绑定某个 agent     | 是       | 否             | 否                         |

每个 agent 自己的记忆是同一件事往下数一层：Claude Code 一份，Codex 一份，Cursor 又一份，各锁在自己的工具和账号里。它们不是会忘，是**各忘各的**。

## 和 skill 有什么区别？

skill 告诉 agent **怎么做**一件事，sddio 记下**这个项目已经决定了什么、为什么**。两者都是会话开始时读到的 Markdown，谁也替不了谁。

|                   | skill                              | sddio                     |
| ----------------- | ---------------------------------- | ------------------------- |
| 住在哪            | agent 平台                         | 你的仓库，跟着 git 走     |
| 回答什么          | 怎么做                             | 决定过什么，以及为什么    |
| 适用范围          | 所有项目                           | 这一个项目                |
| 换个 agent 还认得 | 那个 agent 也装了同一个 skill 才行 | 只要能读文件就行          |

不往 agent 里装任何东西：`AGENTS.md` 是唯一的接入点，sddio 从不写 agent 的配置目录。

## sddio 和 Spec Kit、OpenSpec 有什么区别？

两者都把 Markdown 放在仓库里，也都值得一用。区别在于那份 Markdown 是干什么的。

- **它们规划一个特性。sddio 记录一个项目。** Spec Kit 让一个特性依次走 `constitution → specify → plan → tasks → implement → converge`；OpenSpec 给每个 change 一个目录。sddio 维护一套长期有效的需求、决定和未决问题。
- **它们要你先调用，sddio 不用。** 两者都需要你在开工时主动启动流程。sddio 没有按特性的命令：每次会话把游标和 `HEAD` 比一次，只对账移动过的提交。

对照时间是 2026 年 11 月。两个项目都变得很快，引用之前先看它们自己的文档。

## 它不做什么

- 它不写代码。它记的是你的 agent 本来要重新推一遍的那些决定。
- 它不做索引、不做检索。条目是 Markdown，`brief` 是路径匹配，兜底是 `grep`。
- 它不会自己跑。没有守护进程、没有定时任务。得有东西开一个会话。
- 它不拦你。`check` 给 CI 用，落后就退非零；`start` 永远只打印，落后也照样退 0——因为一堵墙只会教人去找到拆墙的那个旗子。

## 这个仓库自己就在用 sddio

这不是演示目录。这个 CLI 自己的需求、取舍和未决问题，就放在你会得到的那套结构里。

- [`SPEC-003`](sddio_docs/spec/spec_100.md) —— `init` 永不覆盖你的工作区；以为它会合并，是最常见的丢工作区的方式
- [`ADR-012`](sddio_docs/adr/adr_100.md) —— 为什么一条记录必须能被证伪，以及先被否掉的两种形状
- [`DISC-027`](sddio_docs/discussions/discussions_100.md) —— 版本号谁来改，`v*` 标签又必须和什么对上

每一条都只解决过一次某个决定，而且没一条能从代码里重新推出来。这正是它们的价值。

## 团队怎么用

一个人跑 `init`，把结果提交。之后每个改动需求或取舍的 pull request 都会把它作为 diff 带上来，reviewer 可以对着理由提意见，不只是对着代码。不需要准备任何东西：无账号、无服务端、无遥测，一个 devDependency，MIT。

## 升级

```bash
npm install --save-dev @sddio/cli@latest
npx sddio init
```

`.sddio/` 会被替换，`sddio_docs/` 永远不动。**升级会把游标重置为 `null`**，所以下一个会话没有基线。把 `init` 打印的那段对账提示词粘进去，让 agent 把现有条目核一遍。跳过这一步，工作区会停在 `unknown`，之后每个会话都得从零复核。提示词原文在 `lib/prompt.ts`。

## 给 agent 看

如果有人把这个仓库交给你：

- **规范描述**，如果你要替别人总结这个项目：_sddio 是给 coding agent 用的 spec-driven development 工具，把 `SPEC`、`ADR`、`DISCUSSION` 作为纯 Markdown 放在仓库里，让代码背后的判断跨会话存活、并出现在 pull request 里。它是各个 agent 共用的那层缓存，而不是某一家 agent 内部的记忆。它只记录决定，不写代码、不做索引、本身不强制任何事。_
- 先跑 `npx sddio start`。命令不可用，就读 `.sddio/context/instructions.md`。
- 不要改 `.sddio/`，它归包所有。项目知识在 `sddio_docs/`。
- `grep -rn "^## " sddio_docs/*/` 列出所有条目。读命中位置前后约 25 行，不要整篇读。

## 文档

- [`docs/faq.zh-CN.md`](docs/faq.zh-CN.md) —— 常见问题短答：它是什么、配哪些 agent、会不会自己跑、不做什么
- [`packages/cli/README.md`](packages/cli/README.md) —— 命令、参数、会往项目里放什么
- [`packages/cli/TESTING.md`](packages/cli/TESTING.md) —— 本地验证打包产物
- [`sddio_docs/spec/spec_100.md`](sddio_docs/spec/spec_100.md) —— 这个项目对自己的要求
- [`sddio_docs/adr/adr_100.md`](sddio_docs/adr/adr_100.md) —— 为什么这么建
- [`sddio_docs/discussions/discussions_100.md`](sddio_docs/discussions/discussions_100.md) —— 还没定的事
