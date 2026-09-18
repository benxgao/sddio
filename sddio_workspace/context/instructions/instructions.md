# Instructions

## Startup

1. Read `principles.md`
2. Read `memory.md`
3. Read `../routes/routes.md`
4. Identify the user's intent
5. Load only the relevant project context

## Intent

- New requirement → `SPEC`
- Change to existing requirement → `SPEC`
- Architectural decision → `ADR`
- Unclear requirement or unresolved question → `DISCUSSION`
- Implementation work → `FLOW`
- Completed implementation → `FLOW/completed`

## Before Work

1. Locate relevant `SPEC`
2. Check related `ADR`
3. Check unresolved `DISCUSSION`
4. Check active `FLOW`
5. Do not invent missing requirements

## During Work

- Follow `principles.md`
- Respect `memory.md`
- Keep project artifacts synchronized
- Record important decisions
- Ask through `DISCUSSION` when clarification is required

## After Work

- Validate implementation
- Update `FLOW`
- Update affected `SPEC` when required
- Record architectural decisions in `ADR`
- Resolve or preserve relevant `DISCUSSION`

## Context Loading

- Do not load unrelated artifacts
- Prefer `routes.md` for navigation
- Prefer targeted retrieval over repository-wide reading
- Read the smallest sufficient context
