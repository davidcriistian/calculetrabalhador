#!/usr/bin/env node
"use strict";
const fs=require("fs"),path=require("path");
const root=path.resolve(__dirname,".."),f=path.join(root,"data/core/update/end-to-end-simulation-report.generated.json");
const failures=[]; let r;
try{r=JSON.parse(fs.readFileSync(f,"utf8"));}catch(e){failures.push("REPORT_INVALID");}
if(r){
 if(r.status!=="generated-read-only") failures.push("NOT_READ_ONLY");
 if(r.summary.failed!==0) failures.push("SCENARIO_FAILURES");
 for(const s of r.scenarios||[]){if(s.status!=="PASS") failures.push("SCENARIO_NOT_PASS:"+s.id);if(s.publicationGate!=="CLOSED") failures.push("GATE_OPEN:"+s.id);}
 const x=r.safety||{}; for(const k of ["sourceMutation","ruleMutation","articleMutation","publicMutation","commit","push","deploy","publication"]) if(x[k]!==false) failures.push("SAFETY:"+k);
 if(x.patchesApplied!==0) failures.push("PATCHES_APPLIED"); if(x.rollbackExecuted!==false) failures.push("ROLLBACK_EXECUTED");
}
console.log(JSON.stringify({status:failures.length?"FAIL":"PASS",failures,summary:r&&r.summary},null,2));process.exit(failures.length?1:0);
