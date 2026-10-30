import {describe,it,expect} from 'vitest';
import {evaluate,calculateDeadline,parseRule,localDate,applyDerivedFacts,rankMissingFacts,nextWorkingDay,type Context,type WorkingCalendar} from './index.js';
const context:Context={facts:{employeeCount:{value:0,status:'USER_CONFIRMED'},channels:{value:[],status:'USER_CONFIRMED'},province:{value:'Hưng Yên',status:'USER_CONFIRMED'}},dates:{}};
describe('three-valued interpreter',()=>{
 it('uses confirmed workforce ranges and asks only when a threshold intersects the range',()=>{
  const c:Context={facts:{employees:{value:'10-49',status:'USER_CONFIRMED'},employeeCount:{value:null,status:'UNKNOWN'}},dates:{}};
  expect(evaluate({fact:'employeeCount',op:'gt',value:0},c).decision).toBe('APPLY');
  expect(evaluate({fact:'employeeCount',op:'gte',value:10},c).decision).toBe('APPLY');
  expect(evaluate({fact:'employeeCount',op:'gte',value:50},c).decision).toBe('NOT_APPLY');
  expect(evaluate({fact:'employeeCount',op:'gte',value:20},c).missingFacts).toEqual(['employeeCount']);
  expect(evaluate({fact:'employeeCount',op:'eq',value:20},c).decision).toBe('NEEDS_INFORMATION');
  expect(evaluate({fact:'employeeCount',op:'eq',value:0},c).decision).toBe('NOT_APPLY');
  expect(evaluate({fact:'employeeCount',op:'gt',value:0},{...c,facts:{employees:{value:'0',status:'VERIFIED'}}}).decision).toBe('NOT_APPLY');
  expect(evaluate({fact:'employeeCount',op:'gt',value:0},{...c,facts:{employees:{value:'10-49',status:'UNKNOWN'}}}).decision).toBe('NEEDS_INFORMATION');
  expect(evaluate({fact:'employeeCount',op:'gte',value:100},{...c,facts:{employees:{value:'100+',status:'USER_CONFIRMED'}}}).decision).toBe('APPLY');
  expect(evaluate({fact:'employeeCount',op:'gt',value:100},{...c,facts:{employees:{value:'100+',status:'USER_CONFIRMED'}}}).decision).toBe('NEEDS_INFORMATION');
  expect(evaluate({fact:'employeeCount',op:'gt',value:0},{...c,facts:{...c.facts,employeeCount:{value:0,status:'VERIFIED'}}}).decision).toBe('NOT_APPLY');
 });
 it('keeps unknown distinct from zero and confirmed empty arrays',()=>{expect(evaluate({fact:'employeeCount',op:'eq',value:0},context).decision).toBe('APPLY');expect(evaluate({fact:'employees',op:'exists'},context).decision).toBe('NEEDS_INFORMATION');expect(evaluate({fact:'channels',op:'has',value:'website'},context).decision).toBe('NOT_APPLY');});
 it('all false and any true dominate unknown',()=>{const missing={fact:'employees',op:'exists'},yes={fact:'employeeCount',op:'eq',value:0},no={fact:'employeeCount',op:'gt',value:0};expect(evaluate({all:[missing,no]},context).decision).toBe('NOT_APPLY');expect(evaluate({any:[missing,yes]},context).decision).toBe('APPLY');expect(evaluate({not:missing},context).decision).toBe('NEEDS_INFORMATION');expect(evaluate({all:[missing,yes]},context).missingFacts).toEqual(['employees']);});
 it('checks numeric boundaries without coercion',()=>{expect(evaluate({fact:'employeeCount',op:'gte',value:0},context).decision).toBe('APPLY');expect(evaluate({fact:'employeeCount',op:'gt',value:0},context).decision).toBe('NOT_APPLY');expect(()=>evaluate({fact:'employeeCount',op:'gt',value:0},{...context,facts:{employeeCount:{value:'1',status:'VERIFIED'}}})).toThrow();});
 it('whitelists facts/operators and bounds recursion',()=>{expect(()=>parseRule({fact:'password',op:'eq',value:'x'})).toThrow();expect(()=>parseRule({fact:'channels',op:'gte',value:1})).toThrow();expect(()=>parseRule({fact:'stage',op:'eval',value:'process.exit()'})).toThrow();let r:any={fact:'stage',op:'exists'};for(let n=0;n<10;n++)r={not:r};expect(()=>parseRule(r)).toThrow();});
 it('handles geographical and event scope',()=>{expect(evaluate({fact:'province',op:'eq',value:'Hưng Yên'},context).decision).toBe('APPLY');expect(evaluate({fact:'event.type',op:'eq',value:'HIRED'},context).decision).toBe('NEEDS_INFORMATION');});
});
describe('calendar deadlines',()=>{
 it('separates annual reviews without inventing a calendar due date',()=>{
  const r={kind:'REVIEW_PERIOD',period:'YEAR'};
  expect(calculateDeadline(r,'2026-12-31',context)).toEqual({dueDate:null,periodKey:'2026',missingTrigger:null});
  expect(calculateDeadline(r,'2027-01-01',context)).toEqual({dueDate:null,periodKey:'2027',missingTrigger:null});
 });
 it('uses explicit reporting periods, including fiscal quarters and leap years',()=>{
  const r={kind:'PERIOD_END',periodEndFact:'vatQuarterPeriodEndDate',monthsAfterEnd:1,day:'LAST'};
  const c:Context={facts:{vatQuarterPeriodEndDate:{value:'2024-01-31',status:'USER_CONFIRMED'}},dates:{}};
  expect(calculateDeadline(r,'2026-10-12',c)).toMatchObject({dueDate:'2024-02-29',periodKey:'vatQuarterPeriodEndDate:2024-01-31'});
  expect(calculateDeadline({...r,day:20},'2026-10-12',c).dueDate).toBe('2024-02-20');
  expect(calculateDeadline(r,'2026-10-12',{facts:{vatQuarterPeriodEndDate:{value:'2024-01-30',status:'USER_CONFIRMED'}},dates:{}}).missingTrigger).toBe('FACT:vatQuarterPeriodEndDate');
 });
 it('clamps calendar month offsets and binds progress to the trigger date',()=>{
  const r={kind:'DATE_OFFSET',triggerFact:'lastSpecialHealthExamDate',months:6,days:0};
  const c:Context={facts:{lastSpecialHealthExamDate:{value:'2023-08-31',status:'VERIFIED'}},dates:{}};
  expect(calculateDeadline(r,'2026-10-12',c)).toMatchObject({dueDate:'2024-02-29',periodKey:'lastSpecialHealthExamDate:2023-08-31'});
  expect(calculateDeadline(r,'2026-10-12',context)).toMatchObject({dueDate:null,missingTrigger:'FACT:lastSpecialHealthExamDate'});
  expect(()=>calculateDeadline({...r,triggerFact:'password'},'2026-10-12',c)).toThrow();
 });
 it('does not infer tax or social insurance classification from employee count',()=>{
  expect(()=>parseRule({fact:'vatFilingFrequency',op:'eq',value:'guessed'})).toThrow();
  expect(evaluate({fact:'socialInsuranceSubject',op:'eq',value:'yes'},context).decision).toBe('NEEDS_INFORMATION');
  expect(evaluate({fact:'vatFilingFrequency',op:'eq',value:'quarterly'},{facts:{vatFilingFrequency:{value:'monthly',status:'USER_CONFIRMED'}},dates:{}}).decision).toBe('NOT_APPLY');
 });
 it('does not invent dates for missing triggers',()=>{expect(calculateDeadline({kind:'OFFSET',trigger:'EVENT',days:30},'2026-10-12',context).dueDate).toBeNull();});
 it('adds calendar days across leap years',()=>{expect(calculateDeadline({kind:'OFFSET',trigger:'FOUNDED',days:1},'2024-02-28',{...context,dates:{founded:'2024-02-28'}}).dueDate).toBe('2024-02-29');});
 it('keeps overdue annual periods instead of rolling them away',()=>{expect(calculateDeadline({kind:'ANNUAL',month:3,day:'LAST'},'2026-10-12',context)).toMatchObject({dueDate:'2026-03-31',periodKey:'2026'});});
 it('picks the quarter whose filing falls due in the current quarter, not the quarter still running',()=>{
  const r={kind:'QUARTERLY',monthsAfterEnd:1,day:'LAST'};
  expect(calculateDeadline(r,'2026-10-21',context)).toMatchObject({dueDate:'2026-10-31',periodKey:'2026-Q3'});
  // Overdue periods stay visible until the next cycle instead of rolling away.
  expect(calculateDeadline(r,'2026-12-20',context)).toMatchObject({dueDate:'2026-10-31',periodKey:'2026-Q3'});
  expect(calculateDeadline(r,'2027-01-01',context)).toMatchObject({dueDate:'2027-01-31',periodKey:'2026-Q4'});
  expect(calculateDeadline({...r,day:20},'2026-02-10',context)).toMatchObject({dueDate:'2026-01-20',periodKey:'2025-Q4'});
 });
 it('generates monthly periods from the evaluation date so users never type a period end',()=>{
  const r={kind:'MONTHLY',monthsAfterEnd:1,day:20};
  expect(calculateDeadline(r,'2026-10-21',context)).toMatchObject({dueDate:'2026-10-20',periodKey:'2026-09'});
  expect(calculateDeadline(r,'2026-11-01',context)).toMatchObject({dueDate:'2026-11-20',periodKey:'2026-10'});
  expect(calculateDeadline(r,'2027-01-05',context)).toMatchObject({dueDate:'2027-01-20',periodKey:'2026-12'});
  expect(calculateDeadline({...r,day:'LAST'},'2024-03-02',context)).toMatchObject({dueDate:'2024-03-31',periodKey:'2024-02'});
  expect(calculateDeadline({...r,monthsAfterEnd:2,day:'LAST'},'2026-03-15',context)).toMatchObject({dueDate:'2026-03-31',periodKey:'2026-01'});
 });
 it('derives fiscal-year periods from a stable fiscal year end',()=>{
  const fy=(value:string):Context=>({facts:{fiscalYearEnd:{value,status:'USER_CONFIRMED'}},dates:{}});
  expect(calculateDeadline({kind:'FISCAL_YEAR_END_OFFSET',days:90},'2026-10-21',fy('12-31'))).toMatchObject({dueDate:'2026-03-31',periodKey:'FY2025'});
  expect(calculateDeadline({kind:'FISCAL_YEAR_END_OFFSET',days:0},'2026-10-21',fy('12-31'))).toMatchObject({dueDate:'2026-12-31',periodKey:'FY2026'});
  expect(calculateDeadline({kind:'FISCAL_YEAR_END_OFFSET',months:12},'2026-10-21',fy('12-31'))).toMatchObject({dueDate:'2026-12-31',periodKey:'FY2025'});
  expect(calculateDeadline({kind:'FISCAL_YEAR_END_OFFSET',days:90},'2026-10-21',fy('03-31'))).toMatchObject({dueDate:'2026-06-29',periodKey:'FY2026'});
  expect(calculateDeadline({kind:'FISCAL_YEAR_END_OFFSET',days:90},'2026-10-21',context)).toMatchObject({dueDate:null,missingTrigger:'FACT:fiscalYearEnd'});
  expect(()=>parseRule({fact:'fiscalYearEnd',op:'eq',value:'12-30'})).toThrow();
 });
 it('uses Vietnam calendar date at UTC boundaries',()=>{expect(localDate(new Date('2026-10-11T18:00:00Z'))).toBe('2026-10-12');});
});
// Fixture only: real years are added to working-calendar.ts after checking the official notice.
const calendar:WorkingCalendar={years:{'2030':{nonWorkingDays:['2030-04-30','2030-05-01','2030-05-02'],workingDays:['2030-05-04'],source:'test fixture',approvedBy:'test',approvedAt:'2030-01-01'}}};
describe('working-day shift',()=>{
 it('moves over weekends and approved holidays, honouring make-up working days',()=>{
  expect(nextWorkingDay('2030-04-27',calendar)).toEqual({date:'2030-04-29',status:'APPLIED'});
  expect(nextWorkingDay('2030-04-30',calendar)).toEqual({date:'2030-05-03',status:'APPLIED'});
  expect(nextWorkingDay('2030-05-04',calendar)).toEqual({date:'2030-05-04',status:'APPLIED'});
  expect(nextWorkingDay('2030-05-06',calendar)).toEqual({date:'2030-05-06',status:'APPLIED'});
 });
 it('keeps the earlier legal date when the year is not approved, including across a year boundary',()=>{
  expect(nextWorkingDay('2031-01-04',calendar)).toEqual({date:'2031-01-04',status:'UNAVAILABLE'});
  expect(nextWorkingDay('2030-12-31',{years:{'2030':{...calendar.years['2030'],nonWorkingDays:['2030-12-31']}}})).toEqual({date:'2030-12-31',status:'UNAVAILABLE'});
 });
 it('applies only when the rule asks for it and reports the legal date separately',()=>{
  const r={kind:'MONTHLY',monthsAfterEnd:1,day:'LAST'} as const;
  expect(calculateDeadline(r,'2030-04-02',{...context,calendar})).toMatchObject({dueDate:'2030-04-30',calendarStatus:'NOT_REQUESTED'});
  expect(calculateDeadline({...r,shift:'NEXT_WORKING_DAY'},'2030-04-02',{...context,calendar})).toMatchObject({dueDate:'2030-05-03',legalDueDate:'2030-04-30',calendarStatus:'APPLIED'});
  expect(calculateDeadline({...r,shift:'NEXT_WORKING_DAY'},'2030-04-02',context)).toMatchObject({dueDate:'2030-04-30',calendarStatus:'UNAVAILABLE'});
 });
 it('keeps parsed content unchanged when shift is absent',()=>{expect(parseRule({fact:'stage',op:'exists'})).toEqual({fact:'stage',op:'exists'});});
});
describe('derived facts and question ranking',()=>{
 const derived=[{fact:'socialInsuranceSubject',rule:{fact:'employeeCount',op:'gt',value:0},citation:'test',approvedBy:'test',approvedAt:'2030-01-01'}];
 it('decides a conclusion from observable inputs and asks for the inputs when undecided',()=>{
  const yes=applyDerivedFacts({facts:{employeeCount:{value:3,status:'USER_CONFIRMED'}},dates:{}},derived);
  expect(yes.facts.socialInsuranceSubject).toEqual({value:'yes',status:'DERIVED'});
  const unknown=applyDerivedFacts({facts:{},dates:{}},derived);
  expect(unknown.facts.socialInsuranceSubject?.derivedMissing).toEqual(['employeeCount']);
  // A user's own answer is kept while the derivation cannot decide.
  expect(applyDerivedFacts({facts:{socialInsuranceSubject:{value:'no',status:'USER_CONFIRMED'}},dates:{}},derived).facts.socialInsuranceSubject).toEqual({value:'no',status:'USER_CONFIRMED'});
  expect(()=>applyDerivedFacts({facts:{},dates:{}},[{...derived[0],fact:'password'}])).toThrow();
 });
 it('ranks the questions that hold back the most items',()=>{
  const ranked=rankMissingFacts([{decision:'NEEDS_INFORMATION',missingFacts:['employeeCount','stage']},{decision:'NEEDS_INFORMATION',missingFacts:['employeeCount','date:FACT:fiscalYearEnd']},{decision:'APPLY',missingFacts:['stage']},{decision:'NEEDS_INFORMATION',missingFacts:['date:FOUNDED']}]);
  expect(ranked.map(x=>[x.fact,x.pending])).toEqual([['employeeCount',2],['fiscalYearEnd',1],['FOUNDED',1],['stage',1]]);
  expect(ranked.find(x=>x.fact==='FOUNDED')?.label).toBe('ngày thành lập');
 });
});
