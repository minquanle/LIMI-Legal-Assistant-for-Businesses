import {PrismaClient} from '@prisma/client';
import {CHECKLIST_PROFILE_FACTS} from '@limi/compliance-core';
import {writeFile} from 'node:fs/promises';
import {loadConfig} from '../src/modules/operations/config.js';
const db=new PrismaClient({datasources:{db:{url:loadConfig().databaseUrl}}});
function facts(rule:any):string[]{return rule?.fact?[rule.fact]:rule?.not?facts(rule.not):[...(rule?.all??rule?.any??[])].flatMap(facts);}
try{
 const rows=await db.obligationVersion.findMany({where:{status:{in:['DRAFT','IN_REVIEW','PUBLISHED']}},include:{citations:{select:{documentId:true,provisionId:true}}},orderBy:[{obligationId:'asc'},{version:'desc'}]});
 const items=rows.map(v=>{const c=v.contentJson as any,keys=facts(c.rule),legalQuestions=keys.filter(k=>CHECKLIST_PROFILE_FACTS.find(f=>f.key===k)?.tier==='LEGAL_CONCLUSION'),deprecated=keys.filter(k=>CHECKLIST_PROFILE_FACTS.find(f=>f.key===k)?.deprecated);
 return {versionId:v.id,status:v.status,title:c.title,group:c.group,deadline:c.deadline,legalQuestions,deprecated,stepsWithoutSpecificCitation:(c.guide?.steps??c.steps.map(()=>({provisionIds:[]}))).filter((s:any)=>!s.provisionIds?.length).length,deadlineReview:c.deadline.kind==='NONE'?'Confirm whether this is a procedure check without a calculated deadline; no legal deadline has been invented.':null,citations:v.citations};});
 const report={createdAt:new Date().toISOString(),automaticLegalApproval:false,derivedRulesRequireExpertReview:true,workingCalendarRequiresExpertReview:true,items};
 await writeFile(process.argv[2]??'review-readiness.json',JSON.stringify(report,null,2));console.log(JSON.stringify({items:items.length,legalQuestionVersions:items.filter(i=>i.legalQuestions.length).length,deprecatedRuleVersions:items.filter(i=>i.deprecated.length).length}));
}finally{await db.$disconnect();}
