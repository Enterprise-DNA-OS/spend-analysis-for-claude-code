---
description: Prepare the Monday purchasing review from supplier spend, price comparisons and attention.
---

Read CLAUDE.md and docs/cli.md first. Prepare the Monday purchasing review from supplier spend, price comparisons and attention.

```bash
npm run spend -- weekly-review --json
```

Run supplier-spend, price-variance and attention separately if a finding needs drilling into. Report the largest currency-separated supplier totals, comparable price gaps, overdue owners and missing source records. Price comparisons are not savings. Use draft-review only when a local written draft is wanted.

Report the actual result and any unresolved records. Keep currencies separate and distinguish source evidence from assertions. Never send or publish anything.
