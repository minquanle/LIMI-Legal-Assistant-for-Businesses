import {DocumentType,ValidityStatus,ASTNodeType} from '@prisma/client';
const ref=(name:string)=>({$ref:`#/components/schemas/${name}`});
const string={type:'string'},uuid={type:'string',format:'uuid'},json={type:'object',additionalProperties:true};
const parameter=(name:string,schema:object,required=false)=>({name,in:'query',required,schema});
const pagination=[parameter('page',{type:'integer',minimum:1,maximum:10000,default:1}),parameter('pageSize',{type:'integer',minimum:1,maximum:100,default:20})];
const snapshot=[parameter('snapshotId',uuid)],parse=[parameter('parseRunId',uuid)];
const pathParams=(path:string)=>[...path.matchAll(/\{(\w+)\}/g)].map(([,name])=>({name,in:'path',required:true,schema:name==='id'?string:uuid}));
const paged=(name:string)=>({type:'object',required:['items','total','page','pageSize'],properties:{items:{type:'array',items:ref(name)},total:{type:'integer'},page:{type:'integer'},pageSize:{type:'integer'}}});
const schemas={
  Error:{type:'object',required:['error'],properties:{error:string}},
  Law:{type:'object',required:['id','documentNumber','title','snapshotId','metadata','quality'],properties:{id:uuid,externalIds:{type:'array',items:json},documentNumber:string,title:string,type:string,scope:{enum:['NATIONAL','HUNG_YEN','OTHER','UNKNOWN']},group:string,reviewStatus:{enum:['PENDING','APPROVED','REJECTED']},snapshotId:uuid,metadata:json,quality:json,contentHash:string}},
  LawDetail:{allOf:[ref('Law'),{type:'object',properties:{sources:{type:'array',items:json},relations:{type:'array',items:json}}}]},
  Content:{type:'object',required:['documentId','snapshotId','contentHash','fullText','offsetUnit'],properties:{documentId:uuid,snapshotId:uuid,contentHash:string,fullText:string,offsetUnit:{const:'UNICODE_CODE_POINT'},quality:json}},
  Snapshot:{type:'object',properties:{id:uuid,contentHash:string,metadataHash:string,metadataJson:json,qualityJson:json,reason:string,createdAt:{type:'string',format:'date-time'}}},
  Provision:{type:'object',properties:{id:uuid,externalNodeId:string,parseRunId:uuid,parentId:{type:['string','null']},nodeType:string,ordinal:{type:['string','null']},heading:{type:['string','null']},spanStart:{type:'integer'},spanEnd:{type:'integer'},quotedAmendmentCandidate:{type:'boolean'},citation:string}},
  Citation:{allOf:[ref('Provision'),{type:'object',required:['text','snapshotId','parseRun'],properties:{text:string,snapshotId:uuid,parseRun:json}}]},
  Attachment:{type:'object',properties:{id:uuid,role:string,provenance:json,checksum:string,sizeBytes:string,mimeType:string,status:{enum:['PENDING','AVAILABLE','FAILED']},hasExtractedText:{type:'boolean'},downloadUrl:string,textUrl:{type:['string','null']}}},
  AttachmentText:{type:'object',properties:{id:uuid,text:string,textHash:string}},
  LawPage:paged('Law'),SnapshotPage:paged('Snapshot'),ProvisionPage:{...paged('Provision'),properties:{...paged('Provision').properties,documentId:uuid,snapshotId:uuid,parseRun:json}},AttachmentPage:paged('Attachment')
};
const filters=[...pagination,parameter('q',{type:'string',minLength:1,maxLength:200}),parameter('group',{type:'string',pattern:'^[a-z_]{1,40}$'}),parameter('scope',{enum:['NATIONAL','HUNG_YEN','OTHER','UNKNOWN']}),parameter('type',{enum:Object.values(DocumentType)}),parameter('validity',{enum:Object.values(ValidityStatus)})];
const definitions:[string,string,string,object[]][]=[['/laws','List laws','LawPage',filters],['/laws/search','Search number/title through PostgreSQL','LawPage',filters],['/search','Search alias','LawPage',filters],
  ['/laws/{id}','Metadata, sources and unresolved relationships','LawDetail',snapshot],['/laws/{id}/content','Read selected or historical text','Content',snapshot],
  ['/laws/{id}/snapshots','Version history','SnapshotPage',pagination],['/laws/{id}/provisions','Page through sealed provisions','ProvisionPage',[...pagination,...snapshot,...parse,parameter('parentId',uuid),parameter('roots',{enum:['true','false']}),parameter('nodeType',{enum:Object.values(ASTNodeType)})]],
  ['/laws/{id}/provisions/{provisionId}','Stable citation and Unicode text span','Citation',[parameter('snapshotId',uuid,true),parameter('parseRunId',uuid,true)]],
  ['/laws/{id}/attachments','Files without private object keys or raw records','AttachmentPage',[...pagination,...snapshot]],
  ['/laws/{id}/attachments/{attachmentId}/text','Extracted form text','AttachmentText',[parameter('snapshotId',uuid,true)]],
  ['/laws/{id}/attachments/{attachmentId}/download','Stream available private file as attachment','binary',[parameter('snapshotId',uuid,true)]]];
export const legalOpenApi={openapi:'3.1.0',info:{title:'LIMI Legal Library API',version:'1.0.0',description:'Read-only curated law API. Legal review is PENDING. Provision spans use Unicode code points [start,end). All lists are bounded. Internal and curated external document IDs are accepted. No Meilisearch dependency.'},servers:[{url:'/api/v1'}],
  paths:Object.fromEntries(definitions.map(([path,summary,response,parameters])=>[path,{get:{summary,parameters:[...pathParams(path),...parameters],responses:{'200':{description:'Success',content:{[response==='binary'?'application/octet-stream':'application/json']:{schema:response==='binary'?{type:'string',format:'binary'}:ref(response)}}},
    '400':{description:'Invalid query or ID',content:{'application/json':{schema:ref('Error')}}},'404':{description:'Not found or belongs to another document/version',content:{'application/json':{schema:ref('Error')}}},'503':{description:'File not available'},'500':{description:'Internal error; no credentials disclosed'}}}}])),components:{schemas}};
