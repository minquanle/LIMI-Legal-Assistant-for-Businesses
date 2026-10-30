import type { Prisma } from '@prisma/client';
import type { CuratedRecord } from './curated-record.schema.js';
export function mapCanonical(record:CuratedRecord):Prisma.CanonicalDocumentUncheckedCreateInput {
  const text=(key:string)=>typeof record[key]==='string'?record[key] as string:'';
  const date=(key:string)=>record[key]?new Date(`${record[key]}T00:00:00Z`):null;
  return {documentNumber:record.documentNumber,normalizedNumber:record.normalizedNumber,documentType:record.documentType,
    title:record.title,issuingBody:record.issuingBody??'',issuingBodyCode:text('issuingBodyCode'),signer:text('signer'),
    promulgationDate:date('promulgationDate'),effectiveDate:date('effectiveDate'),expiryDate:date('expiryDate'),
    validityStatus:record.validityStatus,preciseValidityStatus:text('preciseValidityStatus'),field:text('field'),trichYeu:text('trichYeu'),
    scope:record.scope==='HUNG_YEN'?'HUNG_YEN':'NATIONAL',groupCode:record.group,reviewStatus:'PENDING',
    qualityJson:{requiresOcrTextReview:record.parseQuality.requiresOcrTextReview===true,readyForAutomaticChecklist:false}};
}
// Never forward paths, raw object keys or operational fields into public provenance.
export function publicProvenance(value:unknown):Prisma.InputJsonValue {
  if(value instanceof Date)return value.toISOString();
  if(Array.isArray(value))return value.map(publicProvenance);
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([k])=>!/(path|paths)$/i.test(k)&&!/(password|secret|credential|token)/i.test(k)&&!['rawObjectKey','objectKey','bucket'].includes(k)).map(([k,v])=>[k,publicProvenance(v)]));
  return (value??null) as Prisma.InputJsonValue;
}
