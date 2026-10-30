import {PrismaClient} from '@prisma/client';
import {loadConfig} from '../src/modules/operations/config.js';
import {enqueueEvaluation,processEvaluation} from '../src/modules/compliance/evaluation.js';
import {localDate} from '@limi/compliance-core';
import {writeFile} from 'node:fs/promises';
const config=loadConfig(),db=new PrismaClient({datasources:{db:{url:config.databaseUrl}}});
try{
 const companies=await db.workspaceCompany.findMany(),results=[];
 for(const company of companies){
  if(!await db.catalogueRelease.count({where:{sealedAt:{not:null}}}))continue;
  const evaluation=await db.$transaction(tx=>enqueueEvaluation(tx,company.id,'local-operator:prototype-scope-refresh',localDate()));
  await processEvaluation(db,evaluation.id);
  const tasks=await db.complianceTask.findMany({where:{companyId:company.id}});
  results.push({companyId:company.id,evaluationId:evaluation.id,profileVersion:company.version,tasks:tasks.length,needsExactHeadcount:tasks.filter(t=>t.applicability==='NEEDS_INFORMATION'&&(t.missingFacts as string[]).includes('employeeCount')).length});
 }
 const report={status:'passed',asOfDate:localDate(),operation:'Reevaluate current profiles with existing approved catalogue; preserve closed tasks and user progress',results};
 await writeFile('../../../outputs/DETAILED_CHECKLIST_20261013/live-scope-refresh.json',JSON.stringify(report,null,2));
 console.log(JSON.stringify(report));
}finally{await db.$disconnect();}
