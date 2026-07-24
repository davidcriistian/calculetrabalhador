'use strict';
const path=require('path');
const {validateFile}=require('./schema-validator');
function validateResult(result,brainRoot){
  const root=brainRoot||path.resolve(__dirname,'../..');
  const check=validateFile(result,path.join(root,'schemas/projection-result.schema.json'));
  if(result.status==='resolved'&&Array.isArray(result.missingFacts)&&result.missingFacts.length)check.errors.push('$.missingFacts: resultado resolvido não pode conter fatos obrigatórios ausentes');
  check.valid=check.errors.length===0;
  return check;
}
module.exports={validateResult};
