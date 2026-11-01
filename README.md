# Spend Analysis for Claude Code

See which suppliers take the purchasing budget, which prices differ and which savings have evidence. Keep the purchasing record in a database you own.

| Do it yourself | We customise it | We run it for you |
|---|---|---|
| Free, MIT licensed. Install the fictional purchasing week. | Your supplier names, category rules, source-file mappings and management views. | Installed and operated through Omni by Enterprise DNA. One setup fee, then a retainer. |
| [Quick start](#quick-start) | [Get your version built](https://enterprisedna.co/omni/book?offer=replace-software&utm_campaign=unit4-spend-analytics&utm_medium=customise) | [Book a call](https://enterprisedna.co/omni/book?offer=replace-software&utm_campaign=unit4-spend-analytics&utm_medium=managed) |

For finance and purchasing teams reviewing spend across business units. Runs with Claude Code, Codex, OpenCode or Cursor. This is a transaction analysis and review system. Unit4's broader service includes managed data preparation, connections and other sourcing modules. [Research and scope](docs/research.md).

## Quick start

Node 20 or later, Windows or Linux:

```bash
git clone https://github.com/Enterprise-DNA-OS/spend-analysis-for-claude-code.git
cd spend-analysis-for-claude-code
npm install
npm run demo
npm test
npm run view
npm run docs
```

The demo is fictional. It contains supplier aliases, a credit, NZD, AUD and USD purchases, two missing source references, a stale business unit and an overdue review. Repeating the seed preserves changes. PGlite stores the local database under .data/db; DATABASE_URL selects Postgres. Local PGlite supports one process at a time.

Use a fresh DATA_DIR or Postgres database for business records. Run migrate there, register the entities and categories, then import. Do not seed business records. Real import files, generated documents and exports are ignored by Git. The checked-in fixture contains fictional records only.

## Five weekly jobs

1. /supplier-spend: reconcile supplier names and inspect concentration by business unit and currency.
2. /price-variance: compare purchases of the same item and unit within each entity and currency.
3. /missing-po: investigate missing purchase order references under the entity's policy.
4. /savings: separate proposed estimates from evidence-backed realised savings.
5. /weekly-review: combine supplier spend, price comparisons and overdue actions.

36 CLI commands and 38 slash recipes ship with the project. Every CLI command accepts --json. [Command arguments and examples](docs/cli.md).

## Ten questions answered today

Unit4 offers configurable analysis. These questions are demonstrated in this build; no claim is made that Unit4 cannot answer them.

| Question | Command |
|---|---|
| Which supplier names belong to the same business? | aliases |
| Which suppliers account for most gross purchases in each currency? | supplier-spend |
| What did each category cost after credits? | category-spend |
| Which comparable item purchases have a higher unit price? | price-variance |
| Which invoices have no purchase order reference where one is required? | missing-po |
| Which supplier names still need matching? | unmapped-suppliers |
| Which source records look like the same invoice line twice? | duplicates |
| Which business unit has old purchasing data? | freshness |
| Which proposed savings are overdue and still unverified? | attention |
| Which records lack invoice evidence or a reviewed retention date? | compliance |

## Numbers you can trace

Currencies and business units stay separate. Net spend includes credits. Supplier concentration uses positive purchases so credits cannot distort the denominator. The price comparison groups by entity, item, unit and currency, and excludes credits and lines without a positive quantity. It compares all imported history, not a selected accounting period. Delivery terms, rebates, tax treatment, quality and effective dates still need review. A comparison gap is not a promised saving.

Amounts must use the same tax basis within a dataset, preferably excluding recoverable tax. The importer does not infer tax or exchange rates. It retains every source column and rejects a changed source key. Financial source fields are immutable; corrections use separately keyed adjusting lines. Category and evidence changes retain their audit history. Supplier remapping changes historical grouping and records its before/after mapping.

Verified savings require a positive realised amount and an evidence reference. This records the reviewer's assertion; it does not independently verify a contract, invoice, or saving. Names supplied with --actor are labels, not authenticated signatures.

## Bring the purchasing history

```bash
npm run spend -- import unit4 --file=fixtures/unit4-example.csv --source=unit4 --actor="Demo operator" --dry-run
npm run spend -- import unit4 --file=fixtures/unit4-example.csv --source=unit4 --actor="Demo operator"
```

The fixture uses documented headings for this importer. Unit4 publishes tabular source-data support, not a universal Spend Analytics export specification. Obtain transaction-level records from your Unit4 report or the original finance source, save as CSV UTF-8, and map the headings with --map when needed. A source key must uniquely identify a line. Summaries alone cannot reconstruct invoice history. [Cutover and mapping guide](docs/replace-unit4-spend-analytics.md).

## Your first hour: ten things to ask for

1. Put our business name and logo on the supplier review.
2. Show the share of purchases going to our largest supplier.
3. Explain why the two Southern Bolt names are grouped together.
4. Show the difference between gross purchases and net spend after credits.
5. Find invoices without a purchase order reference.
6. Show which imported invoice dates are stale.
7. Draft the Monday purchasing review without sending it.
8. Add our cost-centre field through /customise.
9. Add a financial-year view through /new-view.
10. Map a sample export, preview it and reconcile the totals before import.

## Paperwork and read-only views

npm run docs produces supplier review packs, invoice evidence registers and savings verification working papers as branded HTML. npm run view produces the purchasing week and evidence snapshots. Change brand.json for your name, logo and colours. Open the files locally or print them to PDF. [What a screen adds](docs/why-no-front-end.md).

## Checks and operation

npm test uses a temporary database and exercises every CLI command. It checks credits, currency separation, supplier mappings, atomic imports, replay protection, evidence changes, immutable source fields, draft generation and escaped HTML. TEST_DATABASE_URL optionally targets a fresh disposable Postgres database. The manual CI workflow defines Windows, Linux and Postgres checks. See the run report for which environments were actually tested.

The NZ retention check assumes a standard 31 March tax year. It flags a missing date or one earlier than seven tax years after that year-end. It never deletes records. Australian and other entities are explicitly flagged for local review. [Sources and limits](docs/compliance.md).

export writes all nine record sets to JSON. It refuses to overwrite an existing file. This is an interchange snapshot, not an automatic restore. Back up the database and referenced evidence separately. Shared deployment needs authenticated access, scoped roles and tested recovery; public database access is revoked.

MIT licensed. Not affiliated with Unit4, Scanmarket or Anthropic. Hosting and agent subscriptions have separate costs. [Book 30 minutes with Sam](https://enterprisedna.co/omni/book?offer=replace-software&utm_campaign=unit4-spend-analytics&utm_medium=readme).
