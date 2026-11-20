# Principles

## Core

1. Keep artifacts minimal and focused.
2. Preserve human readability.
3. Make important structure explicit for AI.
4. Prefer structured Markdown when structure adds value.
5. Prefer the simplest structure that preserves meaning.
6. Keep formatting consistent and predictable.
7. Avoid unnecessary nesting, duplication, and metadata.
8. Keep important relationships and references explicit.

## Design Rule

> Use the smallest structure that works well for both humans and AI.

## Restraint

- Do the least necessary.
- Add structure only when it provides clear value.
- Do not add abstraction, terminology, metadata, or prose without a clear need.
- Prefer the smaller solution when multiple solutions work.
- Optimize for clarity and usefulness, not sophistication or completeness.

## Retirement

A rule is removed when it is measured as unfollowed, not when it feels unfollowed.

- Apply this to the last three reconciled ranges, not to the whole history.
- Measure with `grep` for the command the rule names; a rule with no command is judgement.
- Delete the rule. Restating it in different words is the failure this replaces.

## Bootstrap Minimality

Bootstrap only what is necessary to establish a useful project model.

Do not create:

- speculative requirements
- future requirements
- implementation summaries
- file-by-file descriptions
- duplicate requirements
- requirements already represented elsewhere
- artifacts that do not improve future AI work
