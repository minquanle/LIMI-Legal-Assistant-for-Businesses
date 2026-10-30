import type {Prisma,PrismaClient} from '@prisma/client';
import {z} from 'zod';
import {recheckWatchset} from './watch.js';
type Db=PrismaClient|Prisma.TransactionClient;

// Thiết lập thu thập văn bản mới do người duyệt điều chỉnh trên CMS ("Luật mới").
// Tắt là dừng hẳn: scheduler không gửi yêu cầu nào tới nguồn khi enabled=false.
export const INTERVAL_OPTIONS=[1,3,24] as const;
export const MAX_PER_RUN_OPTIONS=[10,20,50,100] as const;
const LABELS:Record<string,string>={'vanban.chinhphu.vn':'Hệ thống văn bản Chính phủ','congbao.chinhphu.vn':'Công báo Chính phủ','vbpl.vn':'Cơ sở dữ liệu quốc gia về văn bản pháp luật'};
// Local sources were removed from the product (Hưng Yên); they stay stored but are never offered or enabled.
const hidden=(url:string)=>/hungyen/i.test(url);
export const sourceLabel=(url:string)=>{const host=new URL(url).hostname;return LABELS[host]??host;};

export const discoveryInput=z.object({
 enabled:z.boolean(),
 sources:z.array(z.string().url()).max(20),
 intervalHours:z.union([z.literal(1),z.literal(3),z.literal(24)]),
 maxPerRun:z.union([z.literal(10),z.literal(20),z.literal(50),z.literal(100)]),
 effectiveFrom:z.string().date().nullable()
}).strict();

export async function getDiscoverySettings(db:Db){return db.lawDiscoverySetting.upsert({where:{id:'default'},create:{id:'default'},update:{}});}
export async function discoverySources(db:Db){return (await db.sourceWatch.findMany({where:{mode:'DISCOVERY'},orderBy:{url:'asc'}})).filter(w=>!hidden(w.url));}

// Reads "dd/mm/yyyy" or "dd-mm-yyyy" as printed on official pages; anything else is unknown, never guessed.
export function parseVnDate(value:unknown){const m=typeof value==='string'?value.trim().match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/):null;if(!m)return null;const iso=`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;return Number.isNaN(Date.parse(iso+'T00:00:00Z'))?null:iso;}
// Keep a new document when its effective date is on/after the threshold. Without an effective date,
// fall back to the issue date only in the safe direction (issued on/after ⇒ cannot take effect before);
// with no usable date the document is kept so nothing relevant is silently dropped.
export function passesEffectiveFrom(metadata:Record<string,string>|undefined,from:string|null){
 if(!from)return {keep:true,basis:'none' as const,date:null};
 const pick=(re:RegExp)=>{for(const [k,v] of Object.entries(metadata??{}))if(re.test(k)){const d=parseVnDate(v);if(d)return d;}return null;};
 const effective=pick(/hiệu lực/iu);if(effective)return {keep:effective>=from,basis:'effective' as const,date:effective};
 const issued=pick(/ban hành/iu);if(issued&&issued>=from)return {keep:true,basis:'issued' as const,date:issued};
 return {keep:true,basis:'unknown' as const,date:issued};
}

// Mirrors the saved settings onto the discovery watches; a newly enabled source is checked right away.
export async function applyDiscoverySettings(tx:Prisma.TransactionClient,s:{enabled:boolean,sources:unknown,intervalHours:number}){
 const selected=new Set(Array.isArray(s.sources)?s.sources as string[]:[]);
 for(const w of await tx.sourceWatch.findMany({where:{mode:'DISCOVERY'}})){
  const enabled=s.enabled&&!hidden(w.url)&&selected.has(w.url);
  await tx.sourceWatch.update({where:{id:w.id},data:{enabled,intervalHours:s.intervalHours,...(enabled&&!w.enabled?{nextCheckAt:new Date()}:{})}});
 }
}

export async function runLawDiscovery(db:PrismaClient){
 const s=await getDiscoverySettings(db);if(!s.enabled)return false;
 await recheckWatchset(db);return true;
}

export async function discoveryStatus(db:PrismaClient){
 const settings=await getDiscoverySettings(db),sources=await discoverySources(db),selected=new Set(Array.isArray(settings.sources)?settings.sources as string[]:[]);
 const since7=new Date(Date.now()-7*86400000),since24=new Date(Date.now()-86400000);
 const [new24,new7,recent,skipped7]=await Promise.all([
  db.lawChangeCandidate.count({where:{kind:'NEW_DOCUMENT',createdAt:{gte:since24}}}),
  db.lawChangeCandidate.count({where:{kind:'NEW_DOCUMENT',createdAt:{gte:since7}}}),
  db.lawChangeCandidate.findMany({where:{kind:'NEW_DOCUMENT'},orderBy:{createdAt:'desc'},take:10,select:{id:true,title:true,status:true,createdAt:true,diffJson:true}}),
  db.sourceWatch.count({where:{lastError:'BEFORE_EFFECTIVE_FROM',lastSuccessAt:{gte:since7}}}),
 ]);
 const runs=sources.map(w=>w.lastSuccessAt).filter((d):d is Date=>Boolean(d)).sort((a,b)=>b.getTime()-a.getTime());
 const next=sources.filter(w=>w.enabled).map(w=>w.nextCheckAt).sort((a,b)=>a.getTime()-b.getTime());
 return {
  settings:{enabled:settings.enabled,sources:[...selected].filter(u=>sources.some(w=>w.url===u)),intervalHours:settings.intervalHours,maxPerRun:settings.maxPerRun,effectiveFrom:settings.effectiveFrom?settings.effectiveFrom.toISOString().slice(0,10):null,updatedAt:settings.updatedAt},
  options:{intervalHours:INTERVAL_OPTIONS,maxPerRun:MAX_PER_RUN_OPTIONS},
  sources:sources.map(w=>({url:w.url,label:sourceLabel(w.url),domain:w.domain,selected:selected.has(w.url),enabled:w.enabled,lastSuccessAt:w.lastSuccessAt,lastError:w.lastError,nextCheckAt:w.enabled?w.nextCheckAt:null})),
  stats:{new24h:new24,new7d:new7,skippedByDate7d:skipped7,lastRunAt:runs[0]??null,nextRunAt:settings.enabled?next[0]??null:null},
  recent:recent.map(c=>{const meta=(c.diffJson as any)?.metadata??{};return {id:c.id,title:c.title,status:c.status,createdAt:c.createdAt,number:meta['Số ký hiệu']??null,issued:Object.entries(meta).find(([k])=>/ban hành/iu.test(k))?.[1]??null};})
 };
}
