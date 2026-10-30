import {z} from 'zod';
import {HttpError} from '../workspace/access.js';
export const scopeInput=z.object({expectedRevision:z.number().int().min(0),action:z.enum(['PROCESS','COMPLETE','IGNORE']),reason:z.string().trim().max(2000).default('')}).strict();
export function scopeRecord(input:z.infer<typeof scopeInput>,actorId:string,basis:string,engineDecision:string){
 if(input.action==='IGNORE'&&input.reason.length<3)throw new HttpError(400,'NA_REASON_REQUIRED');
 return {action:input.action,reason:input.reason,actorId,basis,engineDecision,at:new Date().toISOString()};
}
export function storedScope(value:unknown,basis:string){const s=(value as any)?.scopeVerification;return s?.basis===basis&&['PROCESS','COMPLETE','IGNORE'].includes(s.action)?s:undefined;}
export function withoutScope(value:unknown){const {scopeVerification,...review}=(value??{}) as any;return review;}
