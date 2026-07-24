#!/usr/bin/env node
"use strict";
const fs=require("fs"),path=require("path");
const root=path.resolve(__dirname,"..");
const f=path.join(root,"data/core/update/end-to-end-simulation-report.generated.json");
const r=JSON.parse(fs.readFileSync(f,"utf8"));
console.log(JSON.stringify({status:r.summary.failed?"FAIL":"PASS",summary:r.summary,output:"/data/core/update/end-to-end-simulation-report.generated.json"},null,2));
process.exit(r.summary.failed?1:0);
