# sddio

sddio is a lightweight project context system for AI-assisted software development.

It keeps the project's **requirements, decisions, discussions, and development direction** in a small set of structured, human-readable Markdown files.

## Why

AI can write code quickly, but often lacks reliable project context.

Important context is usually scattered across:

- conversations
- code
- tickets
- documents
- decisions
- developer preferences

sddio provides a small, persistent layer of project context that AI can read and maintain.

## How it works

sddio separates project context into a few focused artifacts:

- **SPEC** — what the system should do
- **ADR** — why important technical decisions were made
- **DISCUSSION** — unresolved questions, concerns, suggestions, and ideas
- **FLOW** — what is currently being worked on
- **ROADMAP** — future direction
- **PREFERENCES** — stable project or user context

AI uses these artifacts to:

1. understand the project
2. identify the user's intent
3. load only relevant context
4. create or update the appropriate artifact
5. keep project knowledge consistent over time

The goal is not to document everything.

The goal is to preserve the **smallest amount of context that meaningfully improves AI work**.

## Design Principles

sddio follows a few simple rules:

- Keep artifacts minimal.
- Prefer structure over prose.
- Make information easy for both humans and AI to parse.
- Keep each artifact focused on one purpose.
- Avoid unnecessary metadata, nesting, duplication, and abstraction.
- Load context only when it is relevant.
- Let AI maintain the context whenever possible.
- Prefer the smallest structure that works well for both humans and AI.

> **Do the least necessary.**

## What sddio Is Not

sddio is not:

- a replacement for Git
- a project management system
- a documentation platform
- a database of every AI conversation
- a requirement to document every change

It is a **context layer between the project and AI**.

## The Desired Experience

After sddio is installed, the developer should not need to manage the system manually.

AI should be able to discover the project context, maintain the relevant artifacts, and keep them useful as the project evolves.

The developer should primarily focus on the project itself.

---

sddio provides **just enough structure for AI to understand, remember, and evolve a project without creating another system to manage.**
