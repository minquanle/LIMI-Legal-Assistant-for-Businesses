import {CHECKLIST_PROFILE_FACTS,evaluate,reuseProfileFacts,type Context,type Rule,type Field} from '@limi/compliance-core';

// Presentation wording only: conditions, legal classifications and citations stay in the
// immutable published version. A specialist's confirmation is never invented from a broad signal.
const prompts:Record<string,string>={
 hasAccountingStaffChange:'Doanh nghiệp có thay đổi người làm kế toán không?',hasBonusScheme:'Doanh nghiệp có chế độ thưởng cho người lao động không?',
 usesElectronicContracts:'Doanh nghiệp có ký hoặc giao kết hợp đồng bằng phương tiện điện tử không?',
 hasProductionBusinessBase:'Có cơ sở sản xuất, kinh doanh cần quản lý an toàn lao động không?',
 corporateIncomeTaxRequired:'Theo xác nhận của kế toán, doanh nghiệp có thuộc diện thuế thu nhập doanh nghiệp không?',
 hasNotarialTransactions:'Doanh nghiệp có giao dịch cần công chứng hoặc đã chọn công chứng không?',claimsSmeSupport:'Doanh nghiệp có dự định đề nghị hỗ trợ dành cho doanh nghiệp nhỏ và vừa không?',
 handlesConsumerTransactions:'Doanh nghiệp có bán hàng hoặc cung cấp dịch vụ cho người mua để tiêu dùng, sinh hoạt không?',
 hasRemoteConsumerTransactions:'Có giao dịch với người tiêu dùng qua điện thoại, mạng hoặc phương tiện từ xa không?',
 annualFinancialDisclosureCase:'Kế toán đã xác nhận trường hợp công khai báo cáo tài chính năm nào cho doanh nghiệp?',
 operatesEcommercePlatform:'Doanh nghiệp có vận hành nền tảng thương mại điện tử cho các bên giao dịch không?',
 usesStandardConsumerContracts:'Doanh nghiệp có dùng hợp đồng soạn sẵn theo mẫu để giao kết với người tiêu dùng không?',
 hasConsumerWarranty:'Có sản phẩm được doanh nghiệp bảo hành theo thỏa thuận hoặc theo yêu cầu bắt buộc không?',
 hasHazardousWork:'Có công việc tiếp xúc với yếu tố nguy hiểm hoặc có hại tại nơi làm việc không?',
 providesFoodServices:'Doanh nghiệp có cơ sở phục vụ ăn uống không?',producesFood:'Doanh nghiệp có trực tiếp sản xuất thực phẩm không?',
 plansDissolution:'Doanh nghiệp có dự định giải thể không?',
 hasSpecialHealthExamWorkers:'Theo hồ sơ nhân sự đã đối chiếu, có nhóm lao động cần khám sức khỏe tối thiểu sáu tháng một lần không?',
 usesSalaryDeductions:'Có khấu trừ lương để bồi thường thiệt hại tài sản không?',hasTemporaryJobTransfers:'Có tạm chuyển người lao động sang công việc khác với hợp đồng không?',
 hasOvertime:'Doanh nghiệp có tổ chức làm thêm giờ không?',hasNightWork:'Có người làm việc ban đêm không?',hasProbation:'Doanh nghiệp có sử dụng lao động thử việc không?',
 hasForeignWorkers:'Doanh nghiệp có sử dụng người lao động nước ngoài không?',claimsTaxIncentives:'Doanh nghiệp có dự định áp dụng ưu đãi, miễn hoặc giảm thuế không?',
 hasAdvertising:'Doanh nghiệp có quảng cáo hàng hóa hoặc dịch vụ không?',usesThirdPartyIp:'Doanh nghiệp có dùng phần mềm, hình ảnh, nhạc hoặc nội dung của bên khác không?',
 usesElectronicAccountingDocuments:'Kế toán có sử dụng chứng từ điện tử không?',claims2026TaxExtension:'Doanh nghiệp có dự định áp dụng gia hạn thuế hoặc tiền thuê đất năm 2026 không?',
 annualFinancialSubmissionCase:'Kế toán đã xác nhận trường hợp hạn nộp báo cáo tài chính năm nào?',
 socialInsuranceEmployerRegistrationRequired:'Theo xác nhận của nhân sự, có người thuộc diện doanh nghiệp phải nộp hồ sơ tham gia BHXH không?',
 hasMinorWorkers:'Doanh nghiệp có sử dụng người lao động dưới 18 tuổi không?',usesConsumerContracts:'Có sử dụng hợp đồng giao dịch với người tiêu dùng không?',
 collectsConsumerData:'Doanh nghiệp có thu thập thông tin của người tiêu dùng không?',
 hasEmployeeRecoveryApplications:'Có người nghỉ dưỡng sức, phục hồi sức khỏe sau ốm đau hoặc thai sản không?',
 foreignContractorVatWithholdingRequired:'Theo xác nhận của kế toán, có khoản thanh toán nhà thầu nước ngoài phải khấu trừ GTGT không?',
 providesContinuousConsumerServices:'Doanh nghiệp có cung cấp dịch vụ liên tục cho người tiêu dùng không?',
 hasOrdinaryHealthExamWorkers:'Theo hồ sơ nhân sự đã đối chiếu, có nhóm lao động khám sức khỏe hằng năm không?',
 hasContractAmendments:'Doanh nghiệp có sửa đổi hoặc bổ sung hợp đồng lao động không?',
 sellsConsumerGoods:'Doanh nghiệp có cung cấp sản phẩm, hàng hóa cho người tiêu dùng không?',hasLaborTermination:'Có phát sinh chấm dứt hợp đồng lao động không?',
 hasTaxRegistrationChanges:'Có thay đổi thông tin đăng ký thuế cần xử lý không?',accountingRegime:'Kế toán đang áp dụng chế độ kế toán nào?',
 paysPersonalIncome:'Doanh nghiệp có chi trả thu nhập cho cá nhân cần kế toán xét khấu trừ thuế không?',
 hasInsuranceBenefitApplications:'Có hồ sơ đề nghị hưởng chế độ ốm đau hoặc thai sản của người lao động không?',
 processesPersonalData:'Doanh nghiệp có thu thập, lưu hoặc sử dụng thông tin nhận diện một cá nhân không?',
 hasInvoiceErrors:'Có hóa đơn điện tử đã lập sai cần xử lý không?',hasLaborAccident:'Có phát sinh tai nạn lao động cần xử lý không?'
};
const labels:Record<string,string>={employeeCount:'Số lao động',employees:'Quy mô lao động',stage:'Giai đoạn hoạt động',activity:'Hoạt động',channels:'Kênh bán',places:'Cơ sở',signals:'Tình huống đã khai',province:'Tỉnh/thành phố',...Object.fromEntries(CHECKLIST_PROFILE_FACTS.map(f=>[f.key,f.label]))};
const promptHelp:Record<string,string>={
 hasProductionBusinessBase:'Đối chiếu với người phụ trách an toàn lao động nếu chưa rõ. Chỉ khai có văn phòng hoặc cửa hàng chưa đủ xác nhận phạm vi của mục này.',
 hasAdvertising:'Hồ sơ “Quảng cáo/khuyến mại” là thông tin tổng quát. Câu hỏi này chỉ xác nhận doanh nghiệp có thực hiện quảng cáo.',
 hasForeignWorkers:'Yếu tố nước ngoài trong hồ sơ có thể là giao dịch hoặc đầu tư; không đồng nghĩa có sử dụng lao động nước ngoài.',
 operatesEcommercePlatform:'Phân biệt việc vận hành nền tảng cho các bên giao dịch với chỉ bán hàng trên website của doanh nghiệp.',
 handlesConsumerTransactions:'Không suy ra chỉ từ kênh website hay bán trực tiếp. Xác nhận mục đích mua để tiêu dùng, sinh hoạt của khách hàng.'
};
const display:Record<string,string>={'10-49':'10–49 nhân viên','1-9':'1–9 nhân viên','50-99':'50–99 nhân viên','100+':'Từ 100 nhân viên','0':'Không có nhân viên',running:'Đang hoạt động',new:'Mới thành lập',changing:'Đang thay đổi',paused:'Tạm ngừng',yes:'Có',no:'Không'};
function leaves(r:Rule):Extract<Rule,{fact:Field}>[]{return 'all'in r?r.all.flatMap(leaves):'any'in r?r.any.flatMap(leaves):'not'in r?leaves(r.not):[r];}
export type VerificationQuestion={fact:string,label:string,help:string,specialist:boolean,kind:string,options:readonly (readonly [string,string])[]|null};
export function verificationPlan(content:{rule:unknown},facts:Context['facts'],profile:any,missing:readonly string[]){
 const context=reuseProfileFacts({facts:{...facts,province:{value:profile.province||null,status:profile.province?'USER_CONFIRMED':'UNKNOWN'}},dates:{founded:profile.founded||undefined}});
 const known: {fact:string,label:string,value:unknown,text:string,source:string}[]=[];
 for(const leaf of leaves(content.rule as Rule)){
  const answer=evaluate(leaf,context);if(answer.decision==='NEEDS_INFORMATION')continue;
  const key=leaf.fact==='employeeCount'&&(!facts.employeeCount||facts.employeeCount.status==='UNKNOWN'||facts.employeeCount.value==null)?'employees':leaf.fact;
  const f=context.facts[key];if(!f||known.some(x=>x.fact===key))continue;
  const def=CHECKLIST_PROFILE_FACTS.find(d=>d.key===key);
  const text=def?.options?.find(o=>o[0]===f.value)?.[1]??display[String(f.value)]??String(f.value);
  known.push({fact:key,label:labels[key]??key,value:f.value,text,source:f.reusedFrom?'Hồ sơ đã khai: nội dung bên thứ ba':'Hồ sơ doanh nghiệp'});
 }
 const questions=[...new Set(missing)].flatMap<VerificationQuestion>(raw=>{
  const key=raw.replace(/^date:(FACT:)?/,'');const f=context.facts[key as Field];
  // Exact count can still be needed for a threshold inside an existing range.
  if(key!=='employeeCount'&&f&&f.status!=='UNKNOWN'&&f.value!=null)return [];
  const d=CHECKLIST_PROFILE_FACTS.find(x=>x.key===key);
  if(d)return [{fact:key,label:prompts[key]??`${d.label}?`,help:promptHelp[key]??(d.help.startsWith('Chỉ xác nhận sau khi đối chiếu')?'':d.help),specialist:d.tier==='LEGAL_CONCLUSION',kind:d.kind,options:d.options}];
  if(key==='employeeCount')return [{fact:key,label:'Có bao nhiêu người lao động tại thời điểm cần kiểm tra?',help:'Chỉ hỏi số chính xác khi khoảng quy mô đã khai chưa đủ phân biệt ngưỡng áp dụng.',specialist:false,kind:'number',options:null}];
  return [];
 });
 return {knownFacts:known,questions};
}
