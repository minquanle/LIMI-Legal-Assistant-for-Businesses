import {PrismaClient} from '@prisma/client';
import {loadConfig} from '../src/modules/operations/config.js';
import {publishApprovedCatalogue} from '../src/modules/compliance/catalogue.js';
import {enqueueEvaluation} from '../src/modules/compliance/evaluation.js';
const config=loadConfig(),db=new PrismaClient({datasources:{db:{url:config.databaseUrl}}});
try{const result=await db.$transaction(async tx=>{
 const reviewer=await tx.obligationReview.findFirst({where:{decision:'APPROVE'},orderBy:{createdAt:'desc'}});if(!reviewer)return {approved:0,companies:0};
 const release=await publishApprovedCatalogue(tx,reviewer.reviewerId);if(!release)return {approved:0,companies:0};
 const companies=await tx.workspaceCompany.findMany({select:{id:true}});for(const c of companies)await enqueueEvaluation(tx,c.id,reviewer.reviewerId,undefined,release.id);
 return {releaseId:release.id,companies:companies.length};
},{timeout:60000});console.log(JSON.stringify(result));}finally{await db.$disconnect();}
