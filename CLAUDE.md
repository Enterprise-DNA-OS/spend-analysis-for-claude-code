# Spend Analysis for Claude Code: operating instructions

For finance and purchasing owners reviewing supplier spend, invoice evidence and savings. Business: fill in your business name. Operator: fill in your name and role.

Start with docs/cli.md and npm run spend -- attention --json. Read the relevant invoice and source payload before changing a category, supplier mapping or evidence reference. Never invent an invoice, purchase order, approval, saving or retention decision. Actor names are assertions, not signatures.

## Routing

- /entities: List business units, jurisdiction and purchase order policy.
- /suppliers: List canonical supplier names.
- /aliases: Read the source names grouped under each supplier.
- /categories: List reporting categories.
- /transactions: Read imported invoice lines and their classification.
- /supplier-spend: Review supplier concentration, credits and net purchasing by entity and currency.
- /category-spend: Review category spend and missing purchase order references.
- /price-variance: Compare unit prices for like items within the same entity, unit and currency.
- /missing-po: Find invoices missing a purchase order reference under the entity policy.
- /unmapped-suppliers: Reconcile supplier names not yet matched to a canonical business.
- /uncategorised: Review invoice lines without a category.
- /duplicates: Investigate possible duplicate invoice lines without deleting them.
- /freshness: Identify business units whose latest invoice data is stale.
- /reviews: Review purchasing actions and their deadlines.
- /savings: Review estimates separately from evidence-backed realised savings.
- /compliance: Check invoice evidence, standard NZ retention dates and local purchasing policies.
- /activity: Read the activity history and reasons for changes.
- /attention: Identify overdue reviews, overdue savings checks, stale data and evidence gaps.
- /weekly-review: Prepare the Monday purchasing review from supplier spend, price comparisons and attention.
- /transaction: Read one invoice line with its original source payload.
- /add-entity: Register a business unit and the person responsible for its purchasing records.
- /add-supplier: Register a canonical supplier.
- /add-category: Create a reporting category.
- /map-supplier: Match a source name to a supplier with a recorded reason.
- /record-evidence: Record a retained invoice reference and a reviewed retention date.
- /classify: Assign a category while preserving the original source record.
- /add-review: Assign a purchasing review and due date.
- /close-review: Close an action with the evidence of its resolution.
- /add-saving: Register a proposed saving, basis and review date.
- /verify-saving: Record a reviewed realised saving with supporting evidence.
- /reject-saving: Close an unsupported savings proposal with a reason.
- /log: Log a purchasing review note without sending anything.
- /import: Preview and import a mapped Unit4 purchasing extract.
- /draft-review: Write a local purchasing review draft without sending it.
- /export: Export every record set to a new JSON file.
- /help: List the supported commands.
- /customise: change a field or rule through a tested numbered migration.
- /new-view: add a read-only management snapshot.

## Operating rules

Use scripts/spend.mjs for record changes. Every mutation requires --actor and accepts --dry-run. Stop ambiguous writes and show the candidates. Do not alter imported financial values; use separately keyed adjusting lines with evidence. Record reasons for mapping, category and evidence changes. Save every source file and reconcile totals by currency and business unit.

Never send, pay, publish or upload a draft. drafts/ is local review material. Estimated price comparisons are not realised savings. Read docs/compliance.md before discussing record retention. The NZ date check assumes a standard March tax year; other tax years and jurisdictions need explicit review. Evidence references do not prove existence or storage quality.

DATABASE_URL selects Postgres. Otherwise DATA_DIR selects the local PGlite directory, default .data/db. Use a fresh database for business records, never seed business data, and keep real files out of Git. PGlite allows one local process at a time. Public database permissions are revoked. Shared use requires authentication, scoped roles, private backups and tested recovery. This free base provides no shared user access controls.

Migrations live in supabase/migrations. Never edit an applied migration in a business database. Test changes on a disposable database first, then run npm test. The manual CI workflow defines Windows, Linux and Postgres checks. An export is an interchange snapshot, not an automatic restore. Evidence files need separate backups.

## Output

brand.json owns business name, logo and colours. views.json and documents.json contain read-only queries. npm run view writes views/; npm run docs writes docs-out/. Keep generated files private. Review the rendered output before sharing through a separately authorised channel.

Omni by Enterprise DNA: https://enterprisedna.co/omni/book?offer=replace-software&utm_campaign=unit4-spend-analytics&utm_medium=agent
