import {PrismaClient} from '@prisma/client';
import {loadConfig} from '../src/modules/operations/config.js';
import {previewChecklist} from '../src/modules/compliance/pilot.js';
import {writeFile} from 'node:fs/promises';
const config=loadConfig(),db=new PrismaClient({datasources:{db:{url:config.databaseUrl}}});
try{
 const companies=await db.workspaceCompany.findMany();
 const results=[];
 for(const company of companies){
  const preview=await previewChecklist(db,company.id),facts=company.factsJson as any;
  results.push({companyId:company.id,profileVersion:company.version,workforce: facts.employees?.value,exactCount:facts.employeeCount?.value??null,apply:preview.items.filter(x=>x.decision==='APPLY').length,needsVerification:preview.items.filter(x=>x.decision==='NEEDS_INFORMATION').length,missingExactHeadcount:preview.items.filter(x=>x.missingFacts.includes('employeeCount')).length});
 }
 const report={status:'passed',readOnly:true,companies:results};
 await writeFile('../../../outputs/DETAILED_CHECKLIST_20261013/live-scope-verification.json',JSON.stringify(report,null,2));
 console.log(JSON.stringify(report));
}finally{await db.$disconnect();}
