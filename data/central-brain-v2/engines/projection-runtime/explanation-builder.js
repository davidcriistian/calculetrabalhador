'use strict';
function buildExplanation(projection, ruleTrace, usedFacts, steps=[]){
  return {
    summary: projection.explanation?.summaryTemplate||projection.purpose,
    legalBasis: ruleTrace.filter(x=>x.decision==='selected').map(x=>({ruleId:x.id,versionId:x.versionId,sourceIds:x.details?.sourceIds||[]})),
    factBasis:[...usedFacts].sort(),
    limitations:projection.explanation?.publicLimitations||[],
    humanReadableSteps:steps
  };
}
module.exports={buildExplanation};
