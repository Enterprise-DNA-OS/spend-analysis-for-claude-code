# Replace the spend-analysis record from Unit4

This is a mapped flat-file cutover, not a connection to Unit4. The vendor describes loading tabular spend data and Excel integration but publishes no universal Spend Analytics export headings in the sources checked on 1 November 2026. Do not invent an export button or assume access to a report you have not inspected.

1. Ask your authorised Unit4 operator for an unfiltered, transaction-level report for the required period. If that report is unavailable, obtain the original purchasing extract from the finance system used to feed Unit4. Preserve the original file read-only. Include invoice line identity, business unit, supplier, date, amount, currency and purchase order reference. Summary totals cannot recreate individual transactions.
2. Save the extract as CSV UTF-8. Use ISO dates. Agree an amount basis, preferably excluding recoverable tax, and keep credits signed. Do not mix gross and net tax bases or convert currencies implicitly. Export category assignments and supplier normalisations separately if you need them. Preserve attachments in a private evidence archive.
3. Create a fresh business database with migrate, without seed. Register entities and categories using add-entity and add-category. Add canonical suppliers and their source aliases with add-supplier and map-supplier. The sample fixture's KORU and Components records exist only in the fictional demo.
4. Map your headings to the importer fields. Set --source to a stable namespace for that particular source system. Source Key must identify a unique transaction line across all future files; if the source supplies only invoice and line numbers, include the supplier and entity in the composed key during export preparation.
5. Run one import preview, reconcile row counts, dates and signed currency totals against the source, then import. Review missing evidence, classifications, duplicates and supplier matches. Run both systems until an owner accepts the comparison, then decide the cutover date.

```bash
npm run spend -- import unit4 --file=imports/purchases.csv --map=imports/columns.json --source=unit4-finance --actor="Migration owner" --dry-run
npm run spend -- import unit4 --file=imports/purchases.csv --map=imports/columns.json --source=unit4-finance --actor="Migration owner"
```

The importer is a single command once the export and mapping exist. The time to obtain a complete export, agree headings and reconcile history depends on your source. Enterprise DNA handles that mapping in a customised installation.

## Fields

| Import field | Default CSV heading | Required |
|---|---|---|
| source_key | Source Key | Yes |
| entity | Entity | Existing entity code or name |
| supplier | Supplier | Yes, raw source name |
| invoice | Invoice | Yes |
| line_number | Line | Yes |
| invoice_on | Invoice Date | ISO date |
| amount | Amount | Signed decimal, at most two decimal places |
| currency | Currency | Three uppercase letters |
| description | Description | Optional |
| item / uom / quantity | Item / UOM / Quantity | Optional; positive quantity, amount, item and unit required for price comparison |
| po / contract_ref | PO / Contract | Optional |
| evidence_ref / retain_until | Evidence / Retain Until | Optional on import; omissions create findings |
| category | Category | Optional; existing category name when supplied |

Example mapping: {"source_key":"Transaction ID","entity":"Company Code","supplier":"Supplier Name","invoice_on":"Document Date","amount":"Net Amount"}. Put this object in the mapping file. Unspecified keys keep their default headings. No mapping is inferred from similar-looking column names.

Every original column is stored. Exact reruns do not add another line. Changed data or changed mapping for an existing source key is rejected. A malformed row rolls back the whole file. Use separately keyed adjusting lines for financial corrections. record-evidence and classify update review fields with reasons while retaining source payloads. No totals are silently converted, rounded or reclassified.

The import does not carry attachments, saved dashboards, source-system access controls, managed classification rules, external market data or historic reviewer identities. Supplier aliases, evidence locations and category assignments need explicit reconciliation. Export produces JSON for all nine record sets, not a vendor restoration package. Back up the database and evidence archive separately.

Source: [Unit4/Scanmarket Spend Analytics](https://prod-cms-eu-01.scanmarket.com/en/strategic-sourcing/spend-analytics/).
