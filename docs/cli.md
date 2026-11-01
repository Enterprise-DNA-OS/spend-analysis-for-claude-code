# Command guide

Use npm run spend -- <command>. All commands accept --json. Arguments use --name=value; quote values containing spaces. Unknown flags, invalid dates and ambiguous names stop with exit code 1. Names and codes match case-insensitively; identifiers accept unique prefixes. No fuzzy matches or automatic choice between candidates.

Every mutation requires --actor="Operator name" and accepts --dry-run to roll back the entire transaction. An actor label is not authentication. Examples use fictional data. Replace identifiers and dates with reviewed values. Never type angle-bracket placeholders literally.

| Command | Purpose |
|---|---|
| entities | List business units, jurisdiction and purchase order policy. |
| suppliers | List canonical supplier names. |
| aliases | Read the source names grouped under each supplier. |
| categories | List reporting categories. |
| transactions | Read imported invoice lines and their classification. |
| supplier-spend | Review supplier concentration, credits and net purchasing by entity and currency. |
| category-spend | Review category spend and missing purchase order references. |
| price-variance | Compare unit prices for like items within the same entity, unit and currency. |
| missing-po | Find invoices missing a purchase order reference under the entity policy. |
| unmapped-suppliers | Reconcile supplier names not yet matched to a canonical business. |
| uncategorised | Review invoice lines without a category. |
| duplicates | Investigate possible duplicate invoice lines without deleting them. |
| freshness | Identify business units whose latest invoice data is stale. |
| reviews | Review purchasing actions and their deadlines. |
| savings | Review estimates separately from evidence-backed realised savings. |
| compliance | Check invoice evidence, standard NZ retention dates and local purchasing policies. |
| activity | Read the activity history and reasons for changes. |
| attention | Identify overdue reviews, overdue savings checks, stale data and evidence gaps. |
| weekly-review | Prepare the Monday purchasing review from supplier spend, price comparisons and attention. |
| transaction | Read one invoice line with its original source payload. |
| add-entity | Register a business unit and the person responsible for its purchasing records. |
| add-supplier | Register a canonical supplier. |
| add-category | Create a reporting category. |
| map-supplier | Match a source name to a supplier with a recorded reason. |
| record-evidence | Record a retained invoice reference and a reviewed retention date. |
| classify | Assign a category while preserving the original source record. |
| add-review | Assign a purchasing review and due date. |
| close-review | Close an action with the evidence of its resolution. |
| add-saving | Register a proposed saving, basis and review date. |
| verify-saving | Record a reviewed realised saving with supporting evidence. |
| reject-saving | Close an unsupported savings proposal with a reason. |
| log | Log a purchasing review note without sending anything. |
| import | Preview and import a mapped Unit4 purchasing extract. |
| draft-review | Write a local purchasing review draft without sending it. |
| export | Export every record set to a new JSON file. |
| help | List the supported commands. |

## Mutation and import examples

### transaction

```bash
npm run spend -- transaction B101
```

### add-entity

```bash
npm run spend -- add-entity --code=NORTH --name="North Division" --country=NZ --owner=Mere --actor="Operator name"
```

### add-supplier

```bash
npm run spend -- add-supplier --code=PACK --name="Packaging Supplier" --actor="Operator name"
```

### add-category

```bash
npm run spend -- add-category --name=Packaging --actor="Operator name"
```

### map-supplier

```bash
npm run spend -- map-supplier --source=unit4 --alias="Supplier trading name" --supplier=PACK --reason="Identity checked against invoice" --actor="Operator name"
```

### record-evidence

```bash
npm run spend -- record-evidence --line=F100 --evidence=archive:invoice-F100 --retain-until=2035-03-31 --reason="Source archived and date reviewed" --actor="Operator name"
```

### classify

```bash
npm run spend -- classify --line=U100 --category=Components --reason="Invoice description reviewed" --actor="Operator name"
```

### add-review

```bash
npm run spend -- add-review --title="Check purchase order" --owner=Mere --due=2030-01-31 --line=B101 --actor="Operator name"
```

### close-review

```bash
npm run spend -- close-review --review=<id> --resolution="Source and purchase order reconciled" --actor="Operator name"
```

### add-saving

```bash
npm run spend -- add-saving --title="Packing comparison" --owner=Mere --due=2030-01-31 --currency=NZD --estimate=100.00 --basis="Equal quantities and terms, awaiting evidence" --actor="Operator name"
```

### verify-saving

```bash
npm run spend -- verify-saving --saving=<id> --realised=80.00 --evidence=archive:approved-comparison --actor="Operator name"
```

### reject-saving

```bash
npm run spend -- reject-saving --saving=<id> --reason="Different delivery terms" --actor="Operator name"
```

### log

```bash
npm run spend -- log --note="Purchasing review held; evidence actions assigned" --actor="Operator name"
```

### import

```bash
npm run spend -- import unit4 --file=imports/purchases.csv --map=imports/columns.json --source=unit4 --dry-run --actor="Operator name"
```

### export

```bash
npm run spend -- export --out=exports/purchasing-snapshot.json
```

For add-entity, --country must be NZ, AU or other. --no-po-policy disables the local missing-PO check for that entity. Review/saving dates are required ISO dates. Verified savings require positive realised amounts and evidence. Only proposed savings can be verified or rejected. Closed reviews cannot be closed again.

record-evidence changes only evidence_ref and retain_until; classify changes only category_id. Both preserve source_payload and record reasons. map-supplier records before and after mappings and changes grouping of existing lines. Correct an amount with a separately keyed signed adjusting line, retaining the original. The duplicate report identifies candidates, not proven duplicate charges.

Reads cover all imported history. freshness reports the newest invoice date separately from the last load time, not a proven integration outage. Each business unit and currency stays separate; no exchange rates or tax assumptions are invented. Price comparisons exclude credits and unknown quantities.

Create exports/ before exporting. Outputs use unique files or refuse overwrites. npm run docs and npm run view render local HTML from read-only database transactions. The CLI sends nothing.
