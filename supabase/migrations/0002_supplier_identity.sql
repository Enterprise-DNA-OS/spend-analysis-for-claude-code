-- Display names are not unique identities. Unknown names stay scoped to their source.
create or replace view spend.supplier_spend as
 with totals as (select entity,currency,sum(greatest(amount,0)) gross_total from spend.enriched group by entity,currency)
 select x.entity,x.supplier,x.currency,count(*) lines,sum(x.amount) net_spend,sum(greatest(x.amount,0)) gross_purchases,
 round(100*sum(greatest(x.amount,0))/nullif(t.gross_total,0),2) gross_share_pct,
 count(distinct x.supplier_raw) supplier_names,
 coalesce(s.code,x.source_system||':'||x.supplier_raw) supplier_key
 from spend.enriched x join totals t on t.entity=x.entity and t.currency=x.currency
 left join spend.suppliers s on s.id=x.supplier_id
 group by x.entity,x.supplier_id,x.supplier,x.currency,t.gross_total,coalesce(s.code,x.source_system||':'||x.supplier_raw);
create or replace view spend.duplicate_candidates as
 select x.entity,x.supplier,x.invoice,x.line_number,x.currency,x.amount,count(*) copies,
 string_agg(x.source_system||':'||x.source_key,', ' order by x.source_system,x.source_key) source_keys,
 coalesce(s.code,x.source_system||':'||x.supplier_raw) supplier_key
 from spend.enriched x left join spend.suppliers s on s.id=x.supplier_id
 group by x.entity,x.supplier_id,x.supplier,x.invoice,x.line_number,x.currency,x.amount,coalesce(s.code,x.source_system||':'||x.supplier_raw) having count(*)>1;
