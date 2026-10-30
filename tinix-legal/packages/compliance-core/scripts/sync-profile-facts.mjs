// Nguồn duy nhất của danh sách trường hồ sơ là src/profile-facts.ts.
// Script này (1) bổ sung tier/deprecated cho từng trường và (2) sinh lại Prototype/dist/checklist-facts.js
// để UI không phải chép tay. Chạy: node packages/compliance-core/scripts/sync-profile-facts.mjs
import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
const here=dirname(fileURLToPath(import.meta.url));
const corePath=resolve(here,'../src/profile-facts.ts');
const uiPath=resolve(here,'../../../../Prototype/dist/checklist-facts.js');

// Câu hỏi bắt doanh nghiệp tự đưa ra kết luận pháp lý: mục tiêu là để engine suy ra (derived-facts.ts) sau khi chuyên gia duyệt.
const LEGAL_CONCLUSION=new Set(['inKindAllowanceEligibilityConfirmed','socialInsuranceSubject','socialInsuranceMonthlyExemption','vatFilingRequired','annualFinancialSubmissionCase','annualFinancialDisclosureCase','businessConditionsRequired','capitalContributionDeadlineCase','isMicroEnterprise','electronicInvoiceRequired','hasTaxFilingObligations','socialInsuranceEmployerRegistrationRequired','personalDataImpactFilingRequired','crossBorderImpactFilingRequired','hasBusinessPremises','fireDesignApprovalRequired','mandatoryFireInsuranceRequired','fireAlarmConnectionRequired','environmentalImpactAssessmentRequired','environmentalPermitRequired','environmentalRegistrationRequired','eprRecyclingRequired','foodSelfDeclarationRequired','foodProductRegistrationRequired','foodCertificateRequired','healthInsuranceEmployerRequired','unemploymentInsuranceEmployerRequired','corporateIncomeTaxRequired','hasBeneficialOwners','hasRelatedPartyTransactions','consumerContractRegistrationRequired','foreignContractorVatWithholdingRequired']);
// Ngày của một kỳ/lần thực hiện, không phải thuộc tính của doanh nghiệp.
const PERIOD=new Set(['salaryPaymentDate','lastSpecialHealthExamDate','socialInsuranceContributionPeriodEndDate','vatMonthlyPeriodEndDate','vatQuarterPeriodEndDate','accountingFiscalYearEndDate','socialInsuranceCoverageStartDate','internalRegulationsIssuedDate']);
// Đã có kiểu hạn thay thế (MONTHLY / QUARTERLY / FISCAL_YEAR_END_OFFSET): ẩn khỏi form, giữ để phiên bản cũ còn đọc được.
// Nhóm Hưng Yên đã bỏ khỏi sản phẩm: ẩn 3 câu hỏi địa phương, giữ trong registry để dữ liệu và phiên bản cũ còn đọc được.
const DEPRECATED=new Set(['socialInsuranceContributionPeriodEndDate','vatMonthlyPeriodEndDate','vatQuarterPeriodEndDate','accountingFiscalYearEndDate','hasHungYenLandLease','hasHungYenLandProcedure','hasHungYenInspection']);
const FISCAL_YEAR_END={key:'fiscalYearEnd',label:'Kỳ kế toán năm kết thúc vào ngày',group:'Kế toán',kind:'enum',options:[['12-31','31/12'],['03-31','31/03'],['06-30','30/06'],['09-30','30/09']],help:'Kỳ kế toán năm gồm 12 tháng; nếu doanh nghiệp không áp dụng kỳ khác thì theo năm dương lịch (31/12). Chỉ nhập một lần, hệ thống tự tính từng năm.'};

const source=readFileSync(corePath,'utf8');
const match=source.match(/export const CHECKLIST_PROFILE_FACTS = (\[[\s\S]*?\n\]) as const;/);
if(!match)throw Error('CHECKLIST_PROFILE_FACTS not found');
let facts=JSON.parse(match[1]);
if(!facts.some(f=>f.key==='fiscalYearEnd')){const at=facts.findIndex(f=>f.key==='accountingFiscalYearEndDate');facts.splice(at+1,0,FISCAL_YEAR_END);}
facts=facts.map(({tier,deprecated,...f})=>({...f,tier:LEGAL_CONCLUSION.has(f.key)?'LEGAL_CONCLUSION':PERIOD.has(f.key)?'PERIOD':'OBSERVABLE',deprecated:DEPRECATED.has(f.key)}));
for(const key of [...LEGAL_CONCLUSION,...PERIOD])if(!facts.some(f=>f.key===key))throw Error('Unknown fact '+key);
const body=JSON.stringify(facts,null,2);
writeFileSync(corePath,source.replace(match[0],`export const CHECKLIST_PROFILE_FACTS = ${body} as const;`));

const ui=readFileSync(uiPath,'utf8');
const uiMatch=ui.match(/export const checklistFacts = (\[[\s\S]*?\n\]);/);
if(!uiMatch)throw Error('checklistFacts not found in UI file');
const header='// Sinh từ tinix-legal/packages/compliance-core/src/profile-facts.ts bằng scripts/sync-profile-facts.mjs — không sửa tay.\n';
writeFileSync(uiPath,(ui.startsWith(header)?'':header)+ui.replace(uiMatch[0],`export const checklistFacts = ${body};`));
const count=t=>facts.filter(f=>f.tier===t).length;
console.log(JSON.stringify({total:facts.length,observable:count('OBSERVABLE'),legalConclusion:count('LEGAL_CONCLUSION'),period:count('PERIOD'),deprecated:facts.filter(f=>f.deprecated).length}));
