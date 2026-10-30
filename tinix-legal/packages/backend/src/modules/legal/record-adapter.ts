import { createHash, randomUUID } from 'node:crypto';
import type { ASTNodeType } from '@prisma/client';
export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
type RecordValue = Record<string, unknown>;
const metadataFields = ['documentNumber','normalizedNumber','documentType','title','issuingBody','issuingBodyCode','signer',
  'promulgationDate','effectiveDate','expiryDate','validityStatus','preciseValidityStatus','field','gazetteNumber','gazetteDate',
  'isConsolidated','isTranslation','trichYeu','author','language','scope','group','familyIds','keywords','legalBasis','observedValidity','metadataNotes'] as const;
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (typeof value === 'object' && value && Object.getPrototypeOf(value) === Object.prototype) {
    return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${canonicalJson((value as RecordValue)[key])}`).join(',')}}`;
  }
  throw new Error('INVALID_JSON_VALUE');
}
export const sha256 = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
export function businessMetadata(record: RecordValue): { [key: string]: Json } {
  const metadata: { [key: string]: Json } = {};
  for (const key of metadataFields) {
    const value = record[key] ?? null;
    // Reject non-JSON data; do not coerce unknown dates, nulls or booleans.
    metadata[key] = JSON.parse(canonicalJson(value)) as Json;
  }
  for (const key of ['promulgationDate','effectiveDate','expiryDate','gazetteDate']) {
    const date = metadata[key];
    if (date !== null && (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)
      || !Number.isFinite(Date.parse(`${date}T00:00:00Z`)) || new Date(`${date}T00:00:00Z`).toISOString().slice(0,10)!==date)) throw new Error(`INVALID_DATE:${key}`);
  }
  return metadata;
}
function object(value: unknown, code: string): RecordValue {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(code);
  return value as RecordValue;
}
function compact(value: unknown): Json {
  if (Array.isArray(value)) return value.map(compact);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).filter(([key])=>!['content','headerText'].includes(key)).map(([key,item])=>[key,compact(item)]));
  return JSON.parse(canonicalJson(value)) as Json;
}
export interface ProvisionInput {
  id: string; parentId: string | null; externalNodeId: string; nodeType: ASTNodeType; ordinal: string | null;
  heading: string | null; spanStart: number; spanEnd: number; orderIndex: number; depth: number;
  contextJson: Json; quotedAmendmentCandidate: boolean;
}
export function prepareParse(fullText: string, structure: unknown) {
  const structured = object(structure,'INVALID_STRUCTURE');
  if (structured.offsetUnit !== 'UNICODE_CODE_POINT') throw new Error('UNSUPPORTED_OFFSET_UNIT');
  const textLength = Array.from(fullText).length;
  const externalIds = new Set<string>();
  const provisions: ProvisionInput[] = [];
  const types = new Set(['PHAN','CHUONG','MUC','DIEU','KHOAN','DIEM','PHU_LUC','TEXT']);
  const visit = (value: unknown, parent: ProvisionInput | null) => {
    const node = object(value,'INVALID_PROVISION');
    if (typeof node.id!=='string' || !node.id.trim() || externalIds.has(node.id)) throw new Error('INVALID_OR_DUPLICATE_NODE_ID');
    if (typeof node.nodeType!=='string' || !types.has(node.nodeType)) throw new Error('INVALID_NODE_TYPE');
    const span = object(node.span,'INVALID_SPAN');
    if (!Number.isInteger(span.start) || !Number.isInteger(span.end)) throw new Error('INVALID_SPAN');
    const start = span.start as number, end = span.end as number;
    if (start<0 || end<start || end>textLength || (parent && (start<parent.spanStart || end>parent.spanEnd))) throw new Error('SPAN_OUT_OF_RANGE');
    if (node.quotedAmendmentCandidate!==undefined && typeof node.quotedAmendmentCandidate!=='boolean') throw new Error('INVALID_QUOTED_FLAG');
    for (const key of ['ordinal','heading']) if (node[key]!=null && typeof node[key]!=='string') throw new Error(`INVALID_NODE_${key}`);
    externalIds.add(node.id);
    const mapped: ProvisionInput = {id:randomUUID(),parentId:parent?.id??null,externalNodeId:node.id,nodeType:node.nodeType as ASTNodeType,
      ordinal:node.ordinal as string??null,heading:node.heading as string??null,spanStart:start,spanEnd:end,
      orderIndex:provisions.length,depth:parent?parent.depth+1:0,contextJson:compact(node.context??[]),
      quotedAmendmentCandidate: (node.quotedAmendmentCandidate as boolean | undefined) ?? parent?.quotedAmendmentCandidate ?? false};
    provisions.push(mapped);
    if (node.children !== undefined && !Array.isArray(node.children)) throw new Error('INVALID_CHILDREN');
    for (const child of (node.children??[]) as unknown[]) visit(child,mapped);
  };
  const compacted: {[key:string]:Json} = {offsetUnit:'UNICODE_CODE_POINT'};
  for (const key of ['sections','articles','appendices']) {
    if (!Array.isArray(structured[key])) throw new Error(`INVALID_STRUCTURE_${key}`);
    for (const node of structured[key] as unknown[]) visit(node,null);
    compacted[key]=compact(structured[key]);
  }
  for (const key of ['tableOfContents','warnings','parserVersion']) if (structured[key]!==undefined) compacted[key]=compact(structured[key]);
  return {provisions,structureJson:compacted,structureHash:sha256(canonicalJson(compacted)),offsetUnit:'UNICODE_CODE_POINT'};
}
export function provisionText(fullText: string, start: number, end: number): string {
  const points=Array.from(fullText);
  if (!Number.isInteger(start)||!Number.isInteger(end)||start<0||end<start||end>points.length) throw new Error('SPAN_OUT_OF_RANGE');
  return points.slice(start,end).join('');
}
export function snapshotHashes(record: RecordValue) {
  if (typeof record.fullText!=='string' || !record.fullText.trim() || record.fullText.trim()==='Error!') throw new Error('INVALID_FULL_TEXT');
  const contentHash=sha256(record.fullText);
  if (record.fullTextSha256!==undefined && record.fullTextSha256!==contentHash) throw new Error('CONTENT_HASH_MISMATCH');
  const metadataJson=businessMetadata(record);
  return {contentHash,metadataHash:sha256(canonicalJson(metadataJson)),metadataJson};
}
