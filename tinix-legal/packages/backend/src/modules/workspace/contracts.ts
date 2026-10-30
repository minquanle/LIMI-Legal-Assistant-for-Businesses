import {z} from 'zod';
import {CHECKLIST_PROFILE_FACTS} from '@limi/compliance-core';
const checklistFactShape:Record<string,z.ZodTypeAny>=Object.fromEntries(CHECKLIST_PROFILE_FACTS.map(f=>[f.key,f.kind==='date'?z.string().date().refine(v=>!f.key.endsWith('PeriodEndDate')||Number(v.slice(8,10))===new Date(Date.UTC(Number(v.slice(0,4)),Number(v.slice(5,7)),0)).getUTCDate(),'Must be the last day of the reporting month').nullable().default(null):z.enum(['unknown',...f.options!.map(o=>o[0])] as [string,...string[]]).nullable().default(null)]));
export const email=z.string().trim().toLowerCase().email().max(254);
export const password=z.string().min(12).max(128);
const text=z.string().trim().max(2000);
export const taxId=z.string().regex(/^\d{10}(?:-?\d{3})?$/).transform(x=>x.length===13?`${x.slice(0,10)}-${x.slice(10)}`:x);
export const factsSchema=z.object({
  ...checklistFactShape,
  stage:z.enum(['unknown','new','running','changing','paused']).default('unknown'),
  employees:z.enum(['unknown','0','1-9','10-49','50-99','100+']).default('unknown'),
  employeeCount:z.number().int().min(0).max(10000000).nullable().default(null),
  activity:z.array(z.enum(['goods','services','manufacturing','digital'])).max(4).nullable().default(null),
  channels:z.array(z.enum(['direct','marketplace','social','website'])).max(4).nullable().default(null),
  places:z.array(z.enum(['office','store','warehouse','factory'])).max(4).nullable().default(null),
  signals:z.array(z.enum(['invoice','customerData','notary','regulated','smallEnterprise','copyrightAssets','digitalPublishing','foreign','crossborder','ads'])).max(10).nullable().default(null),
}).strict();
export const profileSchema=z.object({name:text.min(1).max(250),taxId,shortName:text.default(''),internationalName:text.default(''),address:text.default(''),province:text.default(''),
  type:text.default(''),founded:z.union([z.literal(''),z.string().date()]).default(''),registered:text.default(''),status:text.default(''),
  topics:z.array(z.enum(['tax','labor','commerce','company','investment','fire','data','licence'])).max(8).default([]),
}).strict();
export const companyInput=z.object({organizationId:z.string().uuid(),profile:profileSchema,facts:factsSchema,registryObservationId:z.string().uuid().optional()}).strict();
export const profileInput=z.object({expectedVersion:z.number().int().positive(),profile:profileSchema,facts:factsSchema}).strict();
export const siteSchema=z.object({name:text.min(1).max(250),kind:z.enum(['office','store','warehouse','factory']),address:text.min(1),province:text.min(1).max(100)}).strict();
export const eventSchema=z.object({type:z.enum(['FOUNDED','HIRED','SITE_OPENED','WEBSITE_STARTED','SUSPENDED','RESUMED','DISSOLUTION_STARTED','OTHER']),occurredOn:z.string().date(),note:text.min(1)}).strict();
export function confirmedFacts(facts:z.infer<typeof factsSchema>,actorId:string,previous:Record<string,any>={}){
  return Object.fromEntries(Object.entries(facts).map(([key,input])=>{
    const value=input==='unknown'?null:input,status=value===null?'UNKNOWN':'USER_CONFIRMED';
    if(previous[key]?.status===status&&JSON.stringify(previous[key].value)===JSON.stringify(value))return [key,previous[key]];
    return [key,{value,status,actorId,confirmedAt:status==='UNKNOWN'?null:new Date().toISOString()}];
  }));
}
