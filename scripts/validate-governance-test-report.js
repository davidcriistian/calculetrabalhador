#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const reportFile=path.join(root,'data/core/update/governance-test-report.generated.json');
const matrixFile=path.join(root,'data/core/update/governance-test-matrix.json');
const failures=[];
if (!fs.existsSync(reportFile)) failures.push('TEST_REPORT_MISSING');
if (!fs.existsSync(matrixFile)) failures.push('TEST_MATRIX_MISSING');
let report=null,matrix=null;
try { if (fs.existsSync(reportFile)) report=JSON.parse(fs.readFileSync(reportFile,'utf8')); } catch(e){ failures.push('TEST_REPORT_INVALID_JSON'); }
try { if (fs.existsSync(matrixFile)) matrix=JSON.parse(fs.readFileSync(matrixFile,'utf8')); } catch(e){ failures.push('TEST_MATRIX_INVALID_JSON'); }
if (report) {
  if (report.status!=='generated-read-only') failures.push('TEST_REPORT_NOT_READ_ONLY');
  if (!report.summary || report.summary.failed!==0) failures.push(`TEST_FAILURES_PRESENT:${report.summary?.failed}`);
  if (!report.safety || report.safety.sourceRulesModified!==false) failures.push('RULE_MUTATION_FLAG_INVALID');
  if (!report.safety || report.safety.publicFilesModified!==false) failures.push('PUBLIC_MUTATION_FLAG_INVALID');
  if (report.safety && (report.safety.commit||report.safety.push||report.safety.deploy||report.safety.publication)) failures.push('FORBIDDEN_OPERATION_FLAG');
}
if (report && matrix) {
  const expected=new Set((matrix.scenarios||[]).map(x=>x.id));
  const actual=new Map((report.results||[]).map(x=>[x.id,x.status]));
  for (const id of expected) {
    if (!actual.has(id)) failures.push(`MISSING_TEST_RESULT:${id}`);
    else if (actual.get(id)!=='PASS') failures.push(`TEST_NOT_PASS:${id}:${actual.get(id)}`);
  }
  for (const id of actual.keys()) if (!expected.has(id)) failures.push(`UNDECLARED_TEST_RESULT:${id}`);
}
const result={status:failures.length?'FAIL':'PASS',failures,summary:report?.summary||null};
if (failures.length){console.error(JSON.stringify(result,null,2));process.exit(1);}
console.log(JSON.stringify(result,null,2));
