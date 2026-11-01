---
description: Close an action with the evidence of its resolution.
---

Read CLAUDE.md and docs/cli.md first. Close an action with the evidence of its resolution.

Read the relevant records before writing. Use only values supplied or confirmed by the operator. Resolve names to one record; show candidates and stop that write if ambiguous. Preview with --dry-run, explain the change, then apply within the operator's authorised scope. Never invent evidence, approval or an actor.

```bash
npm run spend -- close-review --review=<id> --resolution="Source and purchase order reconciled" --actor="Operator name" --json
```

Report the actual result and any unresolved records. Keep currencies separate and distinguish source evidence from assertions. Never send or publish anything.
