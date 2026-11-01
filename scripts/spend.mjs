#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {parseCsv} from './lib/csv.mjs';
import {table} from './lib/format.mjs';

export const READS={
 entities:'select code,name,country,owner,po_required from spend.entities order by code',
 suppliers:'select code,name from spend.suppliers order by code',
 aliases:'select a.source_system,a.alias,s.code supplier,a.reason from spend.aliases a join spend.suppliers s on s.id=a.supplier_id order by a.source_system,a.alias',
 categories:'select id,name from spend.categories order by name',
 transactions:'select id,entity,invoice,invoice_on,supplier,category,currency,amount,po from spend.enriched order by invoice_on,source_key',
 'supplier-spend':'select * from spend.supplier_spend order by entity,currency,gross_purchases desc',
 'category-spend':'select * from spend.category_spend order by entity,currency,net_spend desc',
 'price-variance':'select entity,invoice,supplier,item,uom,currency,quantity,unit_price,baseline,comparison_gap from spend.price_variance order by entity,currency,comparison_gap desc',
 'missing-po':"select entity,invoice,supplier,currency,amount from spend.enriched where po_required and po='' order by invoice",
 'unmapped-suppliers':'select source_system,supplier_raw,count(*) lines from spend.enriched where supplier_id is null group by source_system,supplier_raw order by supplier_raw',
 'uncategorised':'select id,entity,invoice,description,currency,amount from spend.enriched where category_id is null order by invoice',
 duplicates:'select * from spend.duplicate_candidates order by entity,invoice',
 freshness:'select * from spend.freshness order by entity',
 reviews:"select id,title,owner,due_on,status,resolution from spend.reviews order by due_on",
 savings:'select id,title,owner,due_on,currency,estimate,realised,status,basis,evidence_ref from spend.savings order by due_on',
 compliance:'select entity,invoice,rule,finding from spend.evidence_gaps order by entity,invoice,rule',
 activity:'select action,actor,detail,created_at from spend.activity order by created_at,id',
};
export const WRITES=['add-entity','add-supplier','add-category','map-supplier','record-evidence','classify','add-review','close-review','add-saving','verify-saving','reject-saving','log','import'];
export const COMMANDS=[...Object.keys(READS),'attention','weekly-review','transaction',...WRITES,'draft-review','export','help'];
const TABLES=['entities','suppliers','aliases','categories','lines','reviews','savings','activity','import_batches'];
const hash=s=>createHash('sha256').update(s).digest('hex');
const stable=o=>JSON.stringify(Object.fromEntries(Object.entries(o).sort(([a],[b])=>a.localeCompare(b))));
export function parseArgs(args){
 const o={},pos=[];for(const a of args){if(a.startsWith('--')){const [k,...v]=a.slice(2).split('=');if(k in o)throw Error(`Repeated option --${k}`);o[k]=v.length?v.join('='):true;}else pos.push(a);}
 return {cmd:pos[0]||'help',pos:pos.slice(1),o};
}
function required(o,k){const v=o[k];if(typeof v!=='string'||!v.trim())throw Error(`--${k}=value is required`);return v.trim();}
function date(v,label){if(!/^\d{4}-\d{2}-\d{2}$/.test(String(v))||!Number.isFinite(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v)throw Error(`${label}: use a valid YYYY-MM-DD date`);return v;}
function numeric(v,label,scale=2){if(!new RegExp(`^-?\\d+(?:\\.\\d{1,${scale}})?$`).test(String(v))||!Number.isFinite(Number(v)))throw Error(`${label}: use an ungrouped decimal with at most ${scale} decimal places`);return String(v);}
function currency(v){if(!/^[A-Z]{3}$/.test(v))throw Error('Currency must be three uppercase letters');return v;}
export async function resolve(db,t,key,fields=['name','code']){
 if(!key)throw Error(`Provide a ${t} name, code or id prefix`);
 const cols=fields.filter(x=>x);const where=['id::text ILIKE $1',...cols.map(c=>`${c} ILIKE $2`)].join(' or ');
 const rows=await db.query(`select * from spend.${t} where ${where} order by id`,[`${key}%`,key]);
 if(rows.length===1)return rows[0];
 const candidates=rows.length?rows:await db.query(`select * from spend.${t} order by id limit 25`);
 throw Error(`${rows.length?'Ambiguous':'Unknown'} ${t}: ${key}. Candidates: ${candidates.map(r=>`${r.id} ${r.name||r.title||r.invoice||r.code||''}`).join('; ')}`);
}
async function audit(db,action,actor,detail){await db.query('insert into spend.activity(action,actor,detail) values($1,$2,$3)',[action,actor,JSON.stringify(detail)]);}
async function insert(db,t,values){const keys=Object.keys(values);return (await db.query(`insert into spend.${t}(${keys.join(',')}) values(${keys.map((_,i)=>'$'+(i+1)).join(',')}) returning *`,Object.values(values)))[0];}
export function pretty(data){
 if(Array.isArray(data)){if(!data.length)return '  (none)';const cols=Object.keys(data[0]);return table(data.map(r=>Object.fromEntries(cols.map(k=>[k,typeof r[k]==='object'&&r[k]!==null?JSON.stringify(r[k]):r[k]]))),cols.map(k=>({key:k,label:k.replaceAll('_',' ')})));}
 if(data&&typeof data==='object')return Object.entries(data).map(([k,v])=>`${k}\n${Array.isArray(v)||typeof v==='object'?pretty(v):v}`).join('\n\n');
 return String(data);
}
const HEADER={source_key:'Source Key',entity:'Entity',supplier:'Supplier',invoice:'Invoice',line_number:'Line',invoice_on:'Invoice Date',description:'Description',item:'Item',uom:'UOM',quantity:'Quantity',amount:'Amount',currency:'Currency',po:'PO',contract_ref:'Contract',evidence_ref:'Evidence',retain_until:'Retain Until',category:'Category'};
async function importFile(db,o,actor){
 const source=required(o,'source').toLowerCase();const raw=fs.readFileSync(required(o,'file'),'utf8');const rows=parseCsv(raw);
 if(!rows.length)throw Error('No transactions in CSV');
 const map=o.map?JSON.parse(fs.readFileSync(required(o,'map'),'utf8')):{};
 for(const [k,v] of Object.entries(map))if(!(k in HEADER)||typeof v!=='string'||!v.trim())throw Error(`Invalid column mapping ${k}`);
 const columns={...HEADER,...map};let added=0,unchanged=0;const seen=new Set();
 for(const [i,row] of rows.entries()){
  const get=k=>{const h=Object.keys(row).find(h=>h.toLowerCase()===columns[k].toLowerCase());return h===undefined?'':row[h].trim();};
  const req=k=>{const v=get(k);if(!v)throw Error(`CSV row ${i+2}: missing ${columns[k]}`);return v;};
  const key=req('source_key');if(seen.has(key))throw Error(`Duplicate source key in file: ${key}`);seen.add(key);
  const payload=stable(row),digest=hash(stable({row,columns}));
  const old=await db.query('select source_hash from spend.lines where source_system=$1 and source_key=$2',[source,key]);
  if(old.length){if(old[0].source_hash!==digest)throw Error(`Changed source key ${source}:${key}; supply an explicit correcting line with a new key`);unchanged++;continue;}
  const entity=await resolve(db,'entities',req('entity'));const category=get('category')?await resolve(db,'categories',get('category'),['name']):null;
  await insert(db,'lines',{source_system:source,source_key:key,entity_id:entity.id,supplier_raw:req('supplier'),invoice:req('invoice'),line_number:req('line_number'),invoice_on:date(req('invoice_on'),'Invoice Date'),description:get('description'),item:get('item'),uom:get('uom'),quantity:get('quantity')?numeric(get('quantity'),'Quantity',4):null,amount:numeric(req('amount'),'Amount'),currency:currency(req('currency')),po:get('po'),contract_ref:get('contract_ref'),evidence_ref:get('evidence_ref'),retain_until:get('retain_until')?date(get('retain_until'),'Retain Until'):null,category_id:category?.id||null,source_payload:payload,source_hash:digest});added++;
 }
 const result={rows:rows.length,added,unchanged,dry_run:Boolean(o['dry-run'])};
 await insert(db,'import_batches',{source_system:source,file_hash:hash(raw),actor,added,unchanged});return result;
}
async function write(db,cmd,pos,o){
 const actor=required(o,'actor');await db.exec('BEGIN');
 try{
  let result;
  if(cmd==='add-entity')result=await insert(db,'entities',{code:required(o,'code'),name:required(o,'name'),country:required(o,'country'),owner:required(o,'owner'),po_required:!o['no-po-policy']});
  if(cmd==='add-supplier')result=await insert(db,'suppliers',{code:required(o,'code'),name:required(o,'name')});
  if(cmd==='add-category')result=await insert(db,'categories',{name:required(o,'name')});
  if(cmd==='map-supplier'){
   const supplier=await resolve(db,'suppliers',required(o,'supplier'));
   const values=[required(o,'source'),required(o,'alias'),supplier.id,required(o,'reason')];
   const before=await db.query('select * from spend.aliases where lower(source_system)=lower($1) and lower(alias)=lower($2)',values.slice(0,2));
   result=(await db.query(`insert into spend.aliases(source_system,alias,supplier_id,reason) values($1,$2,$3,$4)
    on conflict(lower(source_system),lower(alias)) do update set supplier_id=excluded.supplier_id,reason=excluded.reason returning *`,values))[0];
   result={before:before[0]||null,after:result};
  }
  if(cmd==='record-evidence'){
   const line=await resolve(db,'lines',required(o,'line'),['invoice']);
   const evidence=required(o,'evidence'),until=date(required(o,'retain-until'),'Retention'),reason=required(o,'reason');
   await db.query('update spend.lines set evidence_ref=$1,retain_until=$2 where id=$3',[evidence,until,line.id]);
   result={id:line.id,before:{evidence_ref:line.evidence_ref,retain_until:line.retain_until},evidence_ref:evidence,retain_until:until,reason};
  }
  if(cmd==='classify'){
   const line=await resolve(db,'lines',required(o,'line'),['invoice']);const cat=await resolve(db,'categories',required(o,'category'),['name']);
   const reason=required(o,'reason');await db.query('update spend.lines set category_id=$1 where id=$2',[cat.id,line.id]);result={id:line.id,before:line.category_id,category:cat.name,reason};
  }
  if(cmd==='add-review')result=await insert(db,'reviews',{title:required(o,'title'),owner:required(o,'owner'),due_on:date(required(o,'due'),'Due'),line_id:o.line?(await resolve(db,'lines',required(o,'line'),['invoice'])).id:null});
  if(cmd==='close-review'){
   const r=await resolve(db,'reviews',required(o,'review'),['title']);if(r.status==='closed')throw Error('Review already closed');
   result=(await db.query("update spend.reviews set status='closed',resolution=$1 where id=$2 returning *",[required(o,'resolution'),r.id]))[0];
  }
  if(cmd==='add-saving')result=await insert(db,'savings',{title:required(o,'title'),owner:required(o,'owner'),due_on:date(required(o,'due'),'Due'),currency:currency(required(o,'currency')),estimate:numeric(required(o,'estimate'),'Estimate'),basis:required(o,'basis')});
  if(cmd==='verify-saving'||cmd==='reject-saving'){
   const r=await resolve(db,'savings',required(o,'saving'),['title']);if(r.status!=='proposed')throw Error('Saving already decided');
   const status=cmd==='verify-saving'?'verified':'rejected';const evidence=required(o,status==='verified'?'evidence':'reason');
   result=(await db.query('update spend.savings set status=$1,realised=$2,evidence_ref=$3 where id=$4 returning *',[status,status==='verified'?numeric(required(o,'realised'),'Realised'):0,evidence,r.id]))[0];
  }
  if(cmd==='log')result={note:required(o,'note')};
  if(cmd==='import'){if(pos[0]!=='unit4')throw Error('Use import unit4 with a mapped transaction CSV');result=await importFile(db,o,actor);}
  await audit(db,cmd,actor,result);await db.exec(o['dry-run']?'ROLLBACK':'COMMIT');return result;
 }catch(e){await db.exec('ROLLBACK');throw e;}
}
export async function run(db,args){
 const {cmd,pos,o}=parseArgs(args);
 const options={
 'add-entity':['code','name','country','owner','no-po-policy'], 'add-supplier':['code','name'], 'add-category':['name'],
 'map-supplier':['source','alias','supplier','reason'], 'record-evidence':['line','evidence','retain-until','reason'],
 classify:['line','category','reason'], 'add-review':['title','owner','due','line'], 'close-review':['review','resolution'],
 'add-saving':['title','owner','due','currency','estimate','basis'], 'verify-saving':['saving','realised','evidence'],
 'reject-saving':['saving','reason'], log:['note'], import:['source','file','map'], export:['out'], transaction:['line']
 };
 const allowed=new Set(['json',...(options[cmd]||[]),...(WRITES.includes(cmd)?['actor','dry-run']:[])]);
 for(const [k,v] of Object.entries(o)){
  if(!allowed.has(k))throw Error(`Unknown option --${k} for ${cmd}`);
  if(['json','dry-run','no-po-policy'].includes(k)&&v!==true)throw Error(`--${k} is a flag without a value`);
 }
 if(pos.length>(['import','transaction'].includes(cmd)?1:0))throw Error('Unexpected positional arguments');
 if(!COMMANDS.includes(cmd))throw Error(`Unknown command ${cmd}. Use help.`);
 if(cmd==='help')return {commands:COMMANDS,usage:'node scripts/spend.mjs <command> --json; writes require --actor=Name. See docs/cli.md.'};
 if(READS[cmd])return db.query(READS[cmd]);
 if(WRITES.includes(cmd))return write(db,cmd,pos,o);
 if(cmd==='transaction'){
  const r=await resolve(db,'lines',pos[0]||required(o,'line'),['invoice']);return db.query('select * from spend.enriched where id=$1',[r.id]);
 }
 if(cmd==='attention')return {
  overdue_reviews:await db.query("select title,owner,due_on from spend.reviews where status='open' and due_on<current_date order by due_on"),
  overdue_savings:await db.query("select title,owner,due_on,currency,estimate from spend.savings where status='proposed' and due_on<current_date order by due_on"),
  stale_entities:await db.query('select * from spend.freshness where newest_invoice is null or days_since_latest_invoice>30 order by entity'),
  evidence_gaps:await db.query('select rule,count(*) findings from spend.evidence_gaps group by rule order by rule')};
 if(cmd==='weekly-review')return {supplier_spend:await run(db,['supplier-spend']),price_comparisons:await run(db,['price-variance']),attention:await run(db,['attention'])};
 if(cmd==='draft-review'){
  const file=path.join(REPO_ROOT,'drafts',`spend-review-${randomUUID()}.md`);fs.mkdirSync(path.dirname(file),{recursive:true});
  fs.writeFileSync(file,'# Spend review draft\n\nFictional data when demo seed is installed. Human review required. No sending. Price comparisons are not savings.\n\n'+pretty(await run(db,['weekly-review']))+'\n',{flag:'wx',mode:0o600});return {file};
 }
 if(cmd==='export'){
  const output=path.resolve(required(o,'out'));const data={format:'spend-analysis-v1',exported_at:new Date().toISOString(),records:{}};
  await db.exec('BEGIN READ ONLY');try {for(const t of TABLES)data.records[t]=await db.query(`select * from spend.${t} order by id`);}finally{await db.exec('ROLLBACK');}
  fs.writeFileSync(output,JSON.stringify(data,null,2)+'\n',{flag:'wx',mode:0o600});return {file:output,counts:Object.fromEntries(TABLES.map(t=>[t,data.records[t].length]))};
 }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 let db;try{db=await getDb();const data=await run(db,process.argv.slice(2));console.log(process.argv.includes('--json')?JSON.stringify(data,null,2):pretty(data));}catch(e){console.error(e.message);process.exitCode=1;}finally{if(db)await db.close();}
}
