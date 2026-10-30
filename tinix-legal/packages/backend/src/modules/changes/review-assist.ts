import type {Prisma,PrismaClient} from '@prisma/client';
import {contentSchema} from '../compliance/contracts.js';
type Db=PrismaClient|Prisma.TransactionClient;

// Gợi ý cho chuyên gia khi duyệt thay đổi luật, chỉ dựa trên dữ liệu đã thu thập (số hiệu, quan hệ, metadata).
// Không đọc toàn văn và không tự kết luận: mọi gợi ý đều phải được chuyên gia sửa/xác nhận trước khi duyệt.
const NUMBER=/\d{1,4}\/(?:\d{4}\/)?[A-ZĐ0-9]+(?:[-–][A-ZĐ0-9]+)*/gu;
export const normalizeNumber=(x:string)=>x.normalize('NFC').toUpperCase().replace(/\s+/g,'').replace(/–/g,'-');
export function candidateNumbers(c:{title:string,diffJson:unknown}){
 const d=(c.diffJson??{}) as any,found=new Set<string>();
 for(const x of [...(Array.isArray(d.relations)?d.relations:[]),d.metadata?.['Số ký hiệu'],...(c.title.normalize('NFC').match(NUMBER)??[])])if(typeof x==='string'&&x.trim())found.add(normalizeNumber(x));
 return found;
}
function metadataDate(d:any){
 for(const [k,v] of Object.entries(d?.metadata??{}))if(/hiệu lực/iu.test(k)&&typeof v==='string'){const m=v.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);if(m)return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;}
 return null;
}
export type CitationIndex={releaseId:string|null,versions:{versionId:string,obligationId:string,title:string,numbers:string[]}[]};
// One query set per request: the latest sealed release and the document numbers each of its obligations cites.
export async function citationIndex(db:Db):Promise<CitationIndex>{
 const release=await db.catalogueRelease.findFirst({where:{sealedAt:{not:null}},orderBy:[{publishedAt:'desc'},{id:'desc'}],include:{items:{include:{version:{include:{citations:{select:{documentId:true}}}}}}}});
 if(!release)return {releaseId:null,versions:[]};
 const ids=[...new Set(release.items.flatMap(i=>i.version.citations.map(c=>c.documentId)))];
 const docs=new Map((await db.canonicalDocument.findMany({where:{id:{in:ids}},select:{id:true,documentNumber:true}})).map(d=>[d.id,normalizeNumber(d.documentNumber??'')]));
 return {releaseId:release.id,versions:release.items.map(i=>({versionId:i.versionId,obligationId:i.version.obligationId,title:contentSchema.parse(i.version.contentJson).title,numbers:[...new Set(i.version.citations.map(c=>docs.get(c.documentId)).filter((x):x is string=>Boolean(x)))]}))};
}
export function matchCandidate(index:CitationIndex,c:{title:string,diffJson:unknown}){
 const numbers=candidateNumbers(c);
 return index.versions.map(v=>({...v,matched:v.numbers.filter(n=>numbers.has(n))})).filter(v=>v.matched.length).map(({versionId,obligationId,title,matched})=>({versionId,obligationId,title,documentNumbers:matched}));
}
export function suggestReview(index:CitationIndex,c:{title:string,diffJson:unknown}){
 const d=(c.diffJson??{}) as any,meta=d.metadata??{},matches=matchCandidate(index,c);
 const docs=[...new Set(matches.flatMap(m=>m.documentNumbers))],titles=matches.map(m=>`“${m.title}”`);
 const head=[meta['Loại văn bản'],meta['Số ký hiệu']].filter(Boolean).join(' ')||c.title;
 const issued=[meta['Cơ quan ban hành'],meta['Ngày ban hành']?'ban hành '+meta['Ngày ban hành']:''].filter(Boolean).join(', ');
 return {
  basis:'METADATA_ONLY' as const,releaseId:index.releaseId,matches,versionIds:matches.map(m=>m.versionId),effectiveDate:metadataDate(d),
  whatChanged:`${head}${issued?` (${issued})`:''}: ${c.title}. Cần đọc bản gốc để ghi rõ điều, khoản thay đổi.`,
  why:matches.length?`Văn bản liên quan tới ${docs.join(', ')}, là căn cứ của ${titles.join(', ')} trong bộ checklist đang áp dụng.`:'',
  action:matches.length?`Rà soát lại ${titles.join(', ')} theo văn bản mới; cập nhật hồ sơ, quy trình nội bộ nếu nội dung áp dụng thay đổi.`:''
 };
}
// Status of the obligation drafts opened from a change: ready once every one is published in the latest release.
export async function workflowStatus(db:Db,c:{stage:string,workflowJson:unknown},index:CitationIndex){
 if(c.stage!=='OBLIGATION_UPDATE')return null;
 const w=(c.workflowJson??{}) as {obligationIds?:string[],draftVersionIds?:string[]},obligationIds=w.obligationIds??[];
 const versions=await db.obligationVersion.findMany({where:{obligationId:{in:obligationIds}},orderBy:{version:'desc'},select:{id:true,obligationId:true,version:true,status:true,contentJson:true}});
 const items=obligationIds.map(id=>{const latest=versions.find(v=>v.obligationId===id),draft=versions.find(v=>w.draftVersionIds?.includes(v.id)&&v.obligationId===id);
  const released=index.versions.find(v=>v.obligationId===id);
  return {obligationId:id,title:(latest?.contentJson as any)?.title??id,draftVersionId:draft?.id??null,draftStatus:draft?.status??null,latestStatus:latest?.status??null,releasedVersionId:released?.versionId??null,ready:Boolean(draft&&draft.status==='PUBLISHED'&&released?.versionId===draft.id)};});
 return {note:(w as any).note??'',items,ready:items.length>0&&items.every(i=>i.ready)};
}
