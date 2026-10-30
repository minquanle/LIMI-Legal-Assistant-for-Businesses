import type {PrismaClient,Prisma} from '@prisma/client';
import {coverageData} from './coverage-data.js';

// Counts are derived from imported documents and live draft citations, not the
// number of rows in the editorial manifest. A fixture/empty DB must show zero.
export async function checklistCoverage(db:PrismaClient|Prisma.TransactionClient){
 const [documents,entries]=await Promise.all([
  db.canonicalDocument.findMany({where:{id:{in:coverageData.documents.map(d=>d.documentId)}},select:{id:true}}),
  db.checklistImportEntry.findMany({where:{versionId:{not:null}},include:{version:{select:{id:true,status:true,contentJson:true,citations:{select:{documentId:true}}}}}})
 ]);
 const ids=new Set(documents.map(d=>d.id));
 const rows=coverageData.documents.filter(d=>ids.has(d.documentId)).map(d=>{
  const linked=entries.filter(e=>e.version?.citations.some(c=>c.documentId===d.documentId)).map(e=>({versionId:e.version!.id,title:(e.version!.contentJson as any).title,status:e.version!.status}));
  return {documentId:d.documentId,documentNumber:d.documentNumber,title:d.title,group:d.group,scope:d.scope,status:linked.length?'CITED_BY_DRAFTS':d.status==='CITED_BY_DRAFTS'?'AWAITING_IMPORT':d.status,reason:d.reason,effectiveDate:d.effectiveDate,validityReview:d.validityReview,sources:d.sources,linkedDrafts:linked,legalReviewRequired:true};
 });
 return {availableDocuments:rows.length,importedChecklists:entries.length,documents:rows,exhaustiveLegalCoverage:false,notice:'Các checklist đã được biên tập để chạy thử. Danh sách nguồn không chứng nhận đã bao phủ mọi nghĩa vụ hoặc đã xác minh toàn bộ chuỗi hiệu lực; chuyên gia cần duyệt trước phát hành chính thức.'};
}
