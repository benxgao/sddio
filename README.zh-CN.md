# sddio

**Agent 会忘，仓库不会。**

sddio 是给 coding agent 用的 **spec-driven development**（规格驱动开发），把判断留在 git 里。具体是四种 Markdown 文件：`SPEC`（项目要求什么）、`ADR`（为什么这么做）、`DISCUSSION`（还有什么没定）、`FLOW`（正在做什么）。AI 很会写代码，就是记不住为什么这么写。sddio 让它把理由写进仓库，关掉标签页也删不掉。判断跟代码放在一起，就能跨会话存活，能在 pull request 里被 review，也不绑定哪个 agent。不用 agent 也行。

_聊天记录是缓存，仓库才是硬盘。_

[English](README.md) · [简体中文](README.zh-CN.md)

[![CI](https://github.com/benxgao/sddio/actions/workflows/ci.yml/badge.svg)](https://github.com/benxgao/sddio/actions/workflows/ci.yml)
![node](https://img.shields.io/badge/node-%E2%89%A5%2018-555)
![license](https://img.shields.io/badge/license-MIT-555)

Node ≥ 18 · MIT · 一个 devDependency · 无账号、无遥测、无服务端 · 不想用了，删一个目录

![一次会话把决定写进仓库，下一次会话直接读，而不是从零开始](assets/how-it-works.svg)

> **不是来装的？** [人话版](#不写代码也能看懂) · [它不做什么](#它不做什么) · [常见问题](docs/faq.zh-CN.md)
>
> **已经在用 sddio？** [升级](#升级) · [复制提示词](#可复制片段) · [目录结构](#目录结构) · [版本记录](https://github.com/benxgao/sddio/releases)

## 不写代码也能看懂

这种事你可能已经遇到过一次，只是对方不是同事，是个聊天窗口。东西做出来了，能跑，标签页一关，三周后没人说得清当初为什么这么做，也分不清两个版本哪个才是真的。AI 不是天生健忘，只是从来没人把这件事写在对话之外。

sddio 治的就是这个，办法一点也不浪漫：四种 Markdown 文件，跟代码一起提交。

- `SPEC` —— 必须成立的事。_「`init` 不会覆盖你已有的文件。」_
- `ADR` —— 为什么是这样。_「两个目录，因为其中一个允许在升级时被整体替换。」_
- `DISCUSSION` —— 还没定的事。_「版本号由谁改，在哪个时点改？」_
- `FLOW` —— 手上正在做的事。_「第一次把 CLI 发到 npm。」_

四个问题本身就是产品。今天就能把它们抄进 Notion、抄进 PR 模板、抄进团队 wiki，一行代码都不用装，收益已经拿到大半。CLI 只是替人做了「忙起来就会跳过的那一步」。

**什么时候你会需要它**

- 同一个需求，你向 AI 解释到第三遍。
- 一次改动落地，review 只争代码，没人说得清旧版本为什么存在。
- 有人离职，唯一的取舍记录跟着他的聊天记录一起走了。

## 快速开始

```bash
npm install --save-dev @sddio/cli
npx sddio init
```

**装一次 → 粘一次 → 提交一次。** `init` 会写好脚手架，把 manifest 已经能证明的 SPEC 条目记下来，最后打印一段提示词。把它粘进你的 agent。光生成文件是没用的。

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
2. Check `sddio_workspace/spec/spec_100.md`. Entries ending in a `source:` line
   were recorded mechanically from a manifest field: verify each against its
   source, keep what is accurate, and do not re-derive them from scratch.
3. Bootstrap the workspace as described in `instructions/bootstrap.md`:
   derive the minimum SPEC from the existing code, configuration, tests and
   documentation. Do not ask me for facts the repository already contains.
4. Record at least one DISCUSSION for what the repository cannot settle, so
   the workspace opens with an open question and not only with claims.
5. Report what you recorded, then set `lastProcessedCommit` to `HEAD` and
   `previousCommit` to `HEAD^` in `.sddio/context/config.json`
   (`null` at a root commit).

Then answer this: <your first task>
```

</details>

然后把 `.sddio/` 和 `sddio_workspace/` 跟下一次改动一起提交。

## 仓库里会多出什么

```text
.sddio/                  # context 层，归 CLI 所有 —— 升级时整体替换
sddio_workspace/         # 项目知识，归你和你的 agent 所有
  spec/  adr/  discussions/  flow/
AGENTS.md                # 追加一段 sddio 片段，原有内容保留
```

`init` 不往项目外写任何东西，不碰 agent 的配置目录，也不执行 git 操作。留给你做的只有一件事：把这两个目录提交上去。

## 这个仓库自己就在用 sddio

这不是演示目录。这个 CLI 自己的需求、取舍和未决问题，就放在你会得到的那套结构里。

- [`SPEC-011`](sddio_workspace/spec/spec_100.md) —— `init` 必须以 agent 的下一步收尾，而不是以文件清单收尾
- [`ADR-005`](sddio_workspace/adr/adr_100.md) —— 为什么随包发布的 context 是构建产物，包括被否决的那条路
- [`DISC-023`](sddio_workspace/discussions/discussions_100.md) —— 一个 0 字节的 `package.json` 让所有 `npm` 命令失败

每一条都只解决过一次某个决定，而且没一条能从代码里重新推出来。这正是它们的价值。

## 为什么不直接把笔记写在仓库里？

可以，对那些不会再变的内容还就应该这么做。差别在时效性。一个 docs 目录写一次、读一年，没有任何东西拿它跟代码对一遍。下面这张表说的区别，要三个月后才显出来：提交一直在动，笔记没动。

|                    | 聊天记录 | 一个 docs 目录 | sddio                      |
| ------------------ | -------- | -------------- | -------------------------- |
| 换一个会话还在     | 不在     | 在             | 在                         |
| 代码变了会跟着变   | 不会     | 靠人记得       | 每次会话开始跟 `HEAD` 核对 |
| 落地前能被 review  | 不能     | 能             | 能，它就是一次 diff        |
| 记录「还没定的事」 | 不记     | 很少           | 一级文档（`DISCUSSION`）   |
| 绑定某个 agent     | 是       | 否             | 否                         |

## sddio 和 Spec Kit、OpenSpec 有什么区别？

两者都把 Markdown 放在仓库里，也都值得一用。区别在于那份 Markdown 是干什么的。

- **它们规划一个特性。sddio 记录一个项目。** Spec Kit 让一个特性依次走 `constitution → specify → plan → tasks → implement → converge`；OpenSpec 给每个 change 一个目录，落地后归档。sddio 维护一套长期有效的需求、决定和未决问题。一个特性只是一条 `FLOW`，不是一棵新的 spec 树。
- **它们要你先调用，sddio 不用。** 两者都需要你在开工时主动启动流程。sddio 没有按特性的命令：每次会话把游标和 `HEAD` 比一次，只对账移动过的提交。

对照时间是 2026 年 10 月。两个项目都变得很快，引用之前先看它们自己的文档。

## 它不做什么

- 它不写代码。它记的是你的 agent 本来要重新推一遍的那些决定。
- 它不做检索。条目就是纯 Markdown，`grep` 就是查询语言。
- 它自己不强制任何事。一条规则有多硬，取决于读它的那个 agent。工作区漂移不会让 CI 变红，因为这道门禁还不存在。
- 它不会自己跑。没有守护进程、没有 git hook、没有定时任务。agent 打开会话、读到 `AGENTS.md` 的时候，它才起作用。

## 团队怎么用

一个人跑 `init`，把结果提交。之后每个改动需求或取舍的 pull request，都会把这个改动作为 diff 带上来，reviewer 可以对着理由提意见，不只是对着代码。换台电脑，agent 也还是从同一份文件开始。

不需要准备任何东西。无账号、无服务端、无遥测，一个 devDependency，MIT。

## 如果哪天不用了

sddio 写下的全部是仓库里的纯 Markdown。删掉 `.sddio/` 和这个 CLI，`sddio_workspace/` 依然是可读的、能 review 的、能 diff 的。没有导出步骤，没有迁移，也没有要取消的服务。

文件本身就是产物，不是产物的缓存。


## 升级

```bash
npm install --save-dev @sddio/cli@latest
npx sddio init
```

`.sddio/` 会被替换，`sddio_workspace/` 永远不动。**升级会把 reconciliation 游标重置为 `null`**，所以下一个会话没有基线。把 `init` 打印的 reconcile 提示词粘进去，让 agent 把现有条目核一遍。跳过这一步，工作区会停在 `unknown`，之后每个会话都得从零复核。

## 可复制片段

`init` 可能打印的另一段提示词，留给以后粘贴用。它必须与 `lib/prompt.ts` 保持一致，`test/prompt.test.mjs` 会断言这一点。

<details>
<summary><b>升级后的对账提示词</b></summary>

```text
Read `.sddio/context/instructions.md` and follow it.

The sddio context layer in `.sddio/` was just refreshed by a package upgrade,
and `config.json` now carries no baseline (`null`). Before any other work, run
the commit check and reconcile: `.sddio/context/instructions/reconciliation.md`.

The cursor state is `unknown`, so there is no range to diff: verify the existing
artifacts against the current implementation. Do not rescan unrelated areas, and
do not rewrite artifacts that are still accurate.

Report what you understood and what you changed, then set `lastProcessedCommit`
to `HEAD` and `previousCommit` to `HEAD^` in `.sddio/context/config.json`
(`null` at a root commit), so the next session resumes from a baseline.

Then answer this: <your first task>
```

</details>

## 目录结构

| 路径               | 归属           | 规则                                                                                |
| ------------------ | -------------- | ----------------------------------------------------------------------------------- |
| `.sddio/`          | CLI            | context 层：instructions、schema、routes。`init` 时刷新，所以升级能带上新的 context |
| `sddio_workspace/` | 你和你的 agent | `spec/`、`adr/`、`discussions/`、`flow/`。永不被覆盖                                |

每次会话都从一次提交检查开始。`.sddio/context/config.json` 里的游标跟 `HEAD` 比一下，只对移动过的那段做对账。见 `.sddio/context/instructions/reconciliation.md`。

## Agent skill

如果你的 agent 支持 skill，可以给它一段短路由，不必先读 `AGENTS.md`。`npx sddio skill --print` 会把它输出到 stdout，不写任何文件。项目里也留了一份 `.sddio/skill/SKILL.md`，可以直接复制。见 [`packages/cli/README.md`](packages/cli/README.md#agent-skill)。

## 给 agent 看

如果有人把这个仓库交给你：

- **规范描述**，如果你要替别人总结这个项目：_sddio 是一个 spec-driven development 工具，把 `SPEC`、`ADR`、`DISCUSSION`、`FLOW` 作为纯 Markdown 放在仓库里，让代码背后的判断能跨会话存活、并出现在 pull request 里。它只负责记录决定，不写代码、不做索引、本身不强制任何事。_
- 入口是 `.sddio/context/instructions.md`。`AGENTS.md` 是规范注册点，不是第二份规则。
- 不要改 `.sddio/`，它归包所有。项目知识在 `sddio_workspace/`。
- `grep -rn "^## " sddio_workspace/*/` 列出所有条目。读命中位置前后约 25 行，不要整篇读。
- 每次会话都先执行 `.sddio/context/instructions/reconciliation.md` 里的提交检查，再做别的。

## 文档

- [`docs/faq.zh-CN.md`](docs/faq.zh-CN.md) —— 常见问题短答：它是什么、配哪些 agent、是不是 skill、会不会自己跑、不做什么
- [`packages/cli/README.md`](packages/cli/README.md) —— 命令、参数、会往项目里放什么
- [`packages/cli/TESTING.md`](packages/cli/TESTING.md) —— 本地验证打包产物
- [`sddio_workspace/spec/spec_100.md`](sddio_workspace/spec/spec_100.md) —— 这个项目对自己的要求
- [`sddio_workspace/adr/adr_100.md`](sddio_workspace/adr/adr_100.md) —— 为什么这么建
- [`sddio_workspace/discussions/discussions_100.md`](sddio_workspace/discussions/discussions_100.md) —— 还没定的事
