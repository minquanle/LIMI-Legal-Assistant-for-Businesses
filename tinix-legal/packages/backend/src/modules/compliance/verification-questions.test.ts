import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {evaluate,reuseProfileFacts,type Context} from '@limi/compliance-core';
import {verificationPlan} from './verification-questions.js';
const fixture=JSON.parse(readFileSync(new URL('./fixtures/verification-57.json',import.meta.url),'utf8'));
describe('verification of the 57 pending checklists',()=>{
 it('covers every current checklist with a question or an existing explicit observation',()=>{
  expect(fixture.items).toHaveLength(57);
  for(const item of fixture.items){
   const current=evaluate(item.rule,{facts:fixture.facts,dates:{}});
   const plan=verificationPlan(item,fixture.facts,fixture.profile,current.missingFacts);
   if(current.decision==='NEEDS_INFORMATION')expect(plan.questions.length,item.title).toBeGreaterThan(0);
   for(const q of plan.questions){expect(q.label,item.title).toMatch(/\?$/);expect(q.label).not.toMatch(/^(has|uses|claims|provides|processes)/);expect(q.fact).not.toBe('employeeCount');}
  }
 });
 it('reuses the workforce range and never asks exact count for a threshold it already resolves',()=>{
  const rule={all:[{fact:'employeeCount',op:'gt',value:0},{fact:'hasOvertime',op:'eq',value:'yes'}]};
  const plan=verificationPlan({rule},fixture.facts,{},['hasOvertime']);
  expect(plan.knownFacts).toContainEqual(expect.objectContaining({fact:'employees',text:'10–49 nhân viên'}));
  expect(plan.questions.map(q=>q.fact)).toEqual(['hasOvertime']);
  expect(evaluate({fact:'employeeCount',op:'gte',value:20},{facts:fixture.facts,dates:{}}).decision).toBe('NEEDS_INFORMATION');
 });
 it('only reuses equivalent positive observations and preserves explicit contrary answers',()=>{
  const c={facts:fixture.facts,dates:{}} as Context;
  expect(reuseProfileFacts(c).facts.usesThirdPartyIp).toMatchObject({value:'yes',reusedFrom:'signals'});
  expect(c.facts.usesThirdPartyIp).toBeUndefined();
  const changed=reuseProfileFacts({facts:{...c.facts,usesThirdPartyIp:{value:'no',status:'USER_CONFIRMED'}},dates:{}});
  expect(changed.facts.usesThirdPartyIp!.value).toBe('no');
  const broad=reuseProfileFacts({facts:{signals:{value:['foreign','ads','customerData'],status:'USER_CONFIRMED'}},dates:{}});
  for(const key of ['usesThirdPartyIp','hasForeignWorkers','hasAdvertising','processesPersonalData','foreignContractorVatWithholdingRequired'])expect((broad.facts as any)[key]).toBeUndefined();
 });
 it('one shared answer updates all relevant rules, but unknown remains unresolved',()=>{
  for(const key of new Set<string>(fixture.items.flatMap((x:any)=>x.missing))){
   const related=fixture.items.filter((x:any)=>x.missing.includes(key));
   for(const item of related){
    const facts={...fixture.facts,[key]:{value:null,status:'UNKNOWN'}};
    if(key==='usesThirdPartyIp'){expect(evaluate(item.rule,{facts,dates:{}}).decision).toBe('APPLY');continue;}
    expect(evaluate(item.rule,{facts,dates:{}}).decision,item.title).toBe('NEEDS_INFORMATION');
    const d=verificationPlan(item,facts,{},[key]).questions[0];expect(d,item.title).toBeDefined();
    for(const [value] of d.options??[]){const next={...facts,[key]:{value,status:'USER_CONFIRMED'}};
     expect(verificationPlan(item,next,{},evaluate(item.rule,{facts:next as any,dates:{}}).missingFacts).questions.some(q=>q.fact===key),item.title).toBe(false);
    }
   }
  }
 });
 it('keeps legal classifications explicitly marked rather than replacing them by guessed facts',()=>{
  for(const key of ['corporateIncomeTaxRequired','foreignContractorVatWithholdingRequired','annualFinancialSubmissionCase','annualFinancialDisclosureCase','socialInsuranceEmployerRegistrationRequired']){
   const item=fixture.items.find((x:any)=>x.missing.includes(key));const q=verificationPlan(item,fixture.facts,{},[key]).questions[0];
   expect(q.specialist).toBe(true);expect(q.label).toMatch(/[Kk]ế toán|[Nn]hân sự/);
  }
 });
});
