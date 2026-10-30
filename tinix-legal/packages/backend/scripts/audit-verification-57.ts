import {PrismaClient} from '@prisma/client';
import {loadConfig} from '../src/modules/operations/config.js';
import {CHECKLIST_PROFILE_FACTS,evaluate} from '@limi/compliance-core';
import {mkdir,writeFile} from 'node:fs/promises';
const db=new PrismaClient({datasources:{db:{url:loadConfig().databaseUrl}}});
try{
 const companies=await db.workspaceCompany.findMany();const output=[];
 for(const c of companies){
  const tasks=await db.complianceTask.findMany({where:{companyId:c.id,applicability:'NEEDS_INFORMATION',status:{notIn:['DONE','NOT_APPLICABLE']}},include:{basis:true},orderBy:{title:'asc'}});
  const facts=c.factsJson as any,profile=c.profileJson as any;
  const context={facts:{...facts,province:{value:profile.province||null,status:profile.province?'USER_CONFIRMED':'UNKNOWN'}},dates:{founded:profile.founded||undefined}} as any;
  const rows=tasks.map(t=>{const content=t.basis.contentJson as any;return {id:t.id,title:t.title,group:content.group,rule:content.rule,missing:t.missingFacts,explanation:t.explanation,current:evaluate(content.rule,context),deadline:content.deadline};});
  const counts:Record<string,number>={};for(const r of rows)for(const f of r.missing as string[])counts[f]=(counts[f]||0)+1;
  output.push({companyId:c.id,profileVersion:c.version,profile:{type:profile.type,founded:profile.founded},known:Object.fromEntries(Object.entries(facts).filter(([,v])=>(v as any).status!=='UNKNOWN'&&(v as any).value!=null)),counts,rows,definitions:CHECKLIST_PROFILE_FACTS.filter(f=>Object.keys(counts).includes(f.key))});
 }
 await mkdir('../../../outputs/LIMI_VERIFICATION_57_20261026',{recursive:true});await writeFile('../../../outputs/LIMI_VERIFICATION_57_20261026/before.json',JSON.stringify(output,null,2));
 for(const c of output){console.log(JSON.stringify({companyId:c.companyId,profile:c.profile,known:c.known,counts:c.counts}));for(const r of c.rows)console.log(JSON.stringify(r));}
}finally{await db.$disconnect();}
