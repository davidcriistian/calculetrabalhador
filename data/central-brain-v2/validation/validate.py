#!/usr/bin/env python3
from pathlib import Path
import warnings
warnings.simplefilter('ignore', DeprecationWarning)
from datetime import date, datetime
import hashlib, json, re, sys
from jsonschema import Draft202012Validator, FormatChecker, RefResolver
ROOT=Path(__file__).resolve().parents[1]
errors=[]; warnings=[]; stats={}

def load(path):
 try: return json.loads(path.read_text(encoding='utf-8'))
 except Exception as exc: errors.append(f'INVALID_JSON {path.relative_to(ROOT)}: {exc}'); return None

def canonical(value): return json.dumps(value,ensure_ascii=False,sort_keys=True,separators=(',',':'))
def sha256(value): return 'sha256:'+hashlib.sha256((value if isinstance(value,str) else canonical(value)).encode()).hexdigest()
def validate_schema(schema_name, items, label):
 schema=load(ROOT/'schemas'/schema_name)
 if schema is None: return
 resolver=RefResolver(base_uri=(ROOT/'schemas').as_uri()+'/',referrer=schema)
 validator=Draft202012Validator(schema,resolver=resolver,format_checker=FormatChecker())
 for i,item in enumerate(items):
  for err in sorted(validator.iter_errors(item),key=lambda e:list(e.path)):
   loc='.'.join(map(str,err.path)) or '$'; errors.append(f'SCHEMA {label}[{i}].{loc}: {err.message}')

def unique(items,key,label):
 vals=[x.get(key) for x in items]
 dup=sorted({v for v in vals if v is not None and vals.count(v)>1})
 for v in dup: errors.append(f'DUPLICATE_{label.upper()} {v}')

# syntax all JSON
for p in ROOT.rglob('*.json'): load(p)
# mandatory full-package SHA-256 manifest verification
def validate_manifest():
 manifest_path=ROOT/'audit'/'manifest-sha256.generated.json'
 manifest=load(manifest_path)
 if not manifest: errors.append('MANIFEST_MISSING_OR_INVALID'); return
 expected={}
 detached_evidence={
  (ROOT/'audit'/'phase-d-knowledge-consolidation.json').resolve(),
  (ROOT/'docs'/'sprint-5'/'phase-d-consolidation-correction-report.json').resolve(),
  (ROOT/'audit'/'phase-e-internal-consistency.json').resolve(),
  (ROOT/'docs'/'sprint-5'/'phase-e-consistency-correction-report.json').resolve(),
 }
 excluded={manifest_path.resolve(),(ROOT/'validation'/'validation-report.generated.json').resolve(),*detached_evidence}
 for path in sorted(x for x in ROOT.rglob('*') if x.is_file() and x.resolve() not in excluded):
  rel=path.relative_to(ROOT).as_posix(); data=path.read_bytes()
  expected[rel]={'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data)}
 listed={}
 for item in manifest.get('files',[]):
  rel=item.get('path')
  if rel in listed: errors.append(f'MANIFEST_DUPLICATE_PATH {rel}')
  listed[rel]=item
 for rel in sorted(set(expected)-set(listed)): errors.append(f'MANIFEST_MISSING_FILE {rel}')
 for rel in sorted(set(listed)-set(expected)): errors.append(f'MANIFEST_EXTRA_FILE {rel}')
 for rel in sorted(set(expected)&set(listed)):
  if listed[rel].get('sha256')!=expected[rel]['sha256']: errors.append(f'MANIFEST_HASH_MISMATCH {rel}')
  if listed[rel].get('bytes')!=expected[rel]['bytes']: errors.append(f'MANIFEST_SIZE_MISMATCH {rel}')
 seed='\n'.join(f"{rel}:{expected[rel]['sha256']}:{expected[rel]['bytes']}" for rel in sorted(expected))
 root_hash='sha256:'+hashlib.sha256(seed.encode()).hexdigest()
 if manifest.get('rootHash')!=root_hash: errors.append('MANIFEST_ROOT_HASH_MISMATCH')
 if manifest.get('fileCount')!=len(expected): errors.append(f'MANIFEST_FILE_COUNT_MISMATCH {manifest.get("fileCount")}!={len(expected)}')
 stats['manifestFiles']=len(expected); stats['manifestRootHash']=root_hash
validate_manifest()

# schemas must themselves conform to JSON Schema 2020-12
for p in (ROOT/'schemas').glob('*.schema.json'):
 try: Draft202012Validator.check_schema(load(p))
 except Exception as exc: errors.append(f'INVALID_SCHEMA {p.name}: {exc.message if hasattr(exc, "message") else exc}')
# validate index
index=load(ROOT/'index.json'); validate_schema('brain-index.schema.json',[index],'brain-index')
# canonical release metadata consistency
RELEASE_VERSION='2.7.0-sprint5.6.7-phaseE'
release_docs=[ROOT/'index.json',ROOT/'registries'/'index.json',ROOT/'schemas'/'index.json',ROOT/'governance'/'index.json',ROOT/'knowledge'/'index.json',ROOT/'state'/'readiness.json',ROOT/'migration'/'phase-status.json',ROOT/'validation'/'index.json',ROOT/'engines'/'index.json',ROOT/'ingestion'/'index.json']
for release_doc in release_docs:
 doc=load(release_doc)
 if doc:
  actual=doc.get('version',doc.get('packageVersion'))
  if actual!=RELEASE_VERSION: errors.append(f'RELEASE_VERSION_MISMATCH {release_doc.relative_to(ROOT)}->{actual}')

# controlled ingestion queue and readiness state
batches=load(ROOT/'ingestion'/'batches'/'index.json') or {'items':[]}
validate_schema('ingestion-batch.schema.json',batches.get('items',[]),'ingestion-batches')
readiness=load(ROOT/'state'/'readiness.json')
validate_schema('readiness.schema.json',[readiness],'readiness')
if readiness:
 blocking_fail=[g.get('id') for g in readiness.get('gates',[]) if g.get('blocking') and g.get('status')!='PASS']
 if readiness.get('overall')=='READY_FOR_CONTROLLED_INGESTION' and blocking_fail: errors.append('READINESS_WITH_BLOCKING_FAILURES '+','.join(blocking_fail))
# independent technical/legal maturity governance
maturity_path=ROOT/'knowledge'/'domains'/'aviso-previo'/'governance'/'maturity.json'
maturity_doc=load(maturity_path)
if maturity_doc:
 validate_schema('domain-maturity.schema.json',[maturity_doc],'domain-maturity')
 if maturity_doc.get('legalMaturity')=='LEGALLY_APPROVED' and not (load(ROOT/'governance'/'approvals.json') or {}).get('items',[]): errors.append('LEGAL_MATURITY_WITHOUT_FORMAL_APPROVALS')
 if maturity_doc.get('consumerReady') and (maturity_doc.get('technicalMaturity')!='READY_FOR_CONSUMERS' or maturity_doc.get('legalMaturity')!='LEGALLY_APPROVED'): errors.append('CONSUMER_READY_WITHOUT_DUAL_MATURITY')

# registries
files={'domains':'domains.json','sources':'sources.json','rules':'rules.json','projections':'projections.json','dependencies':'dependencies.json','consumers':'consumers.inventory.json','audit-events':'audit-events.json'}
regs={k:load(ROOT/'registries'/v) for k,v in files.items()}
for kind,env in regs.items():
 if env:
  if env.get('kind')!=kind: errors.append(f'REGISTRY_KIND_MISMATCH {kind}')
  if not isinstance(env.get('items'),list): errors.append(f'REGISTRY_ITEMS_NOT_ARRAY {kind}')
# item schema checks
mapping={'domains':'domain.schema.json','sources':'source.schema.json','rules':'rule.schema.json','dependencies':'dependency.schema.json','consumers':'consumer.schema.json','audit-events':'audit-event.schema.json'}
for kind,schema in mapping.items(): validate_schema(schema,(regs[kind] or {}).get('items',[]),kind)
for item in (regs['projections'] or {}).get('items',[]): validate_schema('canonical-projection.schema.json' if item.get('id','').startswith('PROJ-') else 'projection.schema.json',[item],'projections')
D=(regs['domains'] or {}).get('items',[]); S=(regs['sources'] or {}).get('items',[]); R=(regs['rules'] or {}).get('items',[]); P=(regs['projections'] or {}).get('items',[]); E=(regs['dependencies'] or {}).get('items',[]); C=(regs['consumers'] or {}).get('items',[]); A=(regs['audit-events'] or {}).get('items',[])
for items,key,label in [(D,'id','domain'),(S,'id','source'),(R,'id','rule'),(P,'id','projection'),(E,'id','dependency'),(C,'canonicalId','consumer'),(A,'id','audit-event')]: unique(items,key,label)
# cryptographic append-only audit chain
previous=None
for i,event in enumerate(A,1):
 if event.get('sequence')!=i: errors.append(f'AUDIT_SEQUENCE_BROKEN {event.get("id")} expected={i}')
 if event.get('previousEventHash')!=previous: errors.append(f'AUDIT_PREVIOUS_HASH_MISMATCH {event.get("id")}')
 event_seed={k:v for k,v in event.items() if k!='eventHash'}
 expected_event_hash=sha256(event_seed)
 if event.get('eventHash')!=expected_event_hash: errors.append(f'AUDIT_EVENT_HASH_MISMATCH {event.get("id")}')
 previous=event.get('eventHash')
audit_env=regs.get('audit-events') or {}
chain_meta=audit_env.get('chain',{})
if chain_meta.get('eventCount')!=len(A): errors.append('AUDIT_CHAIN_COUNT_MISMATCH')
if chain_meta.get('headEventHash')!=previous: errors.append('AUDIT_CHAIN_HEAD_MISMATCH')
stats['auditEvents']=len(A)
# entity sets
ids={'domain':{x['id'] for x in D},'source':{x['id'] for x in S},'rule':{x['id'] for x in R},'projection':{x['id'] for x in P},'consumer':{x['canonicalId'] for x in C},'audit-event':{x['id'] for x in A},'rule-version':{v['versionId'] for r in R for v in r.get('versions',[])},'test':set(),'document':set()}
# maturity consistency and domain refs
for d in D:
 if d.get('consumerReady') != (d.get('maturity')=='READY_FOR_CONSUMERS'): errors.append(f'INVALID_MATURITY_GATE {d.get("id")}')
 for dep in d.get('dependencies',[]):
  if dep not in ids['domain']: errors.append(f'BROKEN_DOMAIN_DEPENDENCY {d["id"]}->{dep}')
# rules temporal + refs
all_versions=[]
for r in R:
 if r.get('domainId') not in ids['domain']: errors.append(f'BROKEN_RULE_DOMAIN {r.get("id")}->{r.get("domainId")}')
 version_ids=[]
 for v in r.get('versions',[]):
  all_versions.append((r,v)); version_ids.append(v.get('versionId'))
  if v.get('validTo') and v['validFrom']>v['validTo']: errors.append(f'INVALID_VALID_INTERVAL {v.get("versionId")}')
  if v.get('recordedUntil') and v['recordedAt']>=v['recordedUntil']: errors.append(f'INVALID_TRANSACTION_INTERVAL {v.get("versionId")}')
  for sid in v.get('sourceIds',[]):
   if sid not in ids['source']: errors.append(f'BROKEN_VERSION_SOURCE {v.get("versionId")}->{sid}')
  if not v.get('approvalStatus'): errors.append(f'MISSING_APPROVAL_STATUS {v.get("versionId")}')
  if v.get('status')=='approved' and v.get('approvalStatus')!='LEGAL_APPROVED': errors.append(f'APPROVED_VERSION_WITHOUT_LEGAL_APPROVAL_STATUS {v.get("versionId")}')
  if v.get('approvalStatus')=='LEGAL_APPROVED' and (not v.get('approval') or not v.get('contentFingerprint')): errors.append(f'LEGAL_APPROVED_VERSION_INCOMPLETE {v.get("versionId")}')
 if len(version_ids)!=len(set(version_ids)): errors.append(f'DUPLICATE_VERSION_ID_IN_RULE {r.get("id")}')
 approved=[v for v in r.get('versions',[]) if v.get('status')=='approved']
 for i,a in enumerate(approved):
  for b in approved[i+1:]:
   valid_overlap=(a['validTo'] is None or b['validFrom']<=a['validTo']) and (b['validTo'] is None or a['validFrom']<=b['validTo'])
   trans_overlap=(a['recordedUntil'] is None or b['recordedAt']<a['recordedUntil']) and (b['recordedUntil'] is None or a['recordedAt']<b['recordedUntil'])
   if valid_overlap and trans_overlap: errors.append(f'BITEMPORAL_OVERLAP {r["id"]}: {a["versionId"]}/{b["versionId"]}')
# projections
for p in [x for x in P if x.get('id','').startswith('PRJ-')]:
 if p.get('ruleId') not in ids['rule']: errors.append(f'BROKEN_PROJECTION_RULE {p.get("id")}')
 if p.get('ruleVersionId') not in ids['rule-version']: errors.append(f'BROKEN_PROJECTION_VERSION {p.get("id")}')
 for sid in p.get('provenance',[]):
  if sid not in ids['source']: errors.append(f'BROKEN_PROJECTION_SOURCE {p.get("id")}->{sid}')
 content={'ruleId':p.get('ruleId'),'ruleVersionId':p.get('ruleVersionId'),'projectionType':p.get('projectionType'),'effectiveFrom':p.get('effectiveFrom'),'effectiveTo':p.get('effectiveTo'),'payload':p.get('payload'),'provenance':sorted(p.get('provenance',[]))}
 if p.get('contentFingerprint')!=sha256(content): errors.append(f'PROJECTION_CONTENT_FINGERPRINT_MISMATCH {p.get("id")}')
 if p.get('status')=='published' and not p.get('publishedAt'): errors.append(f'PUBLISHED_PROJECTION_WITHOUT_TIMESTAMP {p.get("id")}')
# canonical legal projections (PROJ-*), separate from legacy immutable consumer projections (PRJ-*)
canonical_projection_records=[]
canonical_projection_ids=set()
canonical_projection_catalog=load(ROOT/'knowledge'/'projections'/'global-projection-catalog.json') or {'items':[]}
for item in canonical_projection_catalog.get('items',[]):
 cpid=item.get('projectionId')
 if cpid in canonical_projection_ids: errors.append(f'DUPLICATE_CANONICAL_PROJECTION {cpid}')
 canonical_projection_ids.add(cpid)
 record_path=(ROOT/'knowledge'/'projections'/item.get('path','')).resolve()
 if not record_path.exists(): errors.append(f'BROKEN_CANONICAL_PROJECTION_PATH {cpid}->{item.get("path")}'); continue
 record=load(record_path)
 if not record: continue
 canonical_projection_records.append(record)
 validate_schema('canonical-projection.schema.json',[record],f'canonical-projection:{cpid}')
 if record.get('id')!=cpid: errors.append(f'CANONICAL_PROJECTION_ID_MISMATCH {cpid}')
 if record.get('domainId') not in ids['domain']: errors.append(f'BROKEN_CANONICAL_PROJECTION_DOMAIN {cpid}->{record.get("domainId")}')
 if record.get('contentFingerprint')!=sha256({k:v for k,v in record.items() if k!='contentFingerprint'}): errors.append(f'CANONICAL_PROJECTION_FINGERPRINT_MISMATCH {cpid}')
 if item.get('contentFingerprint')!=record.get('contentFingerprint'): errors.append(f'CANONICAL_PROJECTION_CATALOG_FINGERPRINT_MISMATCH {cpid}')
 declared_facts={x.get('factId') for x in record.get('inputFacts',[])}
 referenced_facts=set()
 for cond in record.get('activation',{}).get('conditions',[]): referenced_facts.add(cond.get('factId'))
 for exc in record.get('exceptions',[]):
  for cond in exc.get('conditions',[]): referenced_facts.add(cond.get('factId'))
 for fid in sorted(x for x in referenced_facts if x and x not in declared_facts): errors.append(f'UNDECLARED_CANONICAL_PROJECTION_INPUT {cpid}->{fid}')
 for dep in record.get('dependencies',[]):
  if dep.get('projectionId') not in canonical_projection_ids and dep.get('projectionId') not in {x.get('projectionId') for x in canonical_projection_catalog.get('items',[])}: errors.append(f'BROKEN_CANONICAL_PROJECTION_DEPENDENCY {cpid}->{dep.get("projectionId")}')
 output_keys={x.get('key') for x in record.get('outputs',[])}
 catalog_item=next((x for x in canonical_projection_catalog.get('items',[]) if x.get('projectionId')==cpid),{})
 if set(catalog_item.get('outputKeys',output_keys))!=output_keys: errors.append(f'CANONICAL_PROJECTION_OUTPUT_INDEX_MISMATCH {cpid}')

# identity policy enforcement for canonical and legacy projection families
identity_policy=load(ROOT/'governance'/'identity-policy.json') or {}
canonical_prefix=identity_policy.get('prefixes',{}).get('projection')
legacy_prefix=identity_policy.get('prefixes',{}).get('legacyProjection')
if canonical_prefix!='PROJ-': errors.append(f'IDENTITY_POLICY_CANONICAL_PROJECTION_PREFIX {canonical_prefix}')
if legacy_prefix!='PRJ-': errors.append(f'IDENTITY_POLICY_LEGACY_PROJECTION_PREFIX {legacy_prefix}')
for record in canonical_projection_records:
 if not record.get('id','').startswith(canonical_prefix or ''): errors.append(f'CANONICAL_PROJECTION_PREFIX_MISMATCH {record.get("id")}')
for record in P:
 expected_prefix=canonical_prefix if record.get('id','').startswith('PROJ-') else legacy_prefix
 if not record.get('id','').startswith(expected_prefix or ''): errors.append(f'PROJECTION_PREFIX_MISMATCH {record.get("id")}')

# dependencies references. declared consumer->domain edges are valid structural refs.
for e in E:
 for side in ('from','to'):
  typ=e.get(side+'Type'); val=e.get(side)
  if typ in ids and val not in ids[typ]: errors.append(f'BROKEN_DEPENDENCY_REFERENCE {e.get("id")} {side}={typ}:{val}')
# indexes path checks
for idx in [ROOT/'schemas/index.json',ROOT/'contracts/index.json',ROOT/'engines/index.json',ROOT/'governance/index.json',ROOT/'registries/index.json']:
 obj=load(idx)
 if not obj: continue
 for it in obj.get('items',[]):
  target=(idx.parent/it['path']).resolve()
  if not target.exists(): errors.append(f'BROKEN_INDEX_PATH {idx.relative_to(ROOT)} -> {it["path"]}')
# aliases
aliases=load(ROOT/'registries/aliases.json') or {'items':[]}
for a in aliases.get('items',[]):
 if a.get('entityType') in ids and a.get('canonicalId') not in ids[a['entityType']]: errors.append(f'BROKEN_ALIAS {a.get("alias")}')

# canonical domain knowledge packages
knowledge_index=load(ROOT/'knowledge'/'index.json') or {'items':[]}
for entry in knowledge_index.get('items',[]):
 manifest_path=(ROOT/'knowledge'/entry['path']).resolve()
 manifest=load(manifest_path)
 if not manifest: continue
 validate_schema('domain-package.schema.json',[manifest],f'domain-package:{entry.get("domainId")}')
 if manifest.get('domainId') not in ids['domain']: errors.append(f'BROKEN_KNOWLEDGE_DOMAIN {manifest.get("domainId")}')
 for key,rel in manifest.get('sections',{}).items():
  target=(manifest_path.parent/rel).resolve()
  if not target.exists(): errors.append(f'BROKEN_DOMAIN_SECTION {manifest.get("domainId")}:{key}->{rel}'); continue
 schema_map={'identity':'domain-identity.schema.json','aliases':'domain-aliases.schema.json','taxonomy':'domain-taxonomy.schema.json','glossary':'domain-glossary.schema.json','relationships':'domain-relationships.schema.json','maturity':'domain-maturity.schema.json'}
 if key in schema_map:
  obj=load(target)
  if obj: validate_schema(schema_map[key],[obj],f'{manifest.get("domainId")}:{key}')
 rel_path=(manifest_path.parent/manifest.get('sections',{}).get('relationships','')).resolve()
 rels=load(rel_path) if rel_path.exists() else None
 if rels:
  for rel in rels.get('items',[]):
   if rel.get('targetDomainId') not in ids['domain']: errors.append(f'BROKEN_DOMAIN_RELATIONSHIP {manifest.get("domainId")}->{rel.get("targetDomainId")}')


# domain source catalogs and record integrity
for entry in knowledge_index.get('items',[]):
 manifest_path=(ROOT/'knowledge'/entry['path']).resolve()
 manifest=load(manifest_path)
 if not manifest: continue
 src_rel=manifest.get('sections',{}).get('sources')
 if not src_rel: continue
 catalog_path=(manifest_path.parent/src_rel).resolve()
 catalog=load(catalog_path)
 if not catalog: continue
 validate_schema('domain-source-catalog.schema.json',[catalog],f'{manifest.get("domainId")}:source-catalog')
 seen_source_ids=set()
 for item in catalog.get('items',[]):
  sid=item.get('sourceId')
  if sid in seen_source_ids: errors.append(f'DUPLICATE_DOMAIN_SOURCE {manifest.get("domainId")}:{sid}')
  seen_source_ids.add(sid)
  if sid not in ids['source']: errors.append(f'BROKEN_DOMAIN_SOURCE_REGISTRY {manifest.get("domainId")}:{sid}')
  record_path=(catalog_path.parent/item.get('path','')).resolve()
  if not record_path.exists():
   errors.append(f'BROKEN_DOMAIN_SOURCE_PATH {manifest.get("domainId")}:{sid}->{item.get("path")}')
   continue
  record=load(record_path)
  if record:
   validate_schema('source.schema.json',[record],f'{manifest.get("domainId")}:source:{sid}')
   if record.get('id')!=sid: errors.append(f'DOMAIN_SOURCE_ID_MISMATCH {manifest.get("domainId")}:{sid}')
 included=[i for i in catalog.get('items',[]) if i.get('applicability')=='included']
 if catalog.get('status')=='SOURCES_VALIDATED' and not included:
  errors.append(f'VALIDATED_SOURCE_CATALOG_WITHOUT_INCLUDED_SOURCES {manifest.get("domainId")}')

# canonical concept catalogs and ontology integrity
all_concept_ids=set()
concept_count=0
for entry in knowledge_index.get('items',[]):
 manifest_path=(ROOT/'knowledge'/entry['path']).resolve()
 manifest=load(manifest_path)
 if not manifest: continue
 concept_rel=manifest.get('sections',{}).get('concepts')
 if not concept_rel: continue
 catalog_path=(manifest_path.parent/concept_rel).resolve()
 catalog=load(catalog_path)
 if not catalog: continue
 validate_schema('domain-concept-catalog.schema.json',[catalog],f'{manifest.get("domainId")}:concept-catalog')
 local_ids=set()
 for item in catalog.get('items',[]):
  cid=item.get('conceptId')
  if cid in local_ids: errors.append(f'DUPLICATE_DOMAIN_CONCEPT {manifest.get("domainId")}:{cid}')
  if cid in all_concept_ids: errors.append(f'DUPLICATE_GLOBAL_CONCEPT {cid}')
  local_ids.add(cid); all_concept_ids.add(cid); concept_count+=1
  record_path=(catalog_path.parent/item.get('path','')).resolve()
  if not record_path.exists(): errors.append(f'BROKEN_DOMAIN_CONCEPT_PATH {manifest.get("domainId")}:{cid}->{item.get("path")}'); continue
  record=load(record_path)
  if record:
   validate_schema('concept.schema.json',[record],f'{manifest.get("domainId")}:concept:{cid}')
   if record.get('id')!=cid: errors.append(f'DOMAIN_CONCEPT_ID_MISMATCH {manifest.get("domainId")}:{cid}')
   if record.get('domainId')!=manifest.get('domainId'): errors.append(f'DOMAIN_CONCEPT_OWNER_MISMATCH {cid}')
   for ref in record.get('sourceRefs',[]):
    if ref.get('sourceId') not in ids['source']: errors.append(f'BROKEN_CONCEPT_SOURCE {cid}->{ref.get("sourceId")}')
 if catalog.get('status')=='CONCEPTS_VALIDATED' and not local_ids: errors.append(f'VALIDATED_CONCEPT_CATALOG_EMPTY {manifest.get("domainId")}')
ontology_path=ROOT/'ontology'/'relations.json'
if ontology_path.exists():
 ontology=load(ontology_path)
 if ontology:
  validate_schema('ontology-relations.schema.json',[ontology],'ontology-relations')
  relation_type_ids={x.get('id') for x in ontology.get('relationTypes',[])}
  rel_ids=[]
  for rel in ontology.get('items',[]):
   rel_ids.append(rel.get('id'))
   if rel.get('relation') not in relation_type_ids: errors.append(f'UNKNOWN_ONTOLOGY_RELATION_TYPE {rel.get("id")}->{rel.get("relation")}')
   if rel.get('fromConceptId') not in all_concept_ids: errors.append(f'BROKEN_ONTOLOGY_FROM {rel.get("id")}->{rel.get("fromConceptId")}')
   if rel.get('toConceptId') not in all_concept_ids: errors.append(f'BROKEN_ONTOLOGY_TO {rel.get("id")}->{rel.get("toConceptId")}')
   for sid in rel.get('evidenceSourceIds',[]):
    if sid not in ids['source']: errors.append(f'BROKEN_ONTOLOGY_SOURCE {rel.get("id")}->{sid}')
  if len(rel_ids)!=len(set(rel_ids)): errors.append('DUPLICATE_ONTOLOGY_RELATION_ID')


# canonical domain rule catalogs, rule files and traceability integrity
for entry in knowledge_index.get('items',[]):
 manifest_path=(ROOT/'knowledge'/entry['path']).resolve()
 manifest=load(manifest_path)
 if not manifest: continue
 rule_rel=manifest.get('sections',{}).get('rules')
 if not rule_rel: continue
 catalog_path=(manifest_path.parent/rule_rel).resolve()
 catalog=load(catalog_path)
 if not catalog: continue
 validate_schema('domain-rule-catalog.schema.json',[catalog],f'{manifest.get("domainId")}:rule-catalog')
 local_rule_ids=set()
 for item in catalog.get('items',[]):
  rid=item.get('ruleId')
  if rid in local_rule_ids: errors.append(f'DUPLICATE_DOMAIN_RULE {manifest.get("domainId")}:{rid}')
  local_rule_ids.add(rid)
  if rid not in ids['rule']: errors.append(f'BROKEN_DOMAIN_RULE_REGISTRY {manifest.get("domainId")}:{rid}')
  rule_path=(catalog_path.parent/item.get('path','')).resolve()
  if not rule_path.exists(): errors.append(f'BROKEN_DOMAIN_RULE_PATH {manifest.get("domainId")}:{rid}->{item.get("path")}'); continue
  rule=load(rule_path)
  if not rule: continue
  validate_schema('rule.schema.json',[rule],f'{manifest.get("domainId")}:rule:{rid}')
  if rule.get('id')!=rid: errors.append(f'DOMAIN_RULE_ID_MISMATCH {manifest.get("domainId")}:{rid}')
  if rule.get('domainId')!=manifest.get('domainId'): errors.append(f'DOMAIN_RULE_OWNER_MISMATCH {rid}')
  if item.get('currentVersionId') not in {v.get('versionId') for v in rule.get('versions',[])}: errors.append(f'BROKEN_CURRENT_RULE_VERSION {rid}->{item.get("currentVersionId")}')
  for dep in rule.get('dependencies',[]):
   if dep not in ids['rule']: errors.append(f'BROKEN_RULE_DEPENDENCY {rid}->{dep}')
  for cid in rule.get('versions',[{}])[0].get('conceptIds',[]):
   if cid not in all_concept_ids: errors.append(f'BROKEN_RULE_CONCEPT {rid}->{cid}')
  for v in rule.get('versions',[]):
   for ref in v.get('sourcePinpoints',[]):
    if ref.get('sourceId') not in v.get('sourceIds',[]): errors.append(f'RULE_PINPOINT_SOURCE_NOT_DECLARED {rid}->{ref.get("sourceId")}')
   if 'formula' in v: errors.append(f'FORMULA_FORBIDDEN_IN_CANONICAL_RULE {rid}')
   expected=sha256({k:val for k,val in v.items() if k!='contentFingerprint'})
   if v.get('contentFingerprint')!=expected: errors.append(f'RULE_VERSION_FINGERPRINT_MISMATCH {v.get("versionId")}')
 if catalog.get('status')=='RULES_VALIDATED' and not local_rule_ids: errors.append(f'VALIDATED_RULE_CATALOG_EMPTY {manifest.get("domainId")}')

# formal separation-of-duties approval records
approval_env=load(ROOT/'governance'/'approvals.json') or {'items':[]}
approvals=approval_env.get('items',[])
validate_schema('approval-record.schema.json',approvals,'approval-records')
unique(approvals,'id','approval-record')
approval_by_entity={}
required_roles={'author','legalReviewer','technicalReviewer','approver'}
for approval in approvals:
 decisions=approval.get('decisions',[])
 roles={d.get('role') for d in decisions}; actors=[d.get('actor') for d in decisions]
 if roles!=required_roles: errors.append(f'APPROVAL_ROLES_INCOMPLETE {approval.get("id")}')
 if len(set(actors))!=len(actors): errors.append(f'APPROVAL_SEPARATION_OF_DUTIES_VIOLATION {approval.get("id")}')
 decisions_by_role={d.get('role'):d.get('decision') for d in decisions}
 if decisions_by_role.get('author')!='submitted': errors.append(f'APPROVAL_AUTHOR_MUST_SUBMIT {approval.get("id")}')
 for role in {'legalReviewer','technicalReviewer','approver'}:
  if decisions_by_role.get(role)!='approved': errors.append(f'APPROVAL_REVIEWER_MUST_APPROVE {approval.get("id")}:{role}')
 if not approval.get('reviewScope'): errors.append(f'APPROVAL_REVIEW_SCOPE_EMPTY {approval.get("id")}')
 key=(approval.get('entityType'),approval.get('entityId')); approval_by_entity[key]=approval
for entry in knowledge_index.get('items',[]):
 manifest_path=(ROOT/'knowledge'/entry['path']).resolve(); manifest=load(manifest_path)
 if not manifest: continue
 rule_rel=manifest.get('sections',{}).get('rules')
 if not rule_rel: continue
 catalog_path=(manifest_path.parent/rule_rel).resolve(); catalog=load(catalog_path)
 if not catalog: continue
 for item in catalog.get('items',[]):
  rp=(catalog_path.parent/item.get('path','')).resolve(); rule=load(rp)
  if not rule: continue
  for version in rule.get('versions',[]):
   if version.get('approvalStatus')=='LEGAL_APPROVED':
    approval=approval_by_entity.get(('rule-version',version.get('versionId')))
    if not approval: errors.append(f'APPROVED_VERSION_WITHOUT_SOD_RECORD {version.get("versionId")}')
    elif approval.get('contentFingerprint')!=version.get('contentFingerprint'): errors.append(f'APPROVAL_FINGERPRINT_MISMATCH {version.get("versionId")}')
for event in A:
 if event.get('action')=='activate' and event.get('entityType') in {'rule-version','projection','contract','schema','runtime','governance'}:
  if (event.get('entityType'),event.get('entityId')) not in approval_by_entity: errors.append(f'ACTIVATION_WITHOUT_SOD_APPROVAL {event.get("id")}')
stats['approvalRecords']=len(approvals)

# Sprint 5.6.6 federation, shared vocabulary and source coverage integrity
shared_vocab=load(ROOT/'knowledge'/'shared'/'vocabulary.json')
if shared_vocab:
 validate_schema('shared-vocabulary.schema.json',[shared_vocab],'shared-vocabulary')
 known_fact_ids={x.get('id') for x in (load(ROOT/'registries'/'facts.json') or {}).get('items',[])}
 for f in shared_vocab.get('facts',[]):
  if f.get('canonicalFactId') not in known_fact_ids: errors.append(f'SHARED_FACT_TARGET_MISSING {f.get("sharedFactId")}->{f.get("canonicalFactId")}')
fed_index=load(ROOT/'knowledge'/'federation'/'index.json') or {'items':[]}
fed_ids=set()
for item in fed_index.get('items',[]):
 path=(ROOT/'knowledge'/'federation'/item.get('path','')).resolve(); contract=load(path) if path.exists() else None
 if not contract: errors.append(f'BROKEN_FEDERATION_CONTRACT_PATH {item.get("contractId")}'); continue
 validate_schema('domain-federation-contract.schema.json',[contract],f'federation:{item.get("contractId")}')
 fed_ids.add(contract.get('id'))
 if contract.get('sourceDomainId') not in ids['domain'] or contract.get('targetDomainId') not in ids['domain']: errors.append(f'BROKEN_FEDERATION_DOMAIN {contract.get("id")}')
 for binding in contract.get('inputBindings',[]):
  if not shared_vocab or binding.get('sharedFactId') not in {x.get('sharedFactId') for x in shared_vocab.get('facts',[])}: errors.append(f'BROKEN_FEDERATION_SHARED_FACT {contract.get("id")}->{binding.get("sharedFactId")}')
for record in canonical_projection_records:
 for out in record.get('outputs',[]):
  if out.get('key')=='cross_domain_requirements':
   for fid in out.get('defaultValue',[]):
    if fid not in fed_ids: errors.append(f'BROKEN_CROSS_DOMAIN_CONTRACT {record.get("id")}->{fid}')
source_coverage=load(ROOT/'knowledge'/'domains'/'aviso-previo'/'rules'/'traceability'/'source-to-rules.json') or {}
mapped=set((source_coverage.get('items') or {}).keys()); excepted=set((source_coverage.get('coverageExceptions') or {}).keys())
for item in (load(ROOT/'knowledge'/'domains'/'aviso-previo'/'sources'/'index.json') or {}).get('items',[]):
 sid=item.get('sourceId'); rec=next((x for x in S if x.get('id')==sid),None)
 if rec and rec.get('status')=='verified':
  if not rec.get('checksum'): errors.append(f'VERIFIED_SOURCE_WITHOUT_CHECKSUM {sid}')
  if sid not in mapped and sid not in excepted: errors.append(f'UNACCOUNTED_VERIFIED_SOURCE {sid}')
registry_canonical={x.get('id'):x.get('contentFingerprint') for x in P if x.get('id','').startswith('PROJ-')}
for rec in canonical_projection_records:
 if registry_canonical.get(rec.get('id'))!=rec.get('contentFingerprint'): errors.append(f'GLOBAL_PROJECTION_REGISTRY_DESYNC {rec.get("id")}')
stats['federationContracts']=len(fed_ids)

# inventory placeholder warning
legacy=load(ROOT/'registries/legacy-rules.inventory.json') or {'items':[]}
placeholder_items=[x for x in legacy.get('items',[]) if x.get('legacySha256')=='43b26a971f055e5561706016757867b190d097d445045f0c96b108ebceb1f958']
allowed_dispositions={'PLANNED','DEPRECATED','MIGRATED'}
unclassified=[x.get('id') for x in placeholder_items if x.get('disposition') not in allowed_dispositions]
if unclassified: errors.append('LEGACY_PLACEHOLDER_UNCLASSIFIED '+','.join(sorted(unclassified)))
for item in placeholder_items:
 if item.get('disposition')=='PLANNED' and (item.get('canonical') or item.get('consumerReady')): errors.append(f'PLANNED_PLACEHOLDER_PROMOTED {item.get("id")}')
stats['legacyPlaceholders']=len(placeholder_items)
stats['classifiedLegacyPlaceholders']=len(placeholder_items)-len(unclassified)
legacy_projection_count=sum(1 for x in P if x.get('id','').startswith('PRJ-'))
registered_canonical_count=sum(1 for x in P if x.get('id','').startswith('PROJ-'))
stats.update({'checkedJsonFiles':sum(1 for _ in ROOT.rglob('*.json')),'domains':len(D),'sources':len(S),'rules':len(R),'legacyProjections':legacy_projection_count,'registeredCanonicalProjections':registered_canonical_count,'canonicalProjections':len(canonical_projection_records),'projections':len(canonical_projection_records)+legacy_projection_count,'dependencies':len(E),'consumers':len(C),'auditEvents':len(A),'ingestionBatches':len(batches.get('items',[])),'domainPackages':len(knowledge_index.get('items',[])),'concepts':concept_count})

# Phase E consolidation invariants
baseline=load(ROOT/'knowledge'/'domains'/'aviso-previo'/'governance'/'normative-baseline.json') or {}
if maturity_doc and baseline.get('metrics',{}).get('coveragePercent')==100:
 gate=next((g for g in maturity_doc.get('gates',[]) if g.get('id')=='NORMATIVE_COMPLETENESS'),None)
 if not gate or gate.get('status')!='PASS': errors.append('NORMATIVE_COMPLETENESS_BASELINE_MISMATCH')
 if not gate or 'governance/normative-baseline.json' not in gate.get('evidence',[]): errors.append('NORMATIVE_COMPLETENESS_BASELINE_EVIDENCE_MISSING')
for gate_id in ('LEGAL_REVIEW','CONSUMER_PROMOTION'):
 gate=next((g for g in (maturity_doc or {}).get('gates',[]) if g.get('id')==gate_id),None)
 if not gate or gate.get('status')!='PENDING': errors.append(f'UNSAFE_PHASE_E_GATE_{gate_id}')
manifest_doc=load(ROOT/'audit'/'manifest-sha256.generated.json') or {}
try:
 generated=datetime.fromisoformat(manifest_doc.get('generatedAt','').replace('Z','+00:00'))
 latest=datetime.fromisoformat('2026-07-24T00:30:00+00:00')
 if generated < latest: errors.append('MANIFEST_CHRONOLOGY_BEFORE_PHASE_E')
except Exception: errors.append('MANIFEST_GENERATED_AT_INVALID')
for rel in ('audit/phase-d-knowledge-consolidation.json','docs/sprint-5/phase-d-consolidation-correction-report.json','audit/phase-e-internal-consistency.json','docs/sprint-5/phase-e-consistency-correction-report.json'):
 evidence=load(ROOT/rel) or {}
 declared=(evidence.get('validation') or {}).get('manifest',{}).get('rootHash')
 if declared!=manifest_doc.get('rootHash'): errors.append(f'PHASE_EVIDENCE_MANIFEST_HASH_MISMATCH {rel}')
next_steps=(ROOT/'docs'/'NEXT-STEPS.md').read_text(encoding='utf-8')
for required in ('shadow validation','revisão jurídica formal','CONSUMER_PROMOTION'):
 if required.lower() not in next_steps.lower(): errors.append(f'NEXT_STEPS_MISSING_{required.upper().replace(" ","_")}')
for rel in ('migration/index.json','contracts/index.json','engines/index.json','engines/projection-runtime/index.json','schemas/index.json','knowledge/index.json','registries/index.json','governance/index.json','ontology/index.json','ingestion/index.json','validation/index.json'):
 idx=load(ROOT/rel) or {}
 if idx.get('packageVersion')!=RELEASE_VERSION: errors.append(f'INDEX_PACKAGE_VERSION_MISMATCH {rel}')
 if not (idx.get('componentVersion') or idx.get('catalogVersion')): errors.append(f'INDEX_EXPLICIT_VERSION_KIND_MISSING {rel}')
semantic_item=next((x for x in (load(ROOT/'schemas'/'index.json') or {}).get('items',[]) if x.get('path')=='./semantic-policy.schema.json'),None)
if not semantic_item or semantic_item.get('id')!='semantic-policy': errors.append('SEMANTIC_SCHEMA_ID_NOT_NORMALIZED')

report={'ok':not errors,'version':RELEASE_VERSION,'errors':errors,'warnings':warnings,'stats':stats,'readiness':{'platformReadyForControlledIngestion':not errors,'runtimeAuthority':bool(index and index.get('runtimeAuthority')),'legalKnowledgeLoaded':bool(S or R or P)}}
(ROOT/'validation'/'validation-report.generated.json').write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
print(json.dumps(report,indent=2,ensure_ascii=False))
sys.exit(0 if not errors else 1)
