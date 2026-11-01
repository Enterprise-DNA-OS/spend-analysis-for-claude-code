---
description: Assign a purchasing review and due date.
---

Read CLAUDE.md and docs/cli.md first. Assign a purchasing review and due date.

Read the relevant records before writing. Use only values supplied or confirmed by the operator. Resolve names to one record; show candidates and stop that write if ambiguous. Preview with --dry-run, explain the change, then apply within the operator's authorised scope. Never invent evidence, approval or an actor.

```bash
npm run spend -- add-review --title="Check purchase order" --owner=Mere --due=2030-01-31 --line=B101 --actor="Operator name" --json
```

Report the actual result and any unresolved records. Keep currencies separate and distinguish source evidence from assertions. Never send or publish anything.
