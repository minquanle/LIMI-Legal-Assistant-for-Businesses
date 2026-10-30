import test from 'node:test';
import assert from 'node:assert/strict';
import {parseRule,deadlineSchema} from '../../tinix-legal/packages/compliance-core/dist/index.js';
import {reviewGroups,readRule,alterRule,readDeadline,ruleText} from '../dist/reviewer-controls.js';

const form=values=>{const f=new FormData();for(const [k,v] of Object.entries(values))for(const x of Array.isArray(v)?v:[v])f.append(k,String(x));return f;};

test('review counts use latest checklist versions and keep categories separate',()=>{
 const row=(id,version,status,group)=>({id:id+version,obligationId:id,version,status,contentJson:{group}});
 const groups=reviewGroups([row('a',1,'PUBLISHED','tax'),row('a',2,'DRAFT','tax'),row('b',1,'IN_REVIEW','labor'),row('c',1,'PUBLISHED','tax')],{tax:'Thuế',labor:'Lao động'});
 assert.deepEqual(groups.map(g=>[g.items.length,g.pending,g.published]),[[2,1,1],[1,1,0]]);
});

test('nested rules preserve any, not, multiselect and zero thresholds',()=>{
 const model={all:[{fact:'employeeCount',op:'gte',value:0},{any:[{fact:'employees',op:'in',value:['10-49','50-99']},{not:{fact:'province',op:'eq',value:'Hưng Yên'}}]}]};
 const fd=form({'rule-kind-root':'all','rule-fact-root.0':'employeeCount','rule-op-root.0':'gte','rule-value-root.0':'0','rule-kind-root.1':'any','rule-fact-root.1.0':'employees','rule-op-root.1.0':'in','rule-value-root.1.0':['10-49','50-99'],'rule-fact-root.1.1.not':'province','rule-op-root.1.1.not':'eq','rule-value-root.1.1.not':'Hưng Yên'});
 assert.deepEqual(readRule(model,fd),model);
 assert.deepEqual(parseRule(readRule(model,fd)),model);
 assert.match(ruleText(model),/10–49 nhân viên/);
 fd.set('rule-value-root.0','');assert.equal(readRule(model,fd).all[0].value,'');
});

test('changing a fact clears its previous value and additions can be removed',()=>{
 const model={fact:'province',op:'eq',value:'Hưng Yên'};
 assert.deepEqual(readRule(model,form({'rule-fact-root':'employeeCount','rule-op-root':'eq','rule-value-root':'Hưng Yên'})),{fact:'employeeCount',op:'eq',value:''});
 const added=alterRule(model,'root','add');assert.equal(added.all.length,2);
 alterRule(added,'root.1','remove');assert.deepEqual(added.all,[model]);
});

for(const deadline of [{kind:'NONE'},{kind:'FIXED',date:'2026-12-31'},{kind:'OFFSET',trigger:'EVENT',days:10},{kind:'ANNUAL',month:3,day:'LAST'},{kind:'QUARTERLY',monthsAfterEnd:1,day:20},{kind:'DATE_OFFSET',triggerFact:'companyRegistrationDate',months:0,days:10},{kind:'PERIOD_END',periodEndFact:'vatMonthlyPeriodEndDate',monthsAfterEnd:1,day:'LAST'},{kind:'REVIEW_PERIOD',period:'YEAR'},{kind:'MONTHLY',monthsAfterEnd:1,day:20},{kind:'MONTHLY',monthsAfterEnd:1,day:'LAST',shift:'NEXT_WORKING_DAY'},{kind:'QUARTERLY',monthsAfterEnd:1,day:'LAST',shift:'NEXT_WORKING_DAY'},{kind:'FISCAL_YEAR_END_OFFSET',months:0,days:90}]){
 test('deadline controls preserve '+deadline.kind+(deadline.shift?' with shift':''),()=>{
  const fd=form(Object.fromEntries(Object.entries(deadline).map(([k,v])=>['deadline-'+k,v])));
  assert.deepEqual(readDeadline(fd),deadline);
  assert.deepEqual(deadlineSchema.parse(readDeadline(fd)),deadline);
 });
}
