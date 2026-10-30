import {describe,it,expect} from 'vitest';
import {factsSchema,confirmedFacts} from './contracts.js';
describe('confirmed checklist facts',()=>{
 it('keeps absent dates and classifications unknown',()=>{
  const f=confirmedFacts(factsSchema.parse({}), 'test-actor');
  expect(f.vatFilingFrequency.status).toBe('UNKNOWN');
  expect(f.companyRegistrationDate.value).toBeNull();
  expect(f.socialInsuranceCoverageStartDate.value).toBeNull();
  expect(f.capitalContributionDeadlineCase.status).toBe('UNKNOWN');
 });
 it('rejects unsupported classifications and non-month-end reporting dates',()=>{
  expect(()=>factsSchema.parse({vatFilingFrequency:'guess'})).toThrow();
  expect(()=>factsSchema.parse({vatQuarterPeriodEndDate:'2026-09-29'})).toThrow();
  expect(factsSchema.parse({vatQuarterPeriodEndDate:'2026-08-31'}).vatQuarterPeriodEndDate).toBe('2026-08-31');
  expect(()=>factsSchema.parse({salaryPaymentDate:'2026-02-30'})).toThrow();
  expect(()=>factsSchema.parse({capitalContributionDeadlineCase:'guess'})).toThrow();
  expect(factsSchema.parse({socialInsuranceCoverageStartDate:'2026-09-15'}).socialInsuranceCoverageStartDate).toBe('2026-09-15');
 });
 it('keeps new sector classifications unknown and accepts explicit date facts',()=>{
  const value=confirmedFacts(factsSchema.parse({processesPersonalData:'yes',firstPersonalDataProcessingDate:'2026-08-14',accountingRegime:'TT99'}),'actor');
  expect(value.processesPersonalData.value).toBe('yes');expect(value.processesPersonalData.status).toBe('USER_CONFIRMED');
  expect(value.firstPersonalDataProcessingDate.value).toBe('2026-08-14');expect(value.hasBusinessPremises.status).toBe('UNKNOWN');
  expect(value.environmentalPermitRequired.status).toBe('UNKNOWN');expect(value.plansDissolution.status).toBe('UNKNOWN');
  expect(()=>factsSchema.parse({accountingRegime:'TT200'})).toThrow();expect(()=>factsSchema.parse({firstCrossBorderDataTransferDate:'2026-02-30'})).toThrow();
 });
 it('stores the fiscal year end once as a stable quarter-end, not a date per year',()=>{
  expect(confirmedFacts(factsSchema.parse({fiscalYearEnd:'12-31'}),'actor').fiscalYearEnd).toMatchObject({value:'12-31',status:'USER_CONFIRMED'});
  expect(confirmedFacts(factsSchema.parse({}),'actor').fiscalYearEnd.status).toBe('UNKNOWN');
  expect(()=>factsSchema.parse({fiscalYearEnd:'12-30'})).toThrow();
 });
});
