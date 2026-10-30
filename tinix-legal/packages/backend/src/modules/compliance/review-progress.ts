import {reviewSchema} from './contracts.js';
import {HttpError} from '../workspace/access.js';
export function validateReview(value:unknown,count:number,status:string){
 const review=reviewSchema.parse(value),indexes=review.steps.map(s=>s.index);
 if(indexes.some(i=>i>=count)||new Set(indexes).size!==indexes.length)throw new HttpError(400,'INVALID_STEPS');
 if(status!=='NOT_APPLICABLE'&&review.steps.some(s=>s.result==='na'&&!s.note))throw new HttpError(400,'STEP_REASON_REQUIRED');
 if(status==='NOT_APPLICABLE'&&review.notApplicableReason.length<3)throw new HttpError(400,'NA_REASON_REQUIRED');
 if(status==='DONE'){
  if(review.steps.length!==count||review.steps.some(s=>s.result==='issue'))throw new HttpError(409,'REVIEW_INCOMPLETE');
  if(!review.evidenceNote)throw new HttpError(409,'EVIDENCE_NOTE_REQUIRED');
 }
 return review;
}
