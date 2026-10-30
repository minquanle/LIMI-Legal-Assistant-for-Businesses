import {z} from 'zod';
import {CHECKLIST_PROFILE_FACTS,DATE_FACT_NAMES} from './profile-facts.js';
import {APPROVED_WORKING_CALENDAR,type WorkingCalendar} from './working-calendar.js';
import {APPROVED_DERIVED_FACTS,type DerivedFactRule} from './derived-facts.js';
export {CHECKLIST_PROFILE_FACTS,DATE_FACT_NAMES,APPROVED_WORKING_CALENDAR,APPROVED_DERIVED_FACTS};
export type {WorkingCalendar,DerivedFactRule};
// 1.5.0: MONTHLY/FISCAL_YEAR_END_OFFSET, QUARTERLY chọn kỳ có hạn trong quý hiện tại, lùi hạn theo lịch đã duyệt, trường dẫn xuất.
export const ENGINE_VERSION='limi-rules-1.5.1';
export const TIMEZONE='Asia/Ho_Chi_Minh';
export const fieldNames=['stage','employees','employeeCount','activity','channels','places','signals','province','site.kind','site.province','event.type',...CHECKLIST_PROFILE_FACTS.map(f=>f.key)] as const;
export type Field=typeof fieldNames[number];
export type Rule={all:Rule[]}|{any:Rule[]}|{not:Rule}|{fact:Field,op:'eq'|'in'|'has'|'gt'|'gte'|'lt'|'lte'|'exists',value?:string|number|boolean|(string|number|boolean)[]};
const scalar=z.union([z.string().max(200),z.number().finite(),z.boolean()]);
const schema:z.ZodType<Rule>=z.lazy(()=>z.union([
 z.object({all:z.array(schema).min(1).max(20)}).strict(),z.object({any:z.array(schema).min(1).max(20)}).strict(),z.object({not:schema}).strict(),
 z.object({fact:z.enum(fieldNames),op:z.enum(['eq','in','has','gt','gte','lt','lte','exists']),value:z.union([scalar,z.array(scalar).min(1).max(30)]).optional()}).strict().superRefine((r,ctx)=>{
   const numeric=r.fact==='employeeCount',array=['activity','channels','places','signals'].includes(r.fact);
   const valid=r.op==='exists'?r.value===undefined:r.value!==undefined&&(r.op==='has'?array&&typeof r.value==='string':r.op==='in'?!array&&Array.isArray(r.value)&&r.value.every(v=>numeric?typeof v==='number':typeof v==='string'):['gt','gte','lt','lte'].includes(r.op)?numeric&&typeof r.value==='number':!array&&(numeric?typeof r.value==='number':typeof r.value==='string'));
   if(!valid)ctx.addIssue({code:z.ZodIssueCode.custom,message:'Invalid operator/value for registered fact'});
   const definition=CHECKLIST_PROFILE_FACTS.find(f=>f.key===r.fact);
   if(definition?.kind==='enum'&&r.op!=='exists'&&r.value!==undefined){
    const allowed=definition.options!.map(o=>o[0]) as readonly string[];
    if((Array.isArray(r.value)?r.value:[r.value]).some(v=>typeof v!=='string'||!allowed.includes(v)))ctx.addIssue({code:z.ZodIssueCode.custom,message:'Invalid registered classification'});
   }
 })
]));
export function parseRule(value:unknown):Rule{
 const stack:[unknown,number][]=[[value,0]];let count=0;
 while(stack.length){const [node,depth]=stack.pop()!;if(depth>8||++count>100)throw Error('RULE_TOO_COMPLEX');if(node&&typeof node==='object'){const o=node as any;for(const x of o.all??o.any??(o.not?[o.not]:[]))stack.push([x,depth+1]);}}
 return schema.parse(value);
}
export type Fact={value:unknown,status:'UNKNOWN'|'USER_CONFIRMED'|'VERIFIED'|'DERIVED',derivedMissing?:Field[],reusedFrom?:Field};
export type Context={facts:Partial<Record<Field,Fact>>,dates:{founded?:string,event?:string},calendar?:WorkingCalendar};
const labels:Record<Field,string>={stage:'giai đoạn hoạt động',employees:'quy mô lao động',employeeCount:'số lao động chính xác',activity:'hoạt động kinh doanh',channels:'kênh bán hàng',places:'loại cơ sở',signals:'tình huống hoạt động',province:'tỉnh/thành phố','site.kind':'loại địa điểm','site.province':'tỉnh của địa điểm','event.type':'loại sự kiện',...Object.fromEntries(CHECKLIST_PROFILE_FACTS.map(f=>[f.key,f.label]))} as Record<Field,string>;
type Answer={state:'TRUE'|'FALSE'|'UNKNOWN',missing:Field[]};
// Reuse an explicitly recorded observation with the same meaning. This is not a legal
// inference: absence of a checkbox is not a negative answer, and broad signals such as
// foreign/ads/customerData do not prove a narrower employment/tax/advertising condition.
export function reuseProfileFacts(context:Context):Context{
 const facts={...context.facts},old=facts.usesThirdPartyIp,signals=facts.signals;
 if((!old||old.status==='UNKNOWN'||old.value==null)&&signals&&signals.status!=='UNKNOWN'&&Array.isArray(signals.value)&&signals.value.includes('copyrightAssets')){
  facts.usesThirdPartyIp={value:'yes',status:'DERIVED',reusedFrom:'signals'};
 }
 return {...context,facts};
}
function run(r:Rule,c:Context):Answer{
 if('not'in r){const v=run(r.not,c);return {state:v.state==='UNKNOWN'?'UNKNOWN':v.state==='TRUE'?'FALSE':'TRUE',missing:v.missing};}
 if('all'in r||'any'in r){const all='all'in r,values=(all?r.all:(r as {any:Rule[]}).any).map(x=>run(x,c)),decisive=values.some(v=>v.state===(all?'FALSE':'TRUE'));
   return {state:decisive?(all?'FALSE':'TRUE'):values.some(v=>v.state==='UNKNOWN')?'UNKNOWN':all?'TRUE':'FALSE',missing:decisive?[]:[...new Set(values.flatMap(v=>v.missing))]};}
 const f=c.facts[r.fact];if(!f||f.status==='UNKNOWN'||f.value===null||f.value===undefined){
  if(r.fact==='employeeCount'){
   const workforce=c.facts.employees,bounds:Record<string,[number,number]>={'0':[0,0],'1-9':[1,9],'10-49':[10,49],'50-99':[50,99],'100+':[100,Infinity]},range=workforce&&workforce.status!=='UNKNOWN'?bounds[String(workforce.value)]:undefined;
   if(range){const [lo,hi]=range,n=r.value as number;let state:Answer['state']='UNKNOWN';
    switch(r.op){case 'exists':state='TRUE';break;case 'gt':state=lo>n?'TRUE':hi<=n?'FALSE':'UNKNOWN';break;case 'gte':state=lo>=n?'TRUE':hi<n?'FALSE':'UNKNOWN';break;case 'lt':state=hi<n?'TRUE':lo>=n?'FALSE':'UNKNOWN';break;case 'lte':state=hi<=n?'TRUE':lo>n?'FALSE':'UNKNOWN';break;case 'eq':state=lo===hi&&lo===n?'TRUE':n<lo||n>hi?'FALSE':'UNKNOWN';break;case 'in':{const values=new Set(r.value as number[]);state=[...values].some(v=>v>=lo&&v<=hi)?hi-lo+1<=values.size&&Array.from({length:hi-lo+1},(_,i)=>lo+i).every(v=>values.has(v))?'TRUE':'UNKNOWN':'FALSE';break;}}
    return {state,missing:state==='UNKNOWN'?[r.fact]:[]};
   }
  }
  // A derived conclusion that cannot be decided yet points the user at its observable inputs.
  return {state:'UNKNOWN',missing:f?.derivedMissing?.length?f.derivedMissing:[r.fact]};
 }
 if(r.fact==='employeeCount'&&(typeof f.value!=='number'||!Number.isInteger(f.value)||f.value<0))throw Error('INVALID_FACT');
 const arrays=['activity','channels','places','signals'].includes(r.fact);if(arrays?(!Array.isArray(f.value)||!f.value.every(x=>typeof x==='string')):r.fact!=='employeeCount'&&typeof f.value!=='string')throw Error('INVALID_FACT');
 let matches=false;switch(r.op){case 'exists':matches=true;break;case 'eq':matches=f.value===r.value;break;case 'in':matches=(r.value as unknown[]).includes(f.value);break;case 'has':matches=(f.value as unknown[]).includes(r.value);break;case 'gt':matches=(f.value as number)>(r.value as number);break;case 'gte':matches=(f.value as number)>=(r.value as number);break;case 'lt':matches=(f.value as number)<(r.value as number);break;case 'lte':matches=(f.value as number)<=(r.value as number);break;}
 return {state:matches?'TRUE':'FALSE',missing:[]};
}
// Approved derivations win over a user's own answer only when they are decisive; otherwise the answer is kept.
export function applyDerivedFacts(context:Context,rules:DerivedFactRule[]=APPROVED_DERIVED_FACTS):Context{
 const facts={...reuseProfileFacts(context).facts};
 for(const d of rules){const key=d.fact as Field;if(!fieldNames.includes(key))throw Error('INVALID_DERIVED_FACT');const r=run(parseRule(d.rule),{...context,facts});
  if(r.state!=='UNKNOWN')facts[key]={value:r.state==='TRUE'?'yes':'no',status:'DERIVED'};
  else if(!facts[key]||facts[key]!.status==='UNKNOWN')facts[key]={value:null,status:'UNKNOWN',derivedMissing:r.missing};
 }
 return {...context,facts};
}
export function evaluate(rule:unknown,context:Context){const r=run(parseRule(rule),applyDerivedFacts(context));return {decision:r.state==='TRUE'?'APPLY':r.state==='FALSE'?'NOT_APPLY':'NEEDS_INFORMATION',missingFacts:r.missing,explanation:r.state==='UNKNOWN'?`Cần xác nhận ${r.missing.map(x=>labels[x]).join(', ')} trước khi xác định phạm vi.`:r.state==='TRUE'?'Hồ sơ đáp ứng điều kiện trong bộ nghĩa vụ đang đánh giá.':'Hồ sơ không đáp ứng điều kiện áp dụng trong bộ nghĩa vụ đang đánh giá.'} as const;}
const date=z.string().date();
const dayOfMonth=z.union([z.number().int().min(1).max(28),z.literal('LAST')]);
// Optional and without a default: adding it must not change the parsed content (and so the basis hash) of existing versions.
const shift=z.enum(['NONE','NEXT_WORKING_DAY']).optional();
export const FISCAL_YEAR_ENDS=['03-31','06-30','09-30','12-31'] as const;
export const deadlineSchema=z.discriminatedUnion('kind',[
 z.object({kind:z.literal('DATE_OFFSET'),triggerFact:z.enum(DATE_FACT_NAMES),months:z.number().int().min(0).max(120).default(0),days:z.number().int().min(0).max(3650).default(0),shift}).strict(),
 // Deprecated: the user had to type the period end. Use MONTHLY/QUARTERLY; kept so published versions still parse.
 z.object({kind:z.literal('PERIOD_END'),periodEndFact:z.enum(['socialInsuranceContributionPeriodEndDate','vatMonthlyPeriodEndDate','vatQuarterPeriodEndDate']),monthsAfterEnd:z.number().int().min(1).max(3),day:dayOfMonth,shift}).strict(),
 z.object({kind:z.literal('REVIEW_PERIOD'),period:z.literal('YEAR')}).strict(),
 z.object({kind:z.literal('NONE')}).strict(),z.object({kind:z.literal('FIXED'),date,shift}).strict(),
 z.object({kind:z.literal('OFFSET'),trigger:z.enum(['FOUNDED','EVENT']),days:z.number().int().min(0).max(3650),shift}).strict(),
 z.object({kind:z.literal('ANNUAL'),month:z.number().int().min(1).max(12),day:dayOfMonth,shift}).strict(),
 z.object({kind:z.literal('QUARTERLY'),monthsAfterEnd:z.number().int().min(1).max(3),day:dayOfMonth,shift}).strict(),
 z.object({kind:z.literal('MONTHLY'),monthsAfterEnd:z.number().int().min(1).max(3),day:dayOfMonth,shift}).strict(),
 z.object({kind:z.literal('FISCAL_YEAR_END_OFFSET'),months:z.number().int().min(0).max(24).default(0),days:z.number().int().min(0).max(366).default(0),shift}).strict()
]);
export type DeadlineRule=z.infer<typeof deadlineSchema>;
export function localDate(now=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit'}).format(now);}
const iso=(d:Date)=>d.toISOString().slice(0,10);
const utc=(y:number,m0:number,day:number|'LAST')=>day==='LAST'?new Date(Date.UTC(y,m0+1,0)):new Date(Date.UTC(y,m0,day));
// Calendar-month offset clamped to the target month's length, then plain days.
function addOffset(from:Date,months:number,days:number){const y=from.getUTCFullYear(),m=from.getUTCMonth()+months,last=new Date(Date.UTC(y,m+1,0)).getUTCDate(),d=new Date(Date.UTC(y,m,Math.min(from.getUTCDate(),last)));d.setUTCDate(d.getUTCDate()+days);return d;}
export type CalendarStatus='NOT_REQUESTED'|'APPLIED'|'UNAVAILABLE';
// Moves forward over weekends/holidays only when every day crossed belongs to an approved year;
// otherwise keeps the legal (earlier, safer) date instead of guessing make-up working days.
export function nextWorkingDay(day:string,calendar:WorkingCalendar|undefined):{date:string,status:CalendarStatus}{
 const d=new Date(day+'T00:00:00Z');
 for(let i=0;i<31;i++,d.setUTCDate(d.getUTCDate()+1)){const s=iso(d),year=calendar?.years[s.slice(0,4)];if(!year)return {date:day,status:'UNAVAILABLE'};
  if(year.workingDays.includes(s)||![0,6].includes(d.getUTCDay())&&!year.nonWorkingDays.includes(s))return {date:s,status:'APPLIED'};}
 return {date:day,status:'UNAVAILABLE'};
}
type Unit={index:(d:Date)=>number,end:(p:number)=>Date,key:(p:number)=>string};
const MONTH:Unit={index:d=>d.getUTCFullYear()*12+d.getUTCMonth(),end:p=>utc(Math.floor(p/12),p%12,'LAST'),key:p=>`${Math.floor(p/12)}-${String(p%12+1).padStart(2,'0')}`};
const QUARTER:Unit={index:d=>d.getUTCFullYear()*4+Math.floor(d.getUTCMonth()/3),end:p=>utc(Math.floor(p/4),(p%4)*3+2,'LAST'),key:p=>`${Math.floor(p/4)}-Q${p%4+1}`};
const fiscal=(endMonth:number):Unit=>({index:d=>d.getUTCMonth()+1>endMonth?d.getUTCFullYear()+1:d.getUTCFullYear(),end:p=>utc(p,endMonth-1,'LAST'),key:p=>'FY'+p});
// Picks the latest period whose filing deadline falls in (or before) the period containing asOf:
// on 21/10 a quarterly return is the Q3 one due 31/10, not Q4 due next January. Overdue periods are kept.
function periodFor(unit:Unit,asOf:Date,due:(end:Date)=>Date){
 const current=unit.index(asOf);let p=current;
 while(p>current-40&&unit.index(due(unit.end(p)))>current)p--;
 return {due:due(unit.end(p)),periodKey:unit.key(p)};
}
export function calculateDeadline(value:unknown,asOf:string,context:Context){
 date.parse(asOf);const r=deadlineSchema.parse(value),year=Number(asOf.slice(0,4)),today=new Date(asOf+'T00:00:00Z');
 const finish=(due:Date|string,periodKey:string)=>{const legal=typeof due==='string'?due:iso(due);
  if(!('shift'in r)||r.shift!=='NEXT_WORKING_DAY')return {dueDate:legal,periodKey,missingTrigger:null,legalDueDate:legal,calendarStatus:'NOT_REQUESTED' as CalendarStatus};
  const moved=nextWorkingDay(legal,context.calendar);return {dueDate:moved.date,periodKey,missingTrigger:null,legalDueDate:legal,calendarStatus:moved.status};};
 if(r.kind==='REVIEW_PERIOD')return {dueDate:null,periodKey:String(year),missingTrigger:null};
 if(r.kind==='NONE')return {dueDate:null,periodKey:'once',missingTrigger:null};
 if(r.kind==='FIXED')return finish(r.date,'once');
 if(r.kind==='DATE_OFFSET'||r.kind==='PERIOD_END'){
  const key=r.kind==='DATE_OFFSET'?r.triggerFact:r.periodEndFact,f=context.facts[key];
  if(!f||f.status==='UNKNOWN'||!date.safeParse(f.value).success)return {dueDate:null,periodKey:'unconfirmed:'+key,missingTrigger:'FACT:'+key};
  const trigger=f.value as string,d=new Date(trigger+'T00:00:00Z'),y=d.getUTCFullYear(),m=d.getUTCMonth(),day=d.getUTCDate();
  if(r.kind==='PERIOD_END'){
   if(day!==new Date(Date.UTC(y,m+1,0)).getUTCDate())return {dueDate:null,periodKey:'invalid:'+key,missingTrigger:'FACT:'+key};
   return finish(utc(y,m+r.monthsAfterEnd,r.day),key+':'+trigger);
  }
  return finish(addOffset(d,r.months,r.days),key+':'+trigger);
 }
 if(r.kind==='OFFSET'){const trigger=r.trigger==='FOUNDED'?context.dates.founded:context.dates.event;if(!trigger)return {dueDate:null,periodKey:'once',missingTrigger:r.trigger};date.parse(trigger);const d=new Date(trigger+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+r.days);return finish(d,'once');}
 if(r.kind==='ANNUAL')return finish(utc(year,r.month-1,r.day),String(year));
 if(r.kind==='MONTHLY'||r.kind==='QUARTERLY'){const {due,periodKey}=periodFor(r.kind==='MONTHLY'?MONTH:QUARTER,today,end=>utc(end.getUTCFullYear(),end.getUTCMonth()+r.monthsAfterEnd,r.day));return finish(due,periodKey);}
 // FISCAL_YEAR_END_OFFSET: the fiscal year end is a stable company attribute, never a date typed per year.
 const f=context.facts.fiscalYearEnd;
 if(!f||f.status==='UNKNOWN'||!FISCAL_YEAR_ENDS.includes(f.value as typeof FISCAL_YEAR_ENDS[number]))return {dueDate:null,periodKey:'unconfirmed:fiscalYearEnd',missingTrigger:'FACT:fiscalYearEnd'};
 const {due,periodKey}=periodFor(fiscal(Number(String(f.value).slice(0,2))),today,end=>addOffset(end,r.months,r.days));
 return finish(due,periodKey);
}
// Which unanswered profile questions hold back the most checklist items, so onboarding can ask those first.
const triggerLabels:Record<string,string>={FOUNDED:'ngày thành lập',EVENT:'ngày xảy ra sự kiện'};
export function rankMissingFacts(items:{decision:string,missingFacts:readonly string[]}[]){
 const pending=new Map<string,number>();
 for(const item of items)if(item.decision==='NEEDS_INFORMATION')for(const fact of new Set(item.missingFacts.map(x=>x.replace(/^date:(FACT:)?/,''))))pending.set(fact,(pending.get(fact)??0)+1);
 return [...pending].map(([fact,count])=>({fact,label:labels[fact as Field]??triggerLabels[fact]??fact,pending:count})).sort((a,b)=>b.pending-a.pending||a.fact.localeCompare(b.fact));
}
