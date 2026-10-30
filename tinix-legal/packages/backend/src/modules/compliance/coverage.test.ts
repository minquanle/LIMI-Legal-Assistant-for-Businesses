import {describe,it,expect} from 'vitest';
import {checklistCoverage} from './coverage.js';
import {coverageData} from './coverage-data.js';
describe('live checklist coverage',()=>{
 it('does not advertise source documents from an absent database',async()=>{
  const db:any={canonicalDocument:{findMany:async()=>[]},checklistImportEntry:{findMany:async()=>[]}};
  const result=await checklistCoverage(db);
  expect(result.availableDocuments).toBe(0);expect(result.importedChecklists).toBe(0);expect(result.documents).toEqual([]);
 });
 it('counts actual linked drafts rather than editorial expected titles',async()=>{
  const seed=coverageData.documents.find(d=>d.status==='CITED_BY_DRAFTS')!;
  const db:any={canonicalDocument:{findMany:async()=>[{id:seed.documentId}]},checklistImportEntry:{findMany:async()=>[]}};
  expect((await checklistCoverage(db)).documents[0].status).toBe('AWAITING_IMPORT');
  db.checklistImportEntry.findMany=async()=>[{version:{id:'actual',status:'DRAFT',contentJson:{title:'Actual draft'},citations:[{documentId:seed.documentId}]}}];
  const result=await checklistCoverage(db);expect(result.importedChecklists).toBe(1);expect(result.documents[0].linkedDrafts).toEqual([{versionId:'actual',title:'Actual draft',status:'DRAFT'}]);
  expect(result.exhaustiveLegalCoverage).toBe(false);
 });
});
