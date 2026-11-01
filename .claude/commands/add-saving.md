---
description: Register a proposed saving, basis and review date.
---

Read CLAUDE.md and docs/cli.md first. Register a proposed saving, basis and review date.

Read the relevant records before writing. Use only values supplied or confirmed by the operator. Resolve names to one record; show candidates and stop that write if ambiguous. Preview with --dry-run, explain the change, then apply within the operator's authorised scope. Never invent evidence, approval or an actor.

```bash
npm run spend -- add-saving --title="Packing comparison" --owner=Mere --due=2030-01-31 --currency=NZD --estimate=100.00 --basis="Equal quantities and terms, awaiting evidence" --actor="Operator name" --json
```

Report the actual result and any unresolved records. Keep currencies separate and distinguish source evidence from assertions. Never send or publish anything.
