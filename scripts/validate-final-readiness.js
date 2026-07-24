#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const failures=[], warnings=[];
const required=[
'data/core/update/central-brain-finalization.contract.json',
'docs/central-brain/architecture-overview.md',
'docs/central-brain/operations-manual.md',
'docs/central-brain/rule-update-manual.md',
'docs/central-brain/content-onboarding-manual.md',
'docs/central-brain/approval-publication-manual.md',
'docs/central-brain/rollback-incident-manual.md',
'data/core/update/responsibility-matrix.json',
'data/core/update/open-items-register.generated.json',
'data/core/update/final-readiness-report.generated.json'
];
for(const rel of required) if(!fs.existsSync(path.join(root,rel))) failures.push('MISSING:'+rel);
let readiness=null,open=null;
try{readiness=JSON.parse(fs.readFileSync(path.join(root,'data/core/update/final-readiness-report.generated.json'),'utf8'));}catch(e){failures.push('READINESS_INVALID_JSON');}
try{open=JSON.parse(fs.readFileSync(path.join(root,'data/core/update/open-items-register.generated.json'),'utf8'));}catch(e){failures.push('OPEN_ITEMS_INVALID_JSON');}
if(readiness){
 if(readiness.status!=='generated-read-only') failures.push('READINESS_NOT_READ_ONLY');
 if(readiness.decision?.readyForAutomaticMutation!==false) failures.push('AUTO_MUTATION_NOT_BLOCKED');
 if(readiness.decision?.readyForAutomaticPublication!==false) failures.push('AUTO_PUBLICATION_NOT_BLOCKED');
 if(readiness.decision?.readyForUnattendedProduction!==false) failures.push('UNATTENDED_PRODUCTION_NOT_BLOCKED');
 if(readiness.decision?.readyForGovernedManualUse!==true) failures.push('GOVERNED_MANUAL_USE_NOT_READY');
 if((readiness.score?.value||0)<80) failures.push('READINESS_SCORE_TOO_LOW');
}
if(open){
 if(open.status!=='generated-read-only') failures.push('OPEN_ITEMS_NOT_READ_ONLY');
 if(open.summary?.critical>0) failures.push('CRITICAL_OPEN_ITEMS_PRESENT');
 if(open.summary?.open>0) warnings.push('OPEN_OPERATIONAL_ITEMS:'+open.summary.open);
}
const result={status:failures.length?'FAIL':'PASS',failures,warnings,readinessScore:readiness?.score||null,openItems:open?.summary||null};
if(failures.length){console.error(JSON.stringify(result,null,2));process.exit(1);}
console.log(JSON.stringify(result,null,2));
