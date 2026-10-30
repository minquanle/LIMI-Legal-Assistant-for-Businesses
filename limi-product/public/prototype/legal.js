import { checklistTemplateById } from './mock-db.js?v=6';

// Nguồn chính thức được chọn để minh họa cấu trúc dữ liệu. Nội dung tóm tắt không thay thế toàn văn.
export const legalDocuments = [
  {
    id: 'ecommerce-law', code: '122/2025/QH15', title: 'Luật Thương mại điện tử', type: 'Luật', issuer: 'Quốc hội',
    issued: '2025-12-10', effective: '2026-07-01', category: 'commerce',
    url: 'https://vanban.chinhphu.vn/?classid=1&docid=216503&pageid=27160&typegroupid=3',
    focus: 'Điều 3, 11, 12, 16, 21 — phân loại nền tảng, thông tin công khai, đặt hàng và trách nhiệm người bán.',
    relatedTaskIds: ['website-commerce', 'marketplace'], relationship: 'Căn cứ chính cho website bán trực tiếp và người bán trên sàn.'
  },
  {
    id: 'ecommerce-decree', code: '248/2026/NĐ-CP', title: 'Quy định chi tiết một số điều của Luật Thương mại điện tử', type: 'Nghị định', issuer: 'Chính phủ',
    issued: '2026-06-30', effective: '2026-07-01', category: 'commerce',
    url: 'https://vanban.chinhphu.vn/?docid=218747&orggroupid=2&pageid=27160',
    focus: 'Điều 4–16, 23–25, 27 — nội dung chính sách và thủ tục thông báo/đăng ký theo mô hình.',
    relatedTaskIds: ['website-commerce'], relationship: 'Văn bản hướng dẫn cần đọc cùng Luật Thương mại điện tử.'
  },
  {
    id: 'labor-code', code: '45/2019/QH14', title: 'Bộ luật Lao động', type: 'Bộ luật', issuer: 'Quốc hội',
    issued: '2019-11-20', effective: '2021-01-01', category: 'labor',
    url: 'https://vanban.chinhphu.vn/?docid=198540&pageid=27160',
    companionUrl: 'https://vanban.chinhphu.vn/?docid=217002&pageid=27160',
    focus: 'Điều 13, 14 và 21 — nhận diện quan hệ lao động, hình thức và nội dung chủ yếu của hợp đồng.',
    relatedTaskIds: ['labor-contracts'], relationship: 'Có văn bản hợp nhất 18/VBHN-VPQH ngày 12/02/2026 để tiện đối chiếu.'
  },
  {
    id: 'wage-sanctions-2026', code: '283/2026/NĐ-CP', title: 'Xử phạt vi phạm hành chính trong lĩnh vực lao động, bảo hiểm xã hội và người lao động Việt Nam đi làm việc ở nước ngoài', type: 'Nghị định', issuer: 'Chính phủ',
    issued: '2026-07-15', effective: '2026-09-10', category: 'labor',
    url: 'https://congbao.chinhphu.vn/van-ban/nghi-dinh-so-283-2026-nd-cp-470103.htm',
    focus: 'Điều 7 và Điều 23 — hệ số phạt với tổ chức; vi phạm thang, bảng lương và trả lương; khung phạt theo số người bị ảnh hưởng; truy trả khoản thiếu kèm lãi.',
    relatedTaskIds: ['wage-sanctions-2026'], relationship: 'Nguồn cho cảnh báo đã có hiệu lực và checklist kiểm tra tiền lương theo từng hành vi.'
  },
  {
    id: 'invoice-254', code: '254/2026/NĐ-CP', title: 'Quy định về hóa đơn điện tử, chứng từ điện tử', type: 'Nghị định', issuer: 'Chính phủ',
    issued: '2026-06-30', effective: '2026-07-01', category: 'tax',
    url: 'https://congbao.chinhphu.vn/van-ban/nghi-dinh-so-254-2026-nd-cp-469957.htm',
    focus: 'Điều 4–17, 43 — lập, phân loại, gửi, truyền và lưu trữ hóa đơn; thay thế hai nghị định cũ.',
    relatedTaskIds: ['invoice-process'], relationship: 'Nguồn hiện hành cho checklist hóa đơn điện tử.'
  },
  {
    id: 'tax-extension-2026', code: '245/2026/NĐ-CP', title: 'Gia hạn thời hạn nộp thuế, tiền thuê đất trong năm 2026', type: 'Nghị định', issuer: 'Chính phủ',
    issued: '2026-06-27', effective: '2026-06-27', category: 'tax',
    url: 'https://vanban.chinhphu.vn/?classid=1&docid=218598&orggroupid=2&pageid=27160',
    focus: 'Điều 3–5 — đối tượng được gia hạn, thời gian gia hạn theo từng khoản và trình tự gửi một giấy đề nghị chậm nhất 02/11/2026.',
    relatedTaskIds: ['tax-extension-2026'], relationship: 'Nguồn cho cảnh báo cơ hội gia hạn và checklist theo từng kỳ thuế.'
  },
  {
    id: 'copyright-enforcement-2026', code: '38/CĐ-TTg', title: 'Tăng cường phòng ngừa, xử lý hoạt động xâm phạm quyền sở hữu trí tuệ', type: 'Công điện', issuer: 'Thủ tướng Chính phủ',
    issued: '2026-05-05', effective: '2026-05-05', category: 'commerce',
    url: 'https://vanban.chinhphu.vn/?docid=217999&pageid=27160',
    focus: 'Chỉ đạo tăng cường kiểm tra và xử lý xâm phạm sở hữu trí tuệ; là tín hiệu thực thi, không phải một luật bản quyền mới.',
    relatedTaskIds: ['copyright-enforcement-2026'], relationship: 'Nguồn cho cảnh báo rủi ro kiểm tra và checklist kiểm kê bằng chứng quyền sử dụng.'
  },
  {
    id: 'publishing-amendment-2026', code: '17/2026/QH16', title: 'Luật sửa đổi, bổ sung một số điều của Luật Xuất bản', type: 'Luật', issuer: 'Quốc hội',
    issued: '2026-08-24', effective: '2027-03-01', category: 'commerce',
    url: 'https://vanban.chinhphu.vn/?classid=1&docid=219485&pageid=27160&typegroupid=3',
    focus: 'Các nội dung sửa đổi liên quan xuất bản điện tử, ứng dụng AI, bảo vệ bản quyền số và trách nhiệm của một số nền tảng trung gian.',
    relatedTaskIds: ['publishing-law-2027'], relationship: 'Chỉ đối chiếu với doanh nghiệp xuất bản, học liệu hoặc nền tảng nội dung số.'
  },
  {
    id: 'notary-amendment-2026', code: '04/2026/QH16', title: 'Luật sửa đổi, bổ sung một số điều của Luật Công chứng', type: 'Luật', issuer: 'Quốc hội',
    issued: '2026-04-23', effective: '2027-01-01', category: 'commerce',
    url: 'https://vanban.chinhphu.vn/?classid=1&docid=218099&pageid=27160&typegroupid=3',
    focus: 'Sửa Điều 3 về giao dịch phải công chứng và Điều 44 về phạm vi địa bàn công chứng.',
    relatedTaskIds: ['notary-2027-review'], relationship: 'Nguồn cho cảnh báo sớm khi doanh nghiệp có giao dịch dự kiến cần công chứng.'
  },
  {
    id: 'invoice-base', code: '123/2020/NĐ-CP', title: 'Quy định về hóa đơn, chứng từ', type: 'Nghị định', issuer: 'Chính phủ',
    issued: '2020-10-19', effective: '2022-07-01', category: 'tax',
    url: 'https://vanban.chinhphu.vn/?docid=201365&lang=vi&pageid=27160',
    focus: 'Điều 15 về đăng ký hóa đơn (lịch sử); đã hết hiệu lực từ 01/07/2026 theo Điều 43 NĐ 254/2026.',
    status: 'superseded', relatedTaskIds: [], relationship: 'Chỉ tham chiếu giai đoạn trước 01/07/2026; không sinh checklist hiện hành.'
  },
  {
    id: 'invoice-amendment', code: '70/2025/NĐ-CP', title: 'Sửa đổi quy định về hóa đơn, chứng từ', type: 'Nghị định', issuer: 'Chính phủ',
    issued: '2025-03-20', effective: '2025-06-01', category: 'tax',
    url: 'https://vanban.chinhphu.vn/?classid=0&docid=213179&pageid=27160',
    focus: 'Khoản 11 Điều 1 sửa Điều 15 NĐ 123/2020 (lịch sử); hết hiệu lực từ 01/07/2026 theo Điều 43 NĐ 254/2026.',
    status: 'superseded', relatedTaskIds: [], relationship: 'Chỉ tham chiếu giai đoạn trước 01/07/2026; không sinh checklist hiện hành.'
  },
  {
    id: 'pdp-law', code: '91/2025/QH15', title: 'Luật Bảo vệ dữ liệu cá nhân', type: 'Luật', issuer: 'Quốc hội',
    issued: '2025-06-26', effective: '2026-01-01', category: 'data',
    url: 'https://chinhphu.vn/?pageid=27160&docid=214590&classid=1&typegroupid=3',
    focus: 'Luật đầu tiên điều chỉnh toàn diện việc thu thập, xử lý và bảo vệ dữ liệu cá nhân: quyền được biết/đồng ý/truy cập/chỉnh sửa/xóa và nghĩa vụ của bên xử lý dữ liệu; phân biệt dữ liệu cơ bản và nhạy cảm.',
    relatedTaskIds: ['personal-data'], relationship: 'Căn cứ chính cho việc rà soát cách thu thập và thông báo dữ liệu khách hàng.'
  },
  {
    id: 'ecom-tax', code: '117/2025/NĐ-CP', title: 'Quản lý thuế với hoạt động kinh doanh trên nền tảng thương mại điện tử của hộ, cá nhân', type: 'Nghị định', issuer: 'Chính phủ',
    issued: '2025-06-09', effective: '2025-07-01', category: 'tax',
    url: 'https://vanban.chinhphu.vn/?pageid=27160&docid=213883',
    focus: 'Sàn TMĐT có chức năng thanh toán khấu trừ và nộp thay thuế GTGT, TNCN cho người bán; người bán đối chiếu phần đã khấu trừ và nghĩa vụ tự kê khai còn lại.',
    relatedTaskIds: ['marketplace'], relationship: 'Bổ sung nghĩa vụ thuế khi bán qua sàn có chức năng thanh toán.'
  },
  {
    id: 'private-econ', code: '198/2025/QH15', title: 'Nghị quyết về cơ chế, chính sách đặc biệt phát triển kinh tế tư nhân', type: 'Nghị quyết', issuer: 'Quốc hội',
    issued: '2025-05-17', effective: '2026-01-01', category: 'tax',
    url: 'https://vbpl.vn/botuphap/Pages/vbpq-toanvan.aspx?ItemID=177591',
    focus: 'Bỏ thuế khoán với hộ, cá nhân kinh doanh và chấm dứt thu lệ phí môn bài từ 01/01/2026; hộ kinh doanh chuyển sang phương pháp kê khai.',
    relatedTaskIds: [], relationship: 'Nguồn cho cảnh báo sớm về thay đổi cách nộp thuế và lệ phí môn bài từ 2026.'
  }
];

// Checklist nền dùng cùng cấu trúc đánh giá chi tiết với checklist sinh từ văn bản.
// Khi chưa gắn căn cứ pháp lý cụ thể, refs để trống thay vì suy diễn điều khoản.
const buildChecks = (detail, evidence) => {
  const actions = String(detail).split(/[.;]\s+/).map(item => item.trim()).filter(Boolean).slice(0, 3).map(item => item.endsWith('.') ? item : `${item}.`);
  if (actions.length < 2) actions.push(`Đối chiếu nội dung trên với hồ sơ thực tế và tài liệu: ${evidence}`);
  actions.push('Ghi kết quả đối chiếu, điểm thiếu, người phụ trách và hạn xử lý nếu có.');
  return actions;
};
const reviewStep = (title, detail, evidence, when = '') => ({ title, detail, evidence, when, checks: buildChecks(detail, evidence), refs: [] });

// Mỗi mục đều có câu hỏi xác minh, đầu ra cụ thể và bằng chứng. Một số ví dụ được gắn căn cứ thật.
export const taskGuides = {
  'notary-2027-review': {
    question: 'Giao dịch nào của doanh nghiệp từ 01/01/2027 thực sự thuộc diện cần công chứng, và sẽ công chứng ở đâu?',
    next: 'Lập danh sách giao dịch, xác định căn cứ chuyên ngành và chọn địa điểm công chứng phù hợp.',
    steps: [
      { title: 'Khoanh vùng giao dịch dự kiến', when: 'Có giao dịch từ 01/01/2027 hoặc đang chuẩn bị hồ sơ', detail: 'Liệt kê loại giao dịch, tài sản, đối tác và thời điểm dự kiến. Chưa kết luận bắt buộc công chứng chỉ từ tên hợp đồng.', evidence: 'Danh sách giao dịch dự kiến, hợp đồng mẫu hoặc bản mô tả giao dịch.', refs: [{ sourceId: 'notary-amendment-2026', clause: 'Điều 1, phần sửa Điều 3' }] },
      { title: 'Xác định căn cứ bắt buộc công chứng', when: 'Với từng giao dịch trong danh sách', detail: 'Tra cứu luật chuyên ngành điều chỉnh giao dịch và ghi rõ điều khoản yêu cầu công chứng nếu có. Nếu chưa tìm được căn cứ, giữ trạng thái cần xác minh; không tự đánh dấu “bắt buộc”.', evidence: 'Bảng đối chiếu giao dịch – luật chuyên ngành – điều khoản – kết luận.', refs: [{ sourceId: 'notary-amendment-2026', clause: 'Điều 1, phần sửa Điều 3' }] },
      { title: 'Phân loại đối tượng trực tiếp là bất động sản', when: 'Khi hợp đồng liên quan bất động sản', detail: 'Xác định bất động sản có phải đối tượng trực tiếp của giao dịch không; kết quả này ảnh hưởng phạm vi địa bàn tổ chức công chứng. Trường hợp phức tạp cần người có chuyên môn xác nhận.', evidence: 'Bản phân loại giao dịch và tài liệu mô tả đối tượng hợp đồng.', refs: [{ sourceId: 'notary-amendment-2026', clause: 'Điều 1, phần sửa Điều 44' }] },
      { title: 'Đối chiếu địa bàn và nơi thực hiện', when: 'Nếu giao dịch được xác định cần công chứng', detail: 'Với giao dịch có đối tượng trực tiếp là bất động sản, kiểm tra tỉnh/thành phố nơi tổ chức hành nghề đặt trụ sở; với giao dịch khác, xem phạm vi thẩm quyền mới và xác nhận với tổ chức công chứng trước khi đặt lịch.', evidence: 'Kế hoạch chọn tổ chức công chứng, xác nhận địa điểm hoặc email tư vấn.', refs: [{ sourceId: 'notary-amendment-2026', clause: 'Điều 1, phần sửa Điều 44' }] },
      { title: 'Cập nhật quy trình hợp đồng trước ngày hiệu lực', when: 'Nếu doanh nghiệp thường xuyên phát sinh giao dịch cần công chứng', detail: 'Gắn bước kiểm tra căn cứ và địa bàn vào quy trình phê duyệt hợp đồng; giao đầu mối theo dõi văn bản hướng dẫn và danh mục giao dịch do cơ quan có thẩm quyền công bố.', evidence: 'Quy trình hợp đồng được cập nhật, người phụ trách và ngày rà soát lại.', refs: [{ sourceId: 'notary-amendment-2026', clause: 'Điều 1, phần sửa Điều 3 và Điều 44' }] },
    ],
    proof: 'Bảng giao dịch/căn cứ, phân loại đối tượng, kế hoạch công chứng và bản cập nhật quy trình nội bộ.',
    done: 'Mỗi giao dịch được phân loại, có căn cứ kiểm tra và đầu mối xử lý trường hợp chưa rõ.',
    timing: 'Luật hiệu lực 01/01/2027. Mốc chuẩn bị 15/12/2026 là gợi ý quản trị nội bộ, không phải hạn luật định.',
    basis: ['notary-amendment-2026']
  },
  'company-profile': {
    question: 'Thông tin đăng ký và hoạt động hiện nay đã được người phụ trách đối chiếu chưa?',
    next: 'Mở giấy đăng ký và đối chiếu tên, địa chỉ, người đại diện, ngành và địa điểm đang hoạt động.',
    steps: [
      reviewStep('Thu thập bộ hồ sơ nhận diện hiện hành', 'Tập hợp giấy chứng nhận đăng ký, thông báo thay đổi gần nhất và thông tin đang hiển thị trên hệ thống nội bộ. Không dùng bản nháp hoặc bản đã hết hiệu lực.', 'Danh mục tài liệu, ngày ban hành và nơi lưu nội bộ.'),
      reviewStep('Đối chiếu tên, mã số và địa chỉ', 'So sánh tên pháp lý, tên viết tắt, mã số thuế, địa chỉ trụ sở và thông tin liên hệ giữa hồ sơ với tình trạng doanh nghiệp đang sử dụng.', 'Bảng đối chiếu từng trường và ảnh/chỉ mục tài liệu nguồn.'),
      reviewStep('Kiểm tra người đại diện và thẩm quyền ký', 'Xác nhận người đại diện hiện tại, chức danh và cơ chế ủy quyền đang được dùng trong hợp đồng, ngân hàng và hồ sơ nội bộ.', 'Bản ghi người có thẩm quyền và tài liệu ủy quyền còn hiệu lực.'),
      reviewStep('Đối chiếu ngành nghề và hoạt động thực tế', 'Liệt kê hoạt động đang tạo doanh thu hoặc đang triển khai; đánh dấu điểm chưa khớp với hồ sơ đăng ký để chuyển người phụ trách xác minh.', 'Bảng ngành nghề–hoạt động thực tế–kết luận cần kiểm tra.'),
      reviewStep('Kiểm tra địa điểm và đơn vị phụ thuộc', 'Liệt kê chi nhánh, địa điểm kinh doanh, kho, cửa hàng và đơn vị phụ thuộc; đối chiếu tình trạng hồ sơ của từng nơi.', 'Danh sách địa điểm, mã hồ sơ và trạng thái xác minh.'),
      reviewStep('Chốt sai lệch và kế hoạch xử lý', 'Ghi từng sai lệch, mức ảnh hưởng, người phụ trách và mốc rà soát. Chỉ đánh dấu đạt khi đã có người xác nhận hoặc tài liệu chứng minh.', 'Biên bản đối chiếu, danh sách sai lệch và kế hoạch hành động.'),
    ],
    proof: 'Bản đối chiếu hoặc xác nhận nội bộ; không cần đưa giấy tờ thật lên bản demo.',
    done: 'Đã ghi nhận kết quả đối chiếu và người phụ trách các điểm khác biệt.',
    timing: 'Chưa tính hạn pháp lý; kiểm tra lại khi doanh nghiệp có thay đổi.',
    basis: []
  },
  'new-company': {
    question: 'Doanh nghiệp đã phân công người theo dõi các việc pháp lý sau thành lập chưa?',
    next: 'Chọn một đầu mối chịu trách nhiệm và lập danh sách việc theo hoạt động thực tế.',
    steps: [
      reviewStep('Chỉ định đầu mối tuân thủ', 'Xác định một người điều phối chung và đầu mối cho kế toán, nhân sự, hợp đồng, dữ liệu và vận hành.', 'Danh sách vai trò, người phụ trách và thông tin liên hệ nội bộ.'),
      reviewStep('Chốt mô hình hoạt động ban đầu', 'Ghi sản phẩm/dịch vụ, kênh bán, phương thức thanh toán, địa điểm và thời điểm bắt đầu hoạt động thực tế.', 'Bản mô tả mô hình hoạt động đã được người quản lý xác nhận.'),
      reviewStep('Xác nhận luồng hóa đơn và kế toán', 'Ghi loại giao dịch dự kiến, công cụ hóa đơn đang dùng, người lập/duyệt và dữ liệu đầu vào cần có.', 'Sơ đồ hóa đơn–kế toán và danh sách quyền truy cập.'),
      reviewStep('Xác nhận tình trạng lao động', 'Liệt kê người làm việc, loại thỏa thuận, ngày bắt đầu và đầu mối xử lý lương/bảo hiểm; giữ trạng thái chưa rõ nếu chưa đủ hồ sơ.', 'Bảng nhân sự đã ẩn dữ liệu và danh sách hồ sơ còn thiếu.'),
      reviewStep('Kiểm tra giấy phép và điều kiện theo hoạt động', 'Tách các hoạt động có khả năng cần giấy phép, công bố, đăng ký hoặc điều kiện duy trì để giao người chuyên môn xác minh.', 'Danh sách hoạt động–điều kiện tiềm năng–người xác minh.'),
      reviewStep('Lập lịch kiểm tra 30–60–90 ngày', 'Đặt mốc nội bộ cho các việc chưa hoàn tất và lịch xem lại sau khi doanh nghiệp bắt đầu phát sinh giao dịch.', 'Lịch hành động, người duyệt và biên bản rà soát kế tiếp.'),
    ],
    proof: 'Danh sách đầu mối và bảng phân công nội bộ.',
    done: 'Mỗi nhóm việc có người chịu trách nhiệm và ngày rà soát tiếp theo.',
    timing: 'Mốc quản trị nội bộ, không phải hạn luật định.', basis: []
  },
  'company-change': {
    question: 'Thay đổi sắp thực hiện đã được mô tả rõ và phân loại chưa?',
    next: 'Ghi rõ thay đổi về địa chỉ, vốn, ngành, địa điểm hoặc mô hình bán hàng.',
    steps: [
      reviewStep('Mô tả chính xác thay đổi', 'Ghi nội dung trước/sau, lý do, phạm vi đơn vị chịu ảnh hưởng và ngày dự kiến áp dụng.', 'Phiếu mô tả thay đổi và quyết định/dự thảo nội bộ.'),
      reviewStep('Phân loại nhóm thay đổi', 'Đánh dấu thay đổi thuộc đăng ký doanh nghiệp, thuế, lao động, địa điểm, giấy phép, hợp đồng hay hệ thống dữ liệu; một thay đổi có thể thuộc nhiều nhóm.', 'Bảng phân loại và đầu mối từng nhóm.'),
      reviewStep('Xác định bên bị ảnh hưởng', 'Liệt kê cơ quan, ngân hàng, khách hàng, nhà cung cấp, người lao động và hệ thống nội bộ cần được cập nhật.', 'Danh sách bên liên quan và kênh cập nhật dự kiến.'),
      reviewStep('Đối chiếu hồ sơ và điều kiện trước khi áp dụng', 'So sánh hồ sơ hiện tại với trạng thái dự kiến; ghi điều kiện phải hoàn tất trước, trong hoặc sau ngày thay đổi.', 'Ma trận trước–sau và danh sách điều kiện chưa đáp ứng.'),
      reviewStep('Lập kế hoạch thủ tục và bằng chứng', 'Giao người chuyên môn xác định thủ tục, thời hạn và tài liệu; không tự đặt hạn pháp lý khi chưa có căn cứ.', 'Kế hoạch thủ tục có nguồn xác nhận, người thực hiện và bằng chứng cần lưu.'),
      reviewStep('Kiểm tra sau thay đổi', 'Sau ngày áp dụng, đối chiếu hồ sơ, hóa đơn, hợp đồng, website và hệ thống nội bộ để bảo đảm thông tin đã đồng bộ.', 'Biên bản hậu kiểm và danh sách điểm còn lệch.'),
    ],
    proof: 'Quyết định nội bộ hoặc bản mô tả thay đổi.', done: 'Loại thay đổi được xác định và có người theo dõi thủ tục.',
    timing: 'Chỉ xác định hạn sau khi biết chính xác loại thay đổi.', basis: []
  },
  'company-pause': {
    question: 'Doanh nghiệp đã xác nhận tình trạng thông báo tạm ngừng và nghĩa vụ còn tồn chưa?',
    next: 'Kiểm tra mốc tạm ngừng thực tế và danh sách nghĩa vụ chưa hoàn tất.',
    steps: [
      reviewStep('Chốt phạm vi và thời gian tạm ngừng', 'Ghi đơn vị, địa điểm, hoạt động bị tạm ngừng; ngày bắt đầu, ngày dự kiến hoạt động lại và người phê duyệt.', 'Quyết định nội bộ và bảng phạm vi tạm ngừng.'),
      reviewStep('Đối chiếu tình trạng thông báo', 'Kiểm tra hồ sơ đã nộp, cơ quan tiếp nhận, thời điểm gửi và trạng thái phản hồi; ghi rõ trường hợp chưa có biên nhận.', 'Bản thông báo, biên nhận và nhật ký trao đổi.'),
      reviewStep('Rà soát thuế và hóa đơn còn tồn', 'Liệt kê kỳ kê khai, hóa đơn, khoản phải thu/phải trả và nghĩa vụ kế toán còn phát sinh trong thời gian tạm ngừng.', 'Bảng nghĩa vụ còn tồn được kế toán xác nhận.'),
      reviewStep('Rà soát lao động và hợp đồng', 'Xác định người lao động, hợp đồng khách hàng/nhà cung cấp, thuê mặt bằng và dịch vụ định kỳ cần tiếp tục, sửa đổi hoặc chấm dứt.', 'Danh sách hợp đồng, phương án xử lý và người phụ trách.'),
      reviewStep('Bảo toàn hồ sơ, tài sản và dữ liệu', 'Chỉ định người giữ hồ sơ, quyền truy cập hệ thống, tài sản, dữ liệu và kênh tiếp nhận thông báo trong thời gian tạm ngừng.', 'Biên bản bàn giao và danh sách quyền truy cập.'),
      reviewStep('Lập kế hoạch hoạt động lại hoặc gia hạn', 'Đặt mốc nội bộ để kiểm tra trước ngày dự kiến hoạt động lại; giao người xác minh thủ tục cần thực hiện khi thay đổi kế hoạch.', 'Lịch rà soát, người phụ trách và checklist khởi động lại.'),
    ],
    proof: 'Hồ sơ thông báo và bảng theo dõi nghĩa vụ còn tồn.', done: 'Có kết quả đối chiếu hồ sơ và người chịu trách nhiệm các việc còn lại.',
    timing: 'Chưa tự tính hạn khi thiếu mốc tạm ngừng.', basis: []
  },
  'tax-calendar': {
    question: 'Kế toán đã xác nhận phương pháp kê khai, kỳ kê khai và lịch nghĩa vụ hiện hành chưa?',
    next: 'Yêu cầu kế toán xác nhận các kỳ và mốc áp dụng cho đúng doanh nghiệp.',
    steps: [
      reviewStep('Lập danh mục nghĩa vụ thuế và kế toán', 'Liệt kê từng sắc thuế, báo cáo, khoản nộp và nghĩa vụ hóa đơn có khả năng phát sinh; ghi căn cứ doanh nghiệp đang dùng để xác định phạm vi.', 'Bảng nghĩa vụ, trạng thái áp dụng và người xác nhận.'),
      reviewStep('Xác nhận phương pháp và kỳ kê khai', 'Kế toán ghi phương pháp tính, khai theo tháng/quý/năm hay theo lần phát sinh và ngày bắt đầu áp dụng. Không suy luận kỳ chỉ từ quy mô doanh nghiệp.', 'Phiếu xác nhận phương pháp, kỳ và tài liệu nguồn nội bộ.'),
      reviewStep('Đối chiếu dữ liệu kỳ gần nhất', 'Chọn kỳ gần nhất để đối chiếu tờ khai, sổ kế toán, hóa đơn và chứng từ nộp; ghi chênh lệch hoặc hồ sơ chưa có.', 'Bảng đối chiếu kỳ mẫu và danh sách sai lệch.'),
      reviewStep('Tách hạn pháp lý và mốc chuẩn bị nội bộ', 'Với từng nghĩa vụ, ghi hạn được kế toán xác nhận và một mốc chuẩn bị sớm hơn; không hiển thị ngày pháp lý khi chưa có nguồn kiểm tra.', 'Lịch có cột hạn pháp lý, nguồn xác nhận và mốc nội bộ.'),
      reviewStep('Phân công người lập, duyệt và nộp', 'Gắn người chuẩn bị dữ liệu, người kiểm tra, người ký/nộp và người theo dõi biên nhận; xác định người thay thế khi vắng mặt.', 'Ma trận trách nhiệm và thông tin quyền truy cập.'),
      reviewStep('Thiết lập kiểm soát biên nhận và lỗi nộp', 'Sau mỗi lần gửi, kiểm tra trạng thái tiếp nhận, thông báo lỗi và chứng từ nộp tiền; mở việc xử lý nếu chưa thành công.', 'Biên nhận, thông báo hệ thống và nhật ký xử lý lỗi.'),
      reviewStep('Đặt lịch rà soát khi hoạt động thay đổi', 'Kiểm tra lại lịch khi doanh nghiệp đổi quy mô, ngành, địa điểm, phương pháp khai hoặc bắt đầu giao dịch mới.', 'Ngày rà soát kế tiếp và danh sách sự kiện kích hoạt cập nhật.'),
    ],
    proof: 'Lịch thuế/kế toán được người phụ trách xác nhận.', done: 'Lịch có loại nghĩa vụ, kỳ, người phụ trách và nguồn xác nhận.',
    timing: 'Không tự hiển thị hạn nộp khi chưa biết kỳ kê khai.', basis: []
  },
  'labor-profile': {
    question: 'Doanh nghiệp hiện có bao nhiêu người làm việc và những quan hệ nào cần được xác minh là quan hệ lao động?',
    next: 'Lập danh sách người làm việc theo bản chất công việc, cách trả công và mức độ quản lý thay vì chỉ dựa vào tên hợp đồng.',
    steps: [
      reviewStep('Lập danh sách người đang làm việc', 'Ghi mã ẩn danh, ngày bắt đầu, bộ phận, địa điểm và tình trạng đang làm/nghỉ/tạm hoãn cho mọi người làm việc thường xuyên.', 'Danh sách người làm việc có ngày chốt và người xác nhận.'),
      reviewStep('Ghi loại thỏa thuận và cách trả công', 'Phân loại tên hợp đồng/thỏa thuận, cách tính và kỳ trả tiền; đánh dấu người chưa có hồ sơ hoặc hồ sơ không còn phù hợp.', 'Bảng thỏa thuận–cách trả công–tình trạng hồ sơ.'),
      reviewStep('Đánh giá dấu hiệu quản lý và giám sát', 'Ghi ai giao việc, kiểm soát thời gian/địa điểm, đánh giá kết quả và áp dụng kỷ luật để chuyển người chuyên môn xác định bản chất quan hệ.', 'Phiếu mô tả cách tổ chức công việc theo từng nhóm.'),
      reviewStep('Chốt khoảng quy mô lao động', 'Sau khi xác minh danh sách, chọn đúng khoảng 0, 1–9, 10–49, 50–99 hoặc từ 100; ghi ngày hiệu lực của số liệu.', 'Kết quả quy mô và bảng tính hỗ trợ.'),
      reviewStep('Xử lý trường hợp chưa rõ', 'Giao nhân sự/pháp chế xác minh từng trường hợp cộng tác viên, khoán việc, thử việc hoặc thuê qua bên thứ ba trước khi loại khỏi phạm vi.', 'Sổ ngoại lệ, người phụ trách và kết luận có căn cứ.'),
    ],
    proof: 'Danh sách người làm việc đã ẩn dữ liệu, bảng phân loại thỏa thuận và kết quả xác minh ngoại lệ.',
    done: 'Quy mô lao động được chốt tại một thời điểm, mọi ngoại lệ có người xử lý và căn cứ kết luận.',
    timing: 'Cập nhật khi tuyển mới, nghỉ việc hoặc thay đổi mô hình sử dụng nhân sự.', basis: []
  },
  'labor-insurance': {
    question: 'Danh sách lao động và hồ sơ tham gia bảo hiểm đã được đối chiếu chưa?',
    next: 'Đối chiếu từng người lao động với tình trạng tham gia và ghi ngoại lệ.',
    steps: [
      reviewStep('Chốt danh sách người làm việc', 'Lập danh sách người đang làm, ngày bắt đầu, loại thỏa thuận và đơn vị làm việc; dùng mã ẩn danh trong bản demo.', 'Danh sách nhân sự có ngày hiệu lực và người xác nhận.'),
      reviewStep('Phân loại tình trạng từng người', 'Đánh dấu đang tham gia, chưa tham gia, không thuộc diện, tạm hoãn hoặc chưa đủ dữ liệu; không kết luận chỉ từ tên hợp đồng.', 'Bảng phân loại và lý do/tài liệu hỗ trợ.'),
      reviewStep('Đối chiếu hồ sơ đăng ký và dữ liệu tiền lương', 'So sánh danh sách lao động với hồ sơ bảo hiểm, bảng lương và biến động tăng/giảm của kỳ gần nhất.', 'Bảng đối chiếu ba nguồn và danh sách chênh lệch.'),
      reviewStep('Kiểm tra thay đổi trong kỳ', 'Rà người mới vào, nghỉ việc, thay đổi mức đóng, nghỉ không lương, thai sản hoặc tình huống khác cần người chuyên môn xác minh.', 'Danh sách biến động, ngày phát sinh và trạng thái xử lý.'),
      reviewStep('Xử lý ngoại lệ có chủ sở hữu', 'Với mỗi trường hợp lệch, ghi việc cần làm, người phụ trách, tài liệu còn thiếu và mốc theo dõi; không gộp nhiều người thành một kết luận chung.', 'Sổ ngoại lệ và bằng chứng xử lý từng trường hợp.'),
      reviewStep('Lưu biên nhận và hậu kiểm', 'Sau khi thực hiện thủ tục, kiểm tra phản hồi/biên nhận và đối chiếu lại dữ liệu kỳ tiếp theo.', 'Biên nhận, kết quả hậu kiểm và ngày rà soát tiếp.'),
    ],
    proof: 'Bảng đối chiếu đã ẩn mã định danh cá nhân.', done: 'Có kết quả cho từng ngoại lệ và người theo dõi.',
    timing: 'Chưa tính hạn do thiếu dữ liệu hợp đồng và thời điểm phát sinh.', basis: []
  },
  'labor-rules': {
    question: 'Quy mô lao động thực tế và nội quy hiện hành đã được kiểm tra chưa?',
    next: 'Xác nhận số lao động và phiên bản nội quy doanh nghiệp đang dùng.',
    steps: [
      reviewStep('Chốt số lao động và phạm vi áp dụng', 'Ghi số người theo từng địa điểm/đơn vị và thời điểm chốt; tách người lao động với nhóm chưa xác định bản chất quan hệ.', 'Bảng quy mô lao động có ngày chốt và người xác nhận.'),
      reviewStep('Thu thập phiên bản nội quy đang sử dụng', 'Xác định bản đang ban hành, ngày hiệu lực, người ký và các phụ lục/quy trình liên quan; loại riêng bản dự thảo hoặc bản cũ.', 'Mục lục phiên bản và bản nội quy hiện hành.'),
      reviewStep('Đối chiếu nội dung với cách vận hành thực tế', 'Kiểm tra thời giờ, trật tự, an toàn, bảo mật, hành vi vi phạm và quy trình xử lý đang thực hiện có thống nhất với nội quy không.', 'Bảng nội dung–thực tế–điểm chênh lệch.'),
      reviewStep('Kiểm tra tham vấn, ban hành và phổ biến', 'Thu thập bằng chứng về quá trình tham vấn/ban hành/phổ biến nếu áp dụng; trường hợp chưa rõ phải chuyển chuyên môn xác nhận.', 'Biên bản, quyết định, email/ảnh phổ biến và danh sách còn thiếu.'),
      reviewStep('Xác minh thủ tục theo quy mô thực tế', 'Giao nhân sự hoặc chuyên gia xác định thủ tục và ngưỡng áp dụng dựa trên số lao động đã chốt; không tự kết luận từ khoảng ước tính.', 'Ý kiến xác nhận, nguồn tham chiếu và kế hoạch thủ tục.'),
      reviewStep('Quản lý sửa đổi và đào tạo lại', 'Khi thay đổi nội quy, lưu lịch sử phiên bản, người phê duyệt, ngày phổ biến và nhóm cần đào tạo lại.', 'Nhật ký phiên bản và bằng chứng đào tạo/phổ biến.'),
    ],
    proof: 'Bảng số lao động và phiên bản nội quy.', done: 'Đã phân loại đúng quy mô và ghi việc cần làm tiếp theo.',
    timing: 'Chưa tự suy luận ngưỡng và hạn thủ tục trong demo.', basis: []
  },
  'personal-data': {
    question: 'Doanh nghiệp đã liệt kê đầy đủ dữ liệu khách hàng đang thu thập và mục đích dùng chưa?',
    next: 'Lập danh mục trường dữ liệu ở form, website, sàn và kênh chăm sóc khách hàng.',
    steps: [
      reviewStep('Kiểm kê điểm thu thập dữ liệu', 'Liệt kê form, website, ứng dụng, sàn, mạng xã hội, CSKH và hồ sơ giấy đang nhận thông tin cá nhân.', 'Danh sách điểm thu thập, chủ sở hữu và ảnh luồng đã ẩn dữ liệu.'),
      reviewStep('Lập danh mục trường dữ liệu', 'Ghi từng trường dữ liệu, nhóm người liên quan và phân loại sơ bộ cơ bản/nhạy cảm để chuyển chuyên môn xác nhận.', 'Bản đồ trường dữ liệu theo hệ thống và đối tượng.'),
      reviewStep('Gắn mục đích và căn cứ xử lý', 'Với mỗi nhóm dữ liệu, ghi mục đích, cách sử dụng và cơ sở doanh nghiệp đang dựa vào; đánh dấu trường thu thập nhưng chưa có mục đích rõ.', 'Ma trận dữ liệu–mục đích–cơ sở–trạng thái.'),
      reviewStep('Kiểm tra thông báo và cơ chế đồng ý', 'Đối chiếu nội dung hiển thị tại thời điểm thu thập, cách khách hàng đồng ý/rút lại và bằng chứng hệ thống lưu được.', 'Ảnh luồng, phiên bản thông báo và nhật ký đồng ý mẫu.'),
      reviewStep('Rà quyền truy cập, chia sẻ và thời gian lưu', 'Liệt kê bộ phận/bên thứ ba truy cập, nơi lưu, thời hạn và cách xóa/ẩn danh; ghi quyền không còn cần thiết.', 'Ma trận quyền, danh sách bên nhận và lịch lưu/xóa.'),
      reviewStep('Kiểm tra quy trình yêu cầu và sự cố', 'Xác định đầu mối tiếp nhận yêu cầu của chủ thể dữ liệu và luồng phản ứng khi mất, lộ hoặc truy cập sai.', 'Quy trình, đầu mối, mẫu nhật ký yêu cầu/sự cố.'),
    ],
    proof: 'Danh mục dữ liệu và bản chính sách đang áp dụng.', done: 'Có bản đồ dữ liệu và người chịu trách nhiệm rà soát.',
    timing: 'Chưa kết luận nghĩa vụ chuyên ngành khi thiếu luồng xử lý dữ liệu.', basis: []
  },
  'fire-scope': {
    question: 'Từng địa điểm đã có thông tin công năng, diện tích, số tầng và loại hàng lưu trữ chưa?',
    next: 'Tạo một hồ sơ riêng cho mỗi kho, cửa hàng hoặc nhà xưởng.',
    steps: [
      reviewStep('Lập hồ sơ riêng cho từng địa điểm', 'Liệt kê trụ sở, kho, cửa hàng, nhà xưởng và khu vực thuê dùng chung; không gộp các địa điểm khác công năng vào một kết luận.', 'Danh sách địa điểm, địa chỉ và người quản lý.'),
      reviewStep('Ghi công năng và thông số cơ bản', 'Thu thập diện tích, số tầng, số người, kết cấu, lối thoát và cách bố trí sử dụng thực tế của từng nơi.', 'Phiếu thông tin địa điểm, sơ đồ/ảnh đã được phép sử dụng.'),
      reviewStep('Kiểm kê hàng hóa, thiết bị và nguồn nguy hiểm', 'Ghi loại hàng lưu trữ, vật liệu dễ cháy, nguồn nhiệt/điện, máy móc và hoạt động có nguy cơ; nêu khối lượng hoặc quy mô nếu biết.', 'Danh mục hàng/thiết bị và vị trí lưu trữ.'),
      reviewStep('Thu thập hồ sơ PCCC hiện có', 'Tập hợp nội quy, phương án, biên bản kiểm tra, hồ sơ thiết bị và tài liệu của chủ tòa nhà/chủ cho thuê nếu liên quan.', 'Mục lục hồ sơ theo từng địa điểm và ngày cập nhật.'),
      reviewStep('Yêu cầu phân loại bởi người có chuyên môn', 'Chuyển đủ dữ liệu địa điểm để xác định nghĩa vụ, hồ sơ và tần suất kiểm tra; không suy luận chỉ từ việc doanh nghiệp “có kho”.', 'Kết luận phân loại, nguồn xác nhận và danh sách việc phải làm.'),
      reviewStep('Kiểm tra khắc phục và duy trì', 'Ghi điểm thiếu, người xử lý, bằng chứng hoàn thành và lịch kiểm tra/diễn tập/bảo dưỡng tiếp theo theo kết luận chuyên môn.', 'Biên bản khắc phục, nhật ký thiết bị và lịch duy trì.'),
    ],
    proof: 'Thông tin từng địa điểm và hồ sơ PCCC hiện có.', done: 'Mỗi địa điểm đã được phân loại và có kết luận được kiểm tra.',
    timing: 'Không suy luận nghĩa vụ PCCC chỉ từ việc có kho.', basis: []
  },
  'industry-licence': {
    question: 'Danh mục hàng hóa/dịch vụ có điều kiện đã được đối chiếu với giấy phép hiện có chưa?',
    next: 'Ghi chính xác mặt hàng/dịch vụ và cách doanh nghiệp đang kinh doanh.',
    steps: [
      reviewStep('Mô tả chính xác hàng hóa hoặc dịch vụ', 'Ghi tên, thành phần/tính năng, cách bán/cung cấp, khách hàng và địa bàn; tránh dùng tên nhóm quá rộng.', 'Danh mục sản phẩm/dịch vụ và tài liệu mô tả.'),
      reviewStep('Xác định vai trò của doanh nghiệp', 'Phân biệt sản xuất, nhập khẩu, phân phối, bán lẻ, môi giới hay cung cấp dịch vụ vì điều kiện có thể khác nhau.', 'Bảng sản phẩm–vai trò–đơn vị thực hiện.'),
      reviewStep('Thu thập giấy phép và hồ sơ điều kiện', 'Lập danh mục giấy phép, chứng nhận, công bố, đăng ký và hồ sơ nhân sự/cơ sở vật chất hiện có.', 'Sổ giấy phép có số, phạm vi, ngày cấp và nơi lưu.'),
      reviewStep('Đối chiếu phạm vi và tình trạng hiệu lực', 'Kiểm tra giấy phép có bao phủ đúng sản phẩm, địa điểm và vai trò đang kinh doanh; ghi điểm chưa rõ để người chuyên môn xác nhận.', 'Bảng đối chiếu hoạt động–phạm vi–tình trạng.'),
      reviewStep('Kiểm tra điều kiện duy trì', 'Liệt kê báo cáo, nhân sự, cơ sở vật chất, đào tạo, kiểm định hoặc nghĩa vụ định kỳ gắn với từng giấy phép nếu có.', 'Lịch điều kiện duy trì và bằng chứng kỳ gần nhất.'),
      reviewStep('Theo dõi thay đổi và gia hạn', 'Đặt cảnh báo nội bộ trước khi hết hạn hoặc khi đổi sản phẩm, địa điểm, người phụ trách hay quy mô.', 'Lịch theo dõi, chủ sở hữu và quy trình cập nhật.'),
    ],
    proof: 'Danh mục mặt hàng và thông tin giấy phép.', done: 'Có kết quả đối chiếu theo từng mặt hàng/dịch vụ.',
    timing: 'Chỉ xác định hạn sau khi biết loại giấy phép.', basis: []
  },
  'foreign-investment': {
    question: 'Yếu tố nước ngoài là vốn, nhân sự hay giao dịch xuyên biên giới?',
    next: 'Chọn đúng loại yếu tố nước ngoài trước khi sinh việc cụ thể.',
    steps: [
      reviewStep('Xác định loại yếu tố nước ngoài', 'Phân biệt sở hữu vốn, người lao động/chuyên gia, nhà thầu, giao dịch, khoản vay, chuyển tiền hay cung cấp dịch vụ xuyên biên giới.', 'Phiếu phân loại tình huống và người xác nhận.'),
      reviewStep('Mô tả chủ thể và vai trò', 'Ghi quốc gia/vùng lãnh thổ, loại chủ thể, quan hệ với doanh nghiệp và quyền/nghĩa vụ chính; che thông tin nhạy cảm trong demo.', 'Sơ đồ chủ thể–vai trò–quan hệ.'),
      reviewStep('Thu thập hồ sơ nền', 'Tập hợp đăng ký, hợp đồng, giấy tờ nhân sự, hồ sơ vốn/giao dịch và tài liệu ngân hàng liên quan theo loại tình huống.', 'Mục lục tài liệu và danh sách còn thiếu.'),
      reviewStep('Khoanh nhóm vấn đề cần xác minh', 'Tách đầu tư, lao động, thuế, ngoại hối, hợp đồng, xuất nhập khẩu và dữ liệu để giao đúng người chuyên môn.', 'Ma trận tình huống–nhóm pháp lý–đầu mối.'),
      reviewStep('Xác định thủ tục và mốc áp dụng', 'Yêu cầu chuyên môn ghi thủ tục, điều kiện, thời hạn và nguồn; giữ trạng thái chưa rõ nếu chưa đủ dữ liệu.', 'Ý kiến xác nhận và kế hoạch hành động có nguồn.'),
      reviewStep('Theo dõi thay đổi và báo cáo', 'Ghi sự kiện cần rà soát lại như thay đổi tỷ lệ vốn, chức danh, thời hạn làm việc, giá trị giao dịch hoặc phương thức thanh toán.', 'Danh sách sự kiện kích hoạt và lịch kiểm tra tiếp.'),
    ],
    proof: 'Bản mô tả và hồ sơ nền đã che thông tin nhạy cảm.', done: 'Loại tình huống đã được phân loại và có đầu mối xử lý.',
    timing: 'Chưa tính hạn vì thiếu loại giao dịch.', basis: []
  },
  'import-export': {
    question: 'Doanh nghiệp đã xác định loại hàng, thị trường và phương thức giao dịch chưa?',
    next: 'Chọn một lô hàng mẫu để rà soát quy trình chứng từ.',
    steps: [
      reviewStep('Chọn lô hàng mẫu và mô tả giao dịch', 'Ghi hàng hóa, số lượng/giá trị, nước đi/đến, thời gian và vai trò của doanh nghiệp trong lô hàng.', 'Phiếu mô tả lô hàng đã ẩn dữ liệu thương mại nhạy cảm.'),
      reviewStep('Xác định mã hàng và chính sách mặt hàng', 'Ghi mã/tên hàng doanh nghiệp đang sử dụng và nguồn xác định; chuyển chuyên môn kiểm tra nếu mã hoặc chính sách chưa chắc chắn.', 'Bảng mã hàng, nguồn và trạng thái xác minh.'),
      reviewStep('Kiểm tra điều kiện, giấy phép và kiểm tra chuyên ngành', 'Liệt kê giấy phép, công bố, kiểm dịch, kiểm tra chất lượng hoặc hạn chế có khả năng áp dụng theo loại hàng/thị trường.', 'Ma trận điều kiện–hồ sơ–cơ quan/đầu mối xác nhận.'),
      reviewStep('Đối chiếu bộ chứng từ', 'So sánh hợp đồng, hóa đơn, đóng gói, vận đơn, chứng nhận xuất xứ, tờ khai và chứng từ khác về tên hàng, số lượng và điều kiện giao hàng.', 'Checklist bộ chứng từ và danh sách chênh lệch.'),
      reviewStep('Rà trách nhiệm giao nhận và thanh toán', 'Ghi điều kiện giao hàng, bên chịu chi phí/rủi ro, phương thức thanh toán và các mốc bàn giao/chứng từ.', 'Bảng trách nhiệm, mốc và người phê duyệt.'),
      reviewStep('Hậu kiểm và lưu hồ sơ lô hàng', 'Sau thông quan/giao hàng, lưu kết quả, chứng từ nộp, điều chỉnh nếu có và bài học cho lô tiếp theo.', 'Mục lục hồ sơ hoàn tất và biên bản hậu kiểm.'),
    ],
    proof: 'Bảng mô tả lô hàng và bộ chứng từ mẫu.', done: 'Có danh sách nghĩa vụ theo loại hàng và người phụ trách.',
    timing: 'Chưa tính hạn khi chưa biết loại hàng và phương thức.', basis: []
  },
  'advertising': {
    question: 'Nội dung quảng cáo/khuyến mại và kênh phát hành đã được kiểm tra chưa?',
    next: 'Chọn chiến dịch đang chạy và ghi sản phẩm, nội dung, thời gian, kênh.',
    steps: [
      reviewStep('Chọn chiến dịch và khóa phiên bản nội dung', 'Tập hợp bản chữ, hình, video, landing page, điều khoản khuyến mại và ngày/kênh dự kiến phát hành.', 'Gói nội dung có mã phiên bản và người sở hữu.'),
      reviewStep('Xác định sản phẩm, đối tượng và địa bàn', 'Ghi sản phẩm/dịch vụ, nhóm khách hàng, khu vực, thời gian và mục tiêu; đánh dấu nhóm đặc thù để chuyên môn kiểm tra.', 'Phiếu mô tả chiến dịch và phạm vi phát hành.'),
      reviewStep('Kiểm tra tính chính xác của tuyên bố', 'Đối chiếu giá, công dụng, so sánh, chứng nhận, số liệu và điều kiện ưu đãi với tài liệu chứng minh; loại bỏ nội dung không chứng minh được.', 'Bảng tuyên bố–bằng chứng–kết quả duyệt.'),
      reviewStep('Rà quyền sử dụng tài sản và dữ liệu', 'Kiểm tra quyền đối với ảnh, nhạc, font, người xuất hiện và nguồn dữ liệu khách hàng dùng để phân phối quảng cáo.', 'Danh mục tài sản, giấy phép/chấp thuận và nguồn dữ liệu.'),
      reviewStep('Xác định thủ tục theo hình thức cụ thể', 'Giao marketing/pháp chế xác minh thông báo, đăng ký, điều kiện hiển thị hoặc giới hạn theo sản phẩm/kênh; không dùng một kết luận cho mọi chiến dịch.', 'Bảng thủ tục, nguồn xác nhận và người chịu trách nhiệm.'),
      reviewStep('Phê duyệt, giám sát và lưu bằng chứng', 'Chỉ phát hành đúng phiên bản đã duyệt; lưu ảnh thực tế, phản hồi/khiếu nại và quyết định sửa hoặc gỡ nếu phát sinh vấn đề.', 'Biên bản duyệt, ảnh phát hành và nhật ký xử lý sau phát hành.'),
    ],
    proof: 'Mẫu nội dung và biên bản phê duyệt.', done: 'Chiến dịch đã được phân loại và điểm cần sửa đã được xử lý.',
    timing: 'Chưa suy luận thủ tục và hạn chỉ từ tín hiệu “có quảng cáo”.', basis: []
  }
};

for (const guide of Object.values(taskGuides)) {
  for (const item of guide.steps) if (!item.checks?.length) item.checks = buildChecks(item.detail, item.evidence);
}

export function getTaskGuide(task) {
  const savedTemplate = checklistTemplateById(task.id);
  if (savedTemplate) return { ...savedTemplate.guide, basis: savedTemplate.sourceIds };
  return taskGuides[task.id] || {
    question: 'Nội dung cảnh báo này đã được người phụ trách đối chiếu với tình trạng doanh nghiệp chưa?',
    next: task.action,
    steps: [
      reviewStep('Xác minh nguồn và phiên bản áp dụng', 'Mở nguồn được cung cấp, kiểm tra số hiệu, tình trạng hiệu lực và phạm vi nội dung trước khi dùng để đánh giá.', 'Liên kết/ảnh nguồn, ngày kiểm tra và người xác nhận.'),
      reviewStep('Khoanh đối tượng và điều kiện liên quan', 'Ghi hoạt động, giao dịch, địa điểm hoặc nhóm người có thể thuộc phạm vi; giữ trạng thái chưa rõ nếu thiếu dữ liệu.', 'Bảng đối tượng–điều kiện–dữ liệu còn thiếu.'),
      reviewStep('Đối chiếu quy trình và hồ sơ hiện tại', 'So sánh từng yêu cầu đã xác minh với cách doanh nghiệp đang làm và tài liệu hiện có; tách đạt, thiếu và không áp dụng.', 'Bảng đối chiếu và chỉ mục bằng chứng.'),
      reviewStep('Lập kế hoạch xử lý điểm khác biệt', 'Gắn người phụ trách, việc cần làm, phụ thuộc và mốc nội bộ cho từng điểm còn thiếu.', 'Kế hoạch hành động và phê duyệt nội bộ.'),
      reviewStep('Hậu kiểm và lưu kết quả', 'Sau khi xử lý, kiểm tra lại bằng chứng, cập nhật trạng thái và đặt ngày rà soát tiếp theo nếu quy trình tiếp tục áp dụng.', 'Biên bản hậu kiểm, bằng chứng hoàn tất và lịch rà soát.'),
    ],
    proof: task.evidence,
    done: 'Có bản đối chiếu, người xác nhận và kết quả xử lý.',
    timing: 'Ngày nhắc trong checklist là mốc nội bộ; cần đối chiếu văn bản nguồn để xác định hạn pháp lý.',
    basis: []
  };
}
