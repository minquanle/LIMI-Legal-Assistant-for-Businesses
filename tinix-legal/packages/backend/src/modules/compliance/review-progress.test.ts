import {describe,it,expect} from 'vitest';
import {validateReview} from './review-progress.js';
import {draftSchema} from './contracts.js';
describe('rich checklist review',()=>{
 it('requires reasons and evidence; unresolved points cannot complete',()=>{
  expect(()=>validateReview({steps:[{index:0,result:'na',note:''}]},1,'DOING')).toThrow('STEP_REASON_REQUIRED');
  expect(()=>validateReview({steps:[{index:0,result:'issue',note:'Missing'}],evidenceNote:'Folder'},1,'DONE')).toThrow('REVIEW_INCOMPLETE');
  expect(()=>validateReview({steps:[{index:0,result:'pass',note:''}]},1,'DONE')).toThrow('EVIDENCE_NOTE_REQUIRED');
  expect(()=>validateReview({steps:[]},1,'NOT_APPLICABLE')).toThrow('NA_REASON_REQUIRED');
  expect(validateReview({steps:[{index:0,result:'na',note:''}],notApplicableReason:'Không phát sinh hoạt động này'},1,'NOT_APPLICABLE').notApplicableReason).toBe('Không phát sinh hoạt động này');
  expect(validateReview({steps:[{index:0,result:'na',note:'No event'}],evidenceNote:'Record A'},1,'DONE').steps[0].note).toBe('No event');
 });
 it('rejects duplicate/out-of-range outcomes',()=>{
  expect(()=>validateReview({steps:[{index:2,result:'pass'}]},1,'DOING')).toThrow('INVALID_STEPS');
  expect(()=>validateReview({steps:[{index:0,result:'pass'},{index:0,result:'pass'}]},1,'DOING')).toThrow('INVALID_STEPS');
 });
 it('rejects step references outside pinned checklist citations',()=>{
  const id='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222';
  const content={title:'Fixture title',action:'Fixture action only',group:'labor',scope:'COMPANY',rule:{fact:'employeeCount',op:'gt',value:0},exceptions:'Fixture',effectiveFrom:'2026-01-01',effectiveUntil:null,deadline:{kind:'NONE'},steps:['Check fixture'],evidenceRequired:false,evidenceInstructions:'Fixture evidence',guide:{question:'Fixture question',proof:'Fixture proof',done:'Fixture done',owner:'Fixture owner',timing:'Fixture timing',steps:[{detail:'Fixture detail',when:'',checks:['Fixture check'],evidence:'Fixture evidence',provisionIds:[other]}]}};
  expect(draftSchema.safeParse({content,citations:[{documentId:id,snapshotId:id,parseRunId:id,provisionId:id}]}).success).toBe(false);
 });
});
