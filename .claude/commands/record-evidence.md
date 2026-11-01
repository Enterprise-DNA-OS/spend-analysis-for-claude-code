---
description: Record a retained invoice reference and a reviewed retention date.
---

Read CLAUDE.md and docs/cli.md first. Record a retained invoice reference and a reviewed retention date.

Read the relevant records before writing. Use only values supplied or confirmed by the operator. Resolve names to one record; show candidates and stop that write if ambiguous. Preview with --dry-run, explain the change, then apply within the operator's authorised scope. Never invent evidence, approval or an actor.

```bash
npm run spend -- record-evidence --line=F100 --evidence=archive:invoice-F100 --retain-until=2035-03-31 --reason="Source archived and date reviewed" --actor="Operator name" --json
```

Report the actual result and any unresolved records. Keep currencies separate and distinguish source evidence from assertions. Never send or publish anything.
