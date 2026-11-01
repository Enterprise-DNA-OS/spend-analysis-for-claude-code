# Evidence checks and their sources

Checked 1 November 2026. This command checks recorded evidence; it does not certify tax compliance, approve invoices, make payments or determine whether a saving occurred.

| Check | Meaning and source |
|---|---|
| SOURCE_EVIDENCE | A transaction has no invoice evidence reference. NZ Inland Revenue says to retain records of sales and expenses, including electronic records. The reference is an operator assertion, not a file existence test. |
| NZ_RETENTION | For an NZ entity with a standard 31 March tax year, retain_until must reach at least the tax-year end plus seven years. IRD requires at least seven tax years. Other balance dates need a configured rule change before reliance. A date alone does not prove continued storage. |
| JURISDICTION_REVIEW | AU and other entities need a local retention review. No NZ rule is applied to them and no Australian compliance claim is made. |
| PO_POLICY | An entity configured to require purchase orders has a line with no PO reference. Internal policy, not legislation; a reference does not prove authorisation. |
| SUPPLIER_MAPPING | A supplier's source name has not been matched to the canonical register. Internal reconciliation control. |
| CATEGORY_REVIEW | No category has been assigned. Internal reporting control. |
| FUTURE_DATE | An invoice date is later than today. Review source dates before interpreting trends. |

Legal source: [Inland Revenue record keeping](https://www.ird.govt.nz/managing-my-tax/record-keeping). IRD also requires English or Maori records unless approved, and approval for offshore storage by the business or provider. Those conditions are outside this local record check. No record is automatically deleted, including after its recorded retention date. Retention exceptions, legal holds and evidence backups remain the operator's responsibility.

Operational source: [Unit4 Spend Analytics features](https://prod-cms-eu-01.scanmarket.com/en/strategic-sourcing/spend-analytics/) describes supplier visibility, purchase-order compliance and payment-term analysis. This build provides explicit local checks rather than asserting that the vendor misses them. It has no payment-term optimiser or external benchmark dataset.

All mutations require an actor label and record a database activity entry. The label is not authenticated identity and the database owner can change the database. This is not a tamper-proof audit service. Shared production use requires a separate identity and role model.

Use record-evidence to add an invoice reference and reviewed retention date. Use classify or map-supplier with a reason to reconcile records. Financial corrections require separately keyed adjusting lines and linked source evidence; never silently replace original values.
