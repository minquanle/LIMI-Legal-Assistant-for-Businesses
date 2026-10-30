export const samples = {
  'DEMO-001': {
    name: 'Công ty TNHH Nội dung số An Phát', taxId: 'DEMO-001', type: 'Công ty TNHH hai thành viên',
    founded: '2026-07-15', status: 'Đang hoạt động', province: 'Hà Nội', registered: 'Giáo dục, xuất bản và nội dung số',
    // Hồ sơ mẫu 001 phục vụ kịch bản demo: lao động, bản quyền, dữ liệu và nội dung số.
    stage: 'new', activity: ['digital'], employees: '1-9', channels: ['website'], places: ['office'],
    signals: ['invoice', 'customerData', 'smallEnterprise', 'copyrightAssets', 'digitalPublishing'],
    topics: ['tax', 'labor', 'commerce', 'company', 'data'], role: 'owner',
  },
  'DEMO-002': {
    name: 'Công ty Cổ phần Dịch vụ Minh Tâm', taxId: 'DEMO-002', type: 'Công ty cổ phần',
    founded: '2021-04-12', status: 'Đang hoạt động', province: 'TP. Hồ Chí Minh', registered: 'Thương mại và dịch vụ',
    // Hồ sơ mẫu 002 phục vụ kịch bản demo: thương mại–dịch vụ và vận hành bán hàng.
    stage: 'running', activity: ['goods', 'services'], employees: '10-49', channels: ['direct', 'marketplace'], places: ['office', 'store'],
    signals: ['invoice', 'customerData', 'regulated', 'ads'],
    topics: ['tax', 'commerce', 'company', 'data'], role: 'accountant',
  },
};

export const labels = {
  goods: 'Bán hàng hóa', services: 'Cung cấp dịch vụ', manufacturing: 'Sản xuất', digital: 'Sản phẩm/dịch vụ số',
  direct: 'Trực tiếp/offline', marketplace: 'Sàn TMĐT', social: 'Mạng xã hội', website: 'Website/app riêng',
  office: 'Văn phòng', store: 'Cửa hàng', warehouse: 'Kho', factory: 'Nhà xưởng',
  invoice: 'Dùng hóa đơn điện tử', customerData: 'Thu thập dữ liệu khách hàng', notary: 'Có giao dịch dự kiến cần công chứng', regulated: 'Hàng hóa/dịch vụ có điều kiện',
  smallEnterprise: 'Có căn cứ xác nhận doanh nghiệp nhỏ/siêu nhỏ', copyrightAssets: 'Dùng phần mềm, ảnh, video, nhạc, font hoặc nội dung bên thứ ba', digitalPublishing: 'Phát hành học liệu, xuất bản phẩm hoặc vận hành nền tảng nội dung số',
  foreign: 'Yếu tố nước ngoài', crossborder: 'Xuất nhập khẩu', ads: 'Quảng cáo/khuyến mại',
  tax: 'Thuế – hóa đơn', labor: 'Lao động – BHXH', commerce: 'Thương mại – hợp đồng', company: 'Doanh nghiệp',
  investment: 'Đầu tư', fire: 'PCCC', data: 'Dữ liệu cá nhân', licence: 'Giấy phép chuyên ngành',
  owner: 'Chủ doanh nghiệp', accountant: 'Kế toán/tài chính', hr: 'Nhân sự', operations: 'Vận hành',
  new: 'Mới thành lập', running: 'Đang hoạt động ổn định', changing: 'Đang mở rộng/thay đổi', paused: 'Tạm ngừng',
  unknown: 'Chưa xác nhận', '0': 'Chưa có nhân viên', '1-9': '1–9 nhân viên', '10-49': '10–49 nhân viên', '50-99': '50–99 nhân viên', '100+': 'Từ 100 nhân viên',
};

// Cảnh báo được biên soạn sẵn từ văn bản thật; không phát sinh AI khi doanh nghiệp mở trang.
export const alerts = [{
  id: 'wage-sanctions-2026', kind: 'effective', kindLabel: 'ĐÃ CÓ HIỆU LỰC', title: 'Nghị định 283: rà soát ngay các khoản tiền lương có nguy cơ bị xử phạt',
  summary: 'Từ 10/09/2026, vi phạm về trả lương được xử phạt theo số người lao động bị ảnh hưởng. Với nhóm hành vi tại khoản 2 Điều 23, tổ chức có thể bị phạt đến 100 triệu đồng; vi phạm lương tối thiểu có khung riêng đến 150 triệu đồng đối với tổ chức, đồng thời còn phải trả đủ khoản thiếu và tiền lãi.',
  severity: 'high', category: 'labor', issuedAt: '2026-07-15', publishedAt: '2026-07-28', effectiveDate: '2026-09-10', prepareBy: '2026-09-30',
  sourceCode: '283/2026/NĐ-CP', issuer: 'Chính phủ', primaryDateLabel: 'Ngày có hiệu lực',
  sourceUrl: 'https://congbao.chinhphu.vn/van-ban/nghi-dinh-so-283-2026-nd-cp-470103.htm',
  explainerUrl: 'https://xaydungchinhsach.chinhphu.vn/nguoi-su-dung-lao-dong-vi-pham-ve-tien-luong-gio-lam-viec-gio-nghi-ngoi-xu-phat-the-nao-119260717182001954.htm',
  test: p => ['1-9', '10-49', '50-99', '100+'].includes(p.employees),
  matchLabel: 'Doanh nghiệp xác nhận đang có người lao động',
  timeline: [
    { label: 'Ban hành', date: '2026-07-15' },
    { label: 'Đăng Công báo', date: '2026-07-28' },
    { label: 'Có hiệu lực', date: '2026-09-10', key: true, countdown: true },
    { label: 'Khoản 2 · tổ chức', value: 'Tối đa 100 triệu', note: 'Chưa gồm khoản truy trả và lãi' },
    { label: 'Lương tối thiểu · tổ chức', value: 'Tối đa 150 triệu', note: 'Khung riêng tại khoản 3 Điều 23' },
  ],
  changes: [
    'Điều 7 xác định mức phạt trong Điều 23 là mức áp dụng cho cá nhân; doanh nghiệp và các tổ chức thuộc danh sách bị phạt gấp 02 lần. Hộ kinh doanh, hộ gia đình bị xử phạt như cá nhân.',
    'Khoản 2 Điều 23 bao phủ nhiều lỗi: chậm/thiếu lương, làm thêm giờ, ban đêm, ngừng việc, chuyển việc tạm thời, đình công, ngày nghỉ hằng năm chưa nghỉ khi thôi việc, tạm đình chỉ và khấu trừ sai.',
    'Khung 5–50 triệu đồng tại khoản 2 tính theo số người lao động bị vi phạm; với tổ chức tương ứng 10–100 triệu đồng. Không được dùng tổng số nhân sự để tự chọn khung nếu chưa xác định số người thực sự bị ảnh hưởng.',
    'Ngoài tiền phạt, khoản 5 buộc trả đủ tiền lương hoặc khoản tương đương còn thiếu và tiền lãi theo mức lãi suất tiền gửi không kỳ hạn cao nhất của ngân hàng thương mại nhà nước tại thời điểm xử phạt.',
  ],
  prepareSteps: [
    'Chọn kỳ lương gần nhất và hồ sơ người đã thôi việc để đối chiếu từ hợp đồng, chấm công, bảng lương đến chứng từ trả tiền.',
    'Tách từng loại vi phạm, lập danh sách đúng số người bị ảnh hưởng và xác định doanh nghiệp/hộ kinh doanh để áp đúng hệ số phạt.',
    'Tính khoản còn thiếu và lãi, xử lý sai lệch ngay; lưu bảng tính, phê duyệt và chứng từ thanh toán làm bằng chứng.',
  ],
  impact: {
    yes: 'Hồ sơ xác nhận doanh nghiệp có người lao động nên cảnh báo có liên quan. LIMI chỉ mở quy trình rà soát; chưa tự kết luận có vi phạm và chưa chọn khung phạt khi chưa biết số người bị ảnh hưởng.',
    no: 'Hồ sơ chưa xác nhận có lao động hoặc số lao động đang để trống. Cần cập nhật hồ sơ trước khi áp checklist tiền lương.',
  },
  recommendation: {
    yes: 'Ưu tiên áp dụng checklist 14 mục vì nghị định đã có hiệu lực. Bắt đầu từ một kỳ lương và các ca nghỉ việc gần nhất, sau đó mở rộng nếu phát hiện sai lệch.',
    no: 'Cập nhật số lao động thực tế; nếu có người làm việc theo thỏa thuận có bản chất quan hệ lao động, cần đưa vào phạm vi xác minh.',
  },
  task: {
    id: 'wage-sanctions-2026', title: 'Rà soát tiền lương theo Nghị định 283/2026/NĐ-CP', category: 'labor', priority: 'high', owner: 'Nhân sự / kế toán tiền lương',
    reason: 'Doanh nghiệp có người lao động và người dùng đã chọn xử lý cảnh báo Nghị định 283/2026/NĐ-CP đang có hiệu lực.',
    action: 'Đối chiếu kỳ lương, phân loại từng lỗi, đếm đúng người bị ảnh hưởng và khắc phục khoản thiếu kèm lãi nếu có.',
    evidence: 'Bảng đối chiếu lương, chấm công, chứng từ trả tiền, danh sách người bị ảnh hưởng và hồ sơ khắc phục',
    source: 'Nghị định 283/2026/NĐ-CP, Điều 7 và Điều 23; hiệu lực ngày 10/09/2026.',
  },
}, {
  id: 'tax-extension-2026', kind: 'opportunity', kindLabel: 'CƠ HỘI THUẾ', title: 'Gia hạn thuế 2026: hạn gửi giấy đề nghị là 02/11/2026',
  summary: 'Nghị định 245/2026/NĐ-CP cho phép nhóm đủ điều kiện lùi thời hạn nộp một số khoản thuế GTGT, thuế TNDN, thuế TNCN và tiền thuê đất. Doanh nghiệp phải tự xác định đúng đối tượng và gửi một giấy đề nghị đúng hạn.',
  severity: 'high', category: 'tax', issuedAt: '2026-06-27', publishedAt: '2026-07-13', effectiveDate: '2026-06-27', deadlineDate: '2026-11-02', prepareBy: '2026-10-15', validUntil: '2026-12-30',
  sourceCode: '245/2026/NĐ-CP', issuer: 'Chính phủ', primaryDateLabel: 'Hạn gửi giấy đề nghị',
  sourceUrl: 'https://vanban.chinhphu.vn/?classid=1&docid=218598&orggroupid=2&pageid=27160',
  explainerUrl: 'https://xaydungchinhsach.chinhphu.vn/gia-han-thoi-gian-nop-thue-nop-tien-thue-dat-2026-nhung-noi-dung-can-luu-y-119260629162524149.htm',
  test: p => p.signals?.includes('smallEnterprise') ?? false,
  matchLabel: 'Doanh nghiệp nhỏ/siêu nhỏ đã được xác nhận',
  timeline: [
    { label: 'Ban hành & hiệu lực', date: '2026-06-27' },
    { label: 'Hạn gửi đề nghị', date: '2026-11-02', key: true, countdown: true, note: 'Hạn pháp lý' },
    { label: 'Một số khoản đến hạn', date: '2026-12-21', note: 'GTGT tháng 6–9 và quý II' },
    { label: 'Mốc gia hạn cuối', date: '2026-12-30', note: 'GTGT/TNDN quý III' },
  ],
  changes: [
    'Doanh nghiệp nhỏ và siêu nhỏ thuộc nhóm được xem xét gia hạn, nhưng phải tự xác định và lưu căn cứ phân loại.',
    'Một giấy đề nghị dùng cho các sắc thuế và kỳ được gia hạn; hạn gửi chậm nhất 02/11/2026.',
    'Mỗi khoản có ngày nộp mới khác nhau; gia hạn không có nghĩa là được bỏ kê khai hoặc miễn số thuế phải nộp.',
  ],
  prepareSteps: [
    'Xác nhận căn cứ doanh nghiệp nhỏ/siêu nhỏ hoặc ngành nghề đủ điều kiện.',
    'Lập bảng từng sắc thuế, kỳ tính thuế, số tiền dự kiến và ngày nộp mới.',
    'Gửi một giấy đề nghị trước 02/11/2026, lưu biên nhận và cập nhật lịch dòng tiền.',
  ],
  impact: {
    yes: 'Hồ sơ đã xác nhận doanh nghiệp nhỏ/siêu nhỏ. Đây là tín hiệu phù hợp để kiểm tra quyền gia hạn; LIMI chưa tự kết luận đủ điều kiện nếu chưa có căn cứ phân loại và kỳ thuế thực tế.',
    no: 'Hồ sơ chưa xác nhận quy mô nhỏ/siêu nhỏ hoặc ngành nghề thuộc diện gia hạn. Không nên tự động áp dụng chỉ vì doanh nghiệp có nghĩa vụ thuế.',
  },
  recommendation: {
    yes: 'Ưu tiên mở checklist ngay: mốc 02/11/2026 là hạn pháp lý, không phải ngày nhắc nội bộ. Checklist sẽ tách điều kiện, hồ sơ đề nghị, biên nhận và từng ngày nộp mới.',
    no: 'Cập nhật quy mô doanh nghiệp và ngành nghề thực tế trước khi đánh giá khả năng gia hạn.',
  },
  task: {
    id: 'tax-extension-2026', title: 'Đánh giá và thực hiện gia hạn thuế năm 2026', category: 'tax', priority: 'high', owner: 'Kế toán / người phụ trách thuế',
    reason: 'Hồ sơ xác nhận là doanh nghiệp nhỏ/siêu nhỏ và người dùng đã chọn áp dụng cảnh báo Nghị định 245/2026/NĐ-CP.',
    action: 'Xác minh điều kiện, lập bảng nghĩa vụ được gia hạn và gửi một giấy đề nghị trước 02/11/2026.',
    evidence: 'Căn cứ phân loại doanh nghiệp, bảng kỳ thuế, giấy đề nghị, biên nhận và lịch nộp mới',
    source: 'Nghị định 245/2026/NĐ-CP, ban hành và có hiệu lực ngày 27/06/2026.',
  },
}, {
  id: 'copyright-enforcement-2026', kind: 'enforcement', kindLabel: 'XU HƯỚNG THỰC THI', title: 'Rủi ro kiểm tra bản quyền tăng: rà soát tài sản số đang sử dụng',
  summary: 'Công điện 38/CĐ-TTg không tạo ra một “luật bản quyền mới”, nhưng yêu cầu tăng kiểm tra và xử lý xâm phạm sở hữu trí tuệ. Kế hoạch thực thi tập trung cả phần mềm tại doanh nghiệp và bản quyền phim, nhạc, truyền hình, trò chơi trên môi trường số.',
  severity: 'high', category: 'commerce', issuedAt: '2026-05-05', observedAt: '2026-07-13', prepareBy: '2026-10-15',
  sourceCode: '38/CĐ-TTg', issuer: 'Thủ tướng Chính phủ', primaryDateLabel: 'Xu hướng thực thi',
  sourceUrl: 'https://vanban.chinhphu.vn/?docid=217999&pageid=27160',
  explainerUrl: 'https://xaydungchinhsach.chinhphu.vn/tang-cuong-kiem-tra-xu-ly-vi-pham-ban-quyen-119260512163548071.htm',
  resultUrl: 'https://media.chinhphu.vn/phat-hien-hon-3300-vu-co-dau-hieu-xam-pham-quyen-so-huu-tri-tue-khoi-to-85-vu-an-102260713113728732.htm',
  test: p => p.signals?.includes('copyrightAssets') ?? false,
  matchLabel: 'Có sử dụng phần mềm hoặc nội dung của bên thứ ba',
  timeline: [
    { label: 'Công điện chỉ đạo', date: '2026-05-05' },
    { label: 'Cập nhật kết quả', date: '2026-07-13', key: true, note: 'Không phải ngày hiệu lực mới' },
    { label: 'Vụ có dấu hiệu vi phạm', value: '3.312', note: 'Ghi nhận 07/05–24/06/2026' },
    { label: 'Vụ án đã khởi tố', value: '85', note: 'Theo báo cáo của Chính phủ' },
  ],
  changes: [
    'Tần suất và mức độ phối hợp kiểm tra sở hữu trí tuệ được tăng cường trên phạm vi toàn quốc.',
    'Phần mềm máy tính tại doanh nghiệp và nội dung số như phim, nhạc, truyền hình, trò chơi là các nhóm được nhấn mạnh trong kế hoạch thực thi.',
    'Dữ liệu kết quả thực thi cho thấy rủi ro không còn mang tính lý thuyết: 3.312 vụ có dấu hiệu vi phạm được phát hiện và 85 vụ án được khởi tố trong đợt báo cáo.',
  ],
  prepareSteps: [
    'Lập danh mục phần mềm, ảnh, video, nhạc, font, mẫu thiết kế và nội dung do freelancer/agency cung cấp.',
    'Gắn mỗi tài sản với hóa đơn, giấy phép, nguồn tải, phạm vi sử dụng hoặc điều khoản chuyển giao quyền.',
    'Thay nội dung không chứng minh được quyền và thiết lập luồng phê duyệt/takedown trước khi có khiếu nại.',
  ],
  impact: {
    yes: 'Doanh nghiệp xác nhận đang dùng phần mềm hoặc nội dung của bên thứ ba. Cảnh báo dựa trên xu hướng thực thi tăng, không phải một nghĩa vụ mới có ngày hiệu lực.',
    no: 'Hồ sơ chưa ghi nhận việc dùng tài sản số của bên thứ ba. Cảnh báo được lưu để tham khảo nhưng chưa tạo checklist.',
  },
  recommendation: {
    yes: 'Thực hiện rà soát bằng chứng quyền sử dụng trước, ưu tiên phần mềm và nội dung đang chạy công khai. Mốc 15/10/2026 là mục tiêu nội bộ để demo, không phải hạn luật định.',
    no: 'Nếu doanh nghiệp dùng phần mềm, kho ảnh, font, nhạc, video hoặc thuê bên ngoài sản xuất nội dung, hãy cập nhật hồ sơ.',
  },
  task: {
    id: 'copyright-enforcement-2026', title: 'Rà soát bằng chứng quyền sử dụng phần mềm và nội dung số', category: 'commerce', priority: 'high', owner: 'Pháp chế / IT / Marketing',
    reason: 'Hồ sơ xác nhận sử dụng tài sản số của bên thứ ba và người dùng đã chọn xử lý cảnh báo tăng cường thực thi bản quyền.',
    action: 'Lập sổ tài sản bản quyền, bổ sung bằng chứng còn thiếu và thay nội dung không xác minh được quyền.',
    evidence: 'Danh mục tài sản, hóa đơn/giấy phép/hợp đồng chuyển giao, biên bản thay thế và quy trình phê duyệt',
    source: 'Công điện 38/CĐ-TTg ngày 05/05/2026 và thông tin triển khai của Chính phủ.',
  },
}, {
  id: 'publishing-law-2027', kind: 'upcoming', kindLabel: 'SẮP HIỆU LỰC', title: 'Luật Xuất bản sửa đổi: chuẩn bị cho nội dung số và việc dùng AI',
  summary: 'Luật số 17/2026/QH16 có hiệu lực từ 01/03/2027, tăng yêu cầu quản lý xuất bản điện tử, bản quyền số và trách nhiệm của một số nền tảng trung gian. Cảnh báo chỉ nhắm tới doanh nghiệp thực sự làm xuất bản, học liệu hoặc nền tảng nội dung số.',
  severity: 'medium', category: 'commerce', issuedAt: '2026-08-24', publishedAt: '2026-09-10', effectiveDate: '2027-03-01', prepareBy: '2027-02-01',
  sourceCode: '17/2026/QH16', issuer: 'Quốc hội', primaryDateLabel: 'Ngày có hiệu lực',
  sourceUrl: 'https://vanban.chinhphu.vn/?classid=1&docid=219485&pageid=27160&typegroupid=3',
  explainerUrl: 'https://baochinhphu.vn/luat-xuat-ban-sua-doi-thiet-lap-co-che-kiem-soat-nhieu-lop-voi-nhom-tac-pham-tai-lieu-co-yeu-cau-quan-ly-cao-102260824121832431.htm',
  test: p => p.signals?.includes('digitalPublishing') ?? false,
  matchLabel: 'Có xuất bản, học liệu hoặc nền tảng nội dung số',
  changes: [
    'Bổ sung trách nhiệm khi ứng dụng trí tuệ nhân tạo trong hoạt động xuất bản; cần giữ khả năng kiểm soát và xác định trách nhiệm biên tập.',
    'Tăng cơ chế bảo vệ bản quyền trong xuất bản điện tử và kiểm soát nội dung số.',
    'Một số nền tảng trung gian phải chuẩn bị cơ chế xác thực, lưu dữ liệu và xử lý thông tin vi phạm theo yêu cầu của cơ quan có thẩm quyền.',
  ],
  prepareSteps: [
    'Xác định sản phẩm nào thuộc hoạt động xuất bản/học liệu/nền tảng nội dung số và vai trò của doanh nghiệp.',
    'Lập bản đồ quy trình biên tập, sử dụng AI, kiểm tra bản quyền và phê duyệt trước khi phát hành.',
    'Rà soát chức năng nền tảng liên quan xác thực, lưu dữ liệu, đầu mối đại diện và gỡ bỏ nội dung khi có yêu cầu hợp lệ.',
  ],
  impact: {
    yes: 'Hồ sơ đã chọn hoạt động xuất bản, học liệu hoặc nền tảng nội dung số. Đây là nhóm cần đọc toàn văn và phân loại vai trò trước ngày 01/03/2027.',
    no: 'Không gán cảnh báo này cho mọi doanh nghiệp có website. Hồ sơ hiện chưa có tín hiệu xuất bản, học liệu hoặc nền tảng nội dung số.',
  },
  recommendation: {
    yes: 'Mở checklist 8 bước để khoanh phạm vi, kiểm soát việc dùng AI, bằng chứng bản quyền và trách nhiệm nền tảng trước ngày hiệu lực.',
    no: 'Chỉ cập nhật hồ sơ nếu doanh nghiệp thực sự phát hành xuất bản phẩm, học liệu hoặc vận hành nền tảng nội dung số.',
  },
  task: {
    id: 'publishing-law-2027', title: 'Chuẩn bị quy trình xuất bản và nội dung số trước 01/03/2027', category: 'commerce', priority: 'normal', owner: 'Biên tập / pháp chế / vận hành nền tảng',
    reason: 'Hồ sơ xác nhận hoạt động xuất bản, học liệu hoặc nền tảng nội dung số và người dùng đã chọn áp dụng cảnh báo Luật 17/2026/QH16.',
    action: 'Phân loại vai trò, rà soát quy trình AI–biên tập–bản quyền và nghĩa vụ nền tảng trước ngày hiệu lực.',
    evidence: 'Sơ đồ quy trình, sổ quyền nội dung, nhật ký AI/biên tập và quy trình xử lý yêu cầu',
    source: 'Luật số 17/2026/QH16, ban hành 24/08/2026, hiệu lực 01/03/2027.',
  },
}, {
  id: 'notary-law-2027', kind: 'upcoming', kindLabel: 'SẮP HIỆU LỰC', title: 'Luật Công chứng sửa đổi: rà soát giao dịch từ 01/01/2027',
  summary: 'Luật số 04/2026/QH16 thay đổi cách xác định giao dịch bắt buộc công chứng và phạm vi địa bàn công chứng. Không phải mọi hợp đồng của doanh nghiệp đều phải công chứng.',
  severity: 'medium', category: 'commerce', issuedAt: '2026-04-23', publishedAt: '2026-05-27', effectiveDate: '2027-01-01', prepareBy: '2026-12-15',
  sourceCode: '04/2026/QH16', issuer: 'Quốc hội',
  sourceUrl: 'https://vanban.chinhphu.vn/?classid=1&docid=218099&pageid=27160&typegroupid=3',
  explainerUrl: 'https://xaydungchinhsach.chinhphu.vn/quoc-hoi-thong-qua-luat-sua-doi-bo-sung-mot-so-dieu-cua-luat-cong-chung-119260423153524237.htm',
  test: p => p.signals?.includes('notary') ?? false,
  matchLabel: 'Có giao dịch dự kiến cần công chứng',
  changes: [
    'Điều 3 sửa đổi: xác định giao dịch bắt buộc công chứng theo tiêu chí và luật chuyên ngành; không suy ra mọi hợp đồng đều bắt buộc.',
    'Điều 44 sửa đổi: giao dịch có đối tượng trực tiếp là bất động sản vẫn theo địa bàn; giao dịch không có đối tượng trực tiếp là bất động sản được mở rộng phạm vi công chứng.',
  ],
  prepareSteps: [
    'Lập danh sách giao dịch dự kiến từ 01/01/2027 và hồ sơ công chứng đang dùng.',
    'Đánh dấu từng giao dịch: có bất động sản trực tiếp hay không; căn cứ luật chuyên ngành nào yêu cầu công chứng.',
    'Giao pháp chế/đầu mối hợp đồng đối chiếu lại nơi công chứng và quy trình đặt lịch trước khi giao dịch.',
  ],
  impact: {
    yes: 'Doanh nghiệp đã chọn “Có giao dịch dự kiến cần công chứng”. Đây là tín hiệu để rà soát; LIMI chưa thể kết luận một giao dịch cụ thể bắt buộc công chứng khi chưa có loại hợp đồng và căn cứ chuyên ngành.',
    no: 'Hồ sơ chưa ghi nhận giao dịch dự kiến cần công chứng. Cảnh báo được lưu để tham khảo, chưa đưa việc vào checklist.',
  },
  recommendation: {
    yes: 'Mở checklist rà soát 5 mục có căn cứ và bằng chứng. Mốc 15/12/2026 là mục tiêu nội bộ gợi ý, không phải hạn luật định.',
    no: 'Nếu sắp ký giao dịch cần công chứng, hãy cập nhật tín hiệu trong hồ sơ để LIMI đưa checklist chuẩn bị vào danh sách.',
  },
  task: {
    id: 'notary-2027-review', title: 'Chuẩn bị giao dịch công chứng theo Luật 04/2026/QH16', category: 'commerce',
    priority: 'normal', owner: 'Pháp chế / người phụ trách hợp đồng',
    reason: 'Hồ sơ xác nhận có giao dịch dự kiến cần công chứng và người dùng đã đưa cảnh báo Luật 04/2026/QH16 vào checklist.',
    action: 'Phân loại từng giao dịch, đối chiếu căn cứ bắt buộc và địa bàn công chứng trước 01/01/2027.',
    evidence: 'Danh sách giao dịch, căn cứ chuyên ngành và kế hoạch công chứng nội bộ',
    source: 'Luật số 04/2026/QH16 (Quốc hội), hiệu lực 01/01/2027.',
  },
}];

export const groups = {
  activity: ['goods', 'services', 'manufacturing', 'digital'],
  channels: ['direct', 'marketplace', 'social', 'website'],
  places: ['office', 'store', 'warehouse', 'factory'],
  signals: ['invoice', 'customerData', 'smallEnterprise', 'copyrightAssets', 'digitalPublishing', 'notary', 'regulated', 'foreign', 'crossborder', 'ads'],
  topics: ['tax', 'labor', 'commerce', 'company', 'investment', 'fire', 'data', 'licence'],
  stage: ['new', 'running', 'changing', 'paused', 'unknown'],
  employees: ['0', '1-9', '10-49', '50-99', '100+', 'unknown'],
  role: ['owner', 'accountant', 'hr', 'operations'],
};
