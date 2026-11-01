create schema spend;
revoke all on schema spend from public;
create function spend.touch() returns trigger language plpgsql as $$ begin new.updated_at=clock_timestamp(); return new; end $$;
create function spend.immutable() returns trigger language plpgsql as $$ begin raise exception 'History is immutable; append a correction or new observation'; end $$;
create table spend.entities (
 id uuid primary key default gen_random_uuid(), code text not null unique check(btrim(code)<>''), name text not null check(btrim(name)<>''),
 country text not null check(country in ('NZ','AU','other')), owner text not null check(btrim(owner)<>''), po_required boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table spend.suppliers (
 id uuid primary key default gen_random_uuid(), code text not null unique check(btrim(code)<>''), name text not null check(btrim(name)<>''),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table spend.aliases (
 id uuid primary key default gen_random_uuid(), source_system text not null check(btrim(source_system)<>''), alias text not null check(btrim(alias)<>''),
 supplier_id uuid not null references spend.suppliers, reason text not null check(btrim(reason)<>''),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index alias_key on spend.aliases(lower(source_system),lower(alias));
create table spend.categories (
 id uuid primary key default gen_random_uuid(), name text not null check(btrim(name)<>''),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index category_name on spend.categories(lower(name));
create table spend.lines (
 id uuid primary key default gen_random_uuid(), source_system text not null check(btrim(source_system)<>''), source_key text not null check(btrim(source_key)<>''),
 entity_id uuid not null references spend.entities, supplier_raw text not null check(btrim(supplier_raw)<>''),
 invoice text not null check(btrim(invoice)<>''), line_number text not null check(btrim(line_number)<>''), invoice_on date not null,
 description text not null, item text not null default '', uom text not null default '', quantity numeric(18,4), amount numeric(18,2) not null,
 currency text not null check(currency ~ '^[A-Z]{3}$'), po text not null default '', contract_ref text not null default '',
 evidence_ref text not null default '', retain_until date, category_id uuid references spend.categories,
 source_payload jsonb not null, source_hash text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(source_system,source_key), check(quantity is null or quantity<>0), check(retain_until is null or retain_until>=invoice_on)
);
create function spend.protect_line() returns trigger language plpgsql as $$
begin if (to_jsonb(new)-'category_id'-'evidence_ref'-'retain_until'-'updated_at') is distinct from (to_jsonb(old)-'category_id'-'evidence_ref'-'retain_until'-'updated_at') then
raise exception 'Financial and source fields are immutable; import a separately keyed correcting line'; end if; return new; end $$;
create trigger protect_line before update on spend.lines for each row execute function spend.protect_line();
create trigger no_delete_line before delete on spend.lines for each row execute function spend.immutable();
create table spend.reviews (
 id uuid primary key default gen_random_uuid(), title text not null check(btrim(title)<>''), owner text not null check(btrim(owner)<>''), due_on date not null,
 line_id uuid references spend.lines, status text not null default 'open' check(status in ('open','closed')), resolution text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(status='open' or (resolution is not null and btrim(resolution)<>''))
);
create table spend.savings (
 id uuid primary key default gen_random_uuid(), title text not null check(btrim(title)<>''), owner text not null check(btrim(owner)<>''), due_on date not null,
 currency text not null check(currency ~ '^[A-Z]{3}$'), estimate numeric(18,2) not null check(estimate>=0),
 basis text not null check(btrim(basis)<>''), realised numeric(18,2) not null default 0 check(realised>=0), evidence_ref text not null default '',
 status text not null default 'proposed' check(status in ('proposed','verified','rejected')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(status<>'verified' or (realised>0 and btrim(evidence_ref)<>'')), check(status='verified' or realised=0)
);
create table spend.activity (
 id uuid primary key default gen_random_uuid(), action text not null, actor text not null check(btrim(actor)<>''), detail jsonb not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table spend.import_batches (
 id uuid primary key default gen_random_uuid(), source_system text not null, file_hash text not null, actor text not null,
 added integer not null, unchanged integer not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create trigger touch_entities before update on spend.entities for each row execute function spend.touch();
alter table spend.entities enable row level security;
revoke all on spend.entities from public;
create trigger touch_suppliers before update on spend.suppliers for each row execute function spend.touch();
alter table spend.suppliers enable row level security;
revoke all on spend.suppliers from public;
create trigger touch_aliases before update on spend.aliases for each row execute function spend.touch();
alter table spend.aliases enable row level security;
revoke all on spend.aliases from public;
create trigger touch_categories before update on spend.categories for each row execute function spend.touch();
alter table spend.categories enable row level security;
revoke all on spend.categories from public;
create trigger touch_lines before update on spend.lines for each row execute function spend.touch();
alter table spend.lines enable row level security;
revoke all on spend.lines from public;
create trigger touch_reviews before update on spend.reviews for each row execute function spend.touch();
alter table spend.reviews enable row level security;
revoke all on spend.reviews from public;
create trigger touch_savings before update on spend.savings for each row execute function spend.touch();
alter table spend.savings enable row level security;
revoke all on spend.savings from public;
create trigger touch_activity before update on spend.activity for each row execute function spend.touch();
alter table spend.activity enable row level security;
revoke all on spend.activity from public;
create trigger touch_import_batches before update on spend.import_batches for each row execute function spend.touch();
alter table spend.import_batches enable row level security;
revoke all on spend.import_batches from public;
create trigger immutable_activity before update or delete on spend.activity for each row execute function spend.immutable();
create trigger immutable_import_batches before update or delete on spend.import_batches for each row execute function spend.immutable();
create unique index entities_code_ci on spend.entities(lower(code));
create unique index suppliers_code_ci on spend.suppliers(lower(code));

create view spend.enriched as
 select l.*, e.code entity, e.country, e.owner entity_owner, e.po_required,
 a.supplier_id, coalesce(s.name,l.supplier_raw) supplier, coalesce(c.name,'Unclassified') category,
 case when l.quantity>0 and l.amount>0 and l.item<>'' and l.uom<>'' then round(l.amount/l.quantity,4) end unit_price,
 case when e.country='NZ' then (make_date(extract(year from l.invoice_on)::int + case when extract(month from l.invoice_on)>3 then 1 else 0 end,3,31)+interval '7 years')::date end nz_minimum_retention
 from spend.lines l join spend.entities e on e.id=l.entity_id
 left join spend.aliases a on lower(a.source_system)=lower(l.source_system) and lower(a.alias)=lower(l.supplier_raw)
 left join spend.suppliers s on s.id=a.supplier_id left join spend.categories c on c.id=l.category_id;
create view spend.supplier_spend as
 with totals as (select entity,currency,sum(greatest(amount,0)) gross_total from spend.enriched group by entity,currency)
 select x.entity,x.supplier,x.currency,count(*) lines,sum(x.amount) net_spend,sum(greatest(x.amount,0)) gross_purchases,
 round(100*sum(greatest(x.amount,0))/nullif(t.gross_total,0),2) gross_share_pct,
 count(distinct x.supplier_raw) supplier_names
 from spend.enriched x join totals t on t.entity=x.entity and t.currency=x.currency
 group by x.entity,x.supplier,x.currency,t.gross_total;
create view spend.category_spend as
 select entity,category,currency,count(*) lines,sum(amount) net_spend,
 sum(case when po='' and po_required then amount else 0 end) missing_po_spend
 from spend.enriched group by entity,category,currency;
create view spend.price_variance as
 with comparable as (select *,min(unit_price) over(partition by entity,item,uom,currency) baseline from spend.enriched where unit_price is not null)
 select id,entity,invoice,supplier,item,uom,currency,quantity,unit_price,baseline,
 round((unit_price-baseline)*quantity,2) comparison_gap
 from comparable where unit_price>baseline;
create view spend.evidence_gaps as
 select id,entity,invoice,currency,amount,'SOURCE_EVIDENCE' rule,'No retained invoice reference recorded' finding from spend.enriched where evidence_ref=''
 union all select id,entity,invoice,currency,amount,'NZ_RETENTION','Retention date is missing or earlier than standard March tax-year minimum' from spend.enriched where country='NZ' and (retain_until is null or retain_until<nz_minimum_retention)
 union all select id,entity,invoice,currency,amount,'JURISDICTION_REVIEW','Non-NZ retention needs local review; no legal rule applied' from spend.enriched where country<>'NZ'
 union all select id,entity,invoice,currency,amount,'PO_POLICY','Purchase order reference missing under this entity policy' from spend.enriched where po_required and po=''
 union all select id,entity,invoice,currency,amount,'SUPPLIER_MAPPING','Supplier alias has not been reconciled' from spend.enriched where supplier_id is null
 union all select id,entity,invoice,currency,amount,'CATEGORY_REVIEW','Category not assigned' from spend.enriched where category_id is null
 union all select id,entity,invoice,currency,amount,'FUTURE_DATE','Invoice date is in the future' from spend.enriched where invoice_on>current_date;
create view spend.duplicate_candidates as
 select entity,supplier,invoice,line_number,currency,amount,count(*) copies,string_agg(source_system||':'||source_key,', ' order by source_system,source_key) source_keys
 from spend.enriched group by entity,supplier,invoice,line_number,currency,amount having count(*)>1;
create view spend.freshness as
 select e.code entity,max(l.invoice_on) newest_invoice,current_date-max(l.invoice_on) days_since_latest_invoice,
 max(l.created_at) last_loaded,count(l.id) lines
 from spend.entities e left join spend.lines l on l.entity_id=e.id group by e.code;
