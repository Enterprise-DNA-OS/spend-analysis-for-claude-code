---
description: Register a business unit and the person responsible for its purchasing records.
---

Read CLAUDE.md and docs/cli.md first. Register a business unit and the person responsible for its purchasing records.

Read the relevant records before writing. Use only values supplied or confirmed by the operator. Resolve names to one record; show candidates and stop that write if ambiguous. Preview with --dry-run, explain the change, then apply within the operator's authorised scope. Never invent evidence, approval or an actor.

```bash
npm run spend -- add-entity --code=NORTH --name="North Division" --country=NZ --owner=Mere --actor="Operator name" --json
```

Report the actual result and any unresolved records. Keep currencies separate and distinguish source evidence from assertions. Never send or publish anything.
