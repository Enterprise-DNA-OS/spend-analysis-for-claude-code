---
description: Export every record set to a new JSON file.
---

Read CLAUDE.md and docs/cli.md first. Export every record set to a new JSON file.

```bash
npm run spend -- export --out=exports/purchasing-snapshot.json --json
```

Create the exports directory if needed. Use a new filename. Explain that the snapshot is not a backup restore mechanism and referenced evidence must be retained separately.

Report the actual result and any unresolved records. Keep currencies separate and distinguish source evidence from assertions. Never send or publish anything.
