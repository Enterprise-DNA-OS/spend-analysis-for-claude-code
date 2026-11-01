---
description: Preview and import a mapped Unit4 purchasing extract.
---

Read CLAUDE.md and docs/cli.md first. Preview and import a mapped Unit4 purchasing extract.

Read the relevant records before writing. Use only values supplied or confirmed by the operator. Resolve names to one record; show candidates and stop that write if ambiguous. Preview with --dry-run, explain the change, then apply within the operator's authorised scope. Never invent evidence, approval or an actor.

```bash
npm run spend -- import unit4 --file=imports/purchases.csv --map=imports/columns.json --source=unit4 --dry-run --actor="Operator name" --json
```

Read docs/replace-unit4-spend-analytics.md. The example headings belong to this importer, not a universal vendor export. Prepare the mapping, register required entities/categories, compare source control totals and preview. Remove --dry-run only when the actual import is authorised.

Report the actual result and any unresolved records. Keep currencies separate and distinguish source evidence from assertions. Never send or publish anything.
