import { alerts } from './data.js?v=10';
import { checklistTemplates, templateMatch } from './mock-db.js?v=6';

const statusRank = { todo: 0, doing: 1, review: 2, verify: 3, done: 8, na: 9 };

export function compareTasksForAttention(a, b, topics = []) {
  return (statusRank[a.status] ?? 5) - (statusRank[b.status] ?? 5)
    || Number(b.priority === 'high') - Number(a.priority === 'high')
    || Number(topics.includes(b.category)) - Number(topics.includes(a.category))
    || a.title.localeCompare(b.title, 'vi');
}

export function buildTasks(profile, statuses = {}, appliedAlerts = []) {
  if (!profile) return [];
  const tasks = [];
  const add = (id, title, category, reason, kind = 'verify', priority = 'normal', owner = 'Chủ doanh nghiệp', action = 'Rà soát tình trạng hiện tại và lưu bằng chứng đã thực hiện.', evidence = 'Tài liệu hoặc xác nhận nội bộ', source = 'Căn cứ pháp lý sẽ được xác minh ở bản sản phẩm thật.') => {
    tasks.push({ id, title, category, reason, kind, priority, owner, action, evidence, source, status: statuses[id] || kind });
  };

  add('company-profile', 'Hoàn thiện hồ sơ pháp lý nền tảng', 'company', 'Bước thiết lập bắt buộc để LIMI xác định đúng nghĩa vụ phù hợp.', profile.stage === 'new' ? 'todo' : 'verify', 'normal', 'Chủ doanh nghiệp', 'Đối chiếu và hoàn thiện thông tin đăng ký, hoạt động thực tế trước khi bắt đầu rà soát.', 'Giấy đăng ký và hồ sơ nội bộ');
  if (profile.stage === 'new') add('new-company', 'Phân công người theo dõi nghĩa vụ sau thành lập', 'company', 'Doanh nghiệp tự xác nhận là mới thành lập.', 'verify', 'normal', 'Chủ doanh nghiệp', 'Chọn đầu mối và giao từng việc cụ thể cho kế toán, nhân sự hoặc vận hành.', 'Danh sách phân công nội bộ', 'Gợi ý quản trị nội bộ, không phải một nghĩa vụ pháp luật riêng.');
  if (profile.stage === 'changing') add('company-change', 'Xác định thủ tục cho thay đổi sắp thực hiện', 'company', 'Doanh nghiệp đang mở rộng hoặc thay đổi hoạt động.', 'verify', 'high', 'Chủ doanh nghiệp', 'Ghi rõ thay đổi nào đang xảy ra: địa chỉ, vốn, ngành, địa điểm hoặc mô hình bán hàng.', 'Mô tả thay đổi và quyết định nội bộ');
  if (profile.stage === 'paused') add('company-pause', 'Rà soát nghĩa vụ trong thời gian tạm ngừng', 'company', 'Doanh nghiệp đánh dấu đang tạm ngừng.', 'verify', 'high', 'Chủ doanh nghiệp', 'Kiểm tra tình trạng thông báo tạm ngừng và các nghĩa vụ còn tồn đọng.', 'Hồ sơ tạm ngừng và xác nhận liên quan');

  add('tax-calendar', 'Xác nhận lịch thuế và kế toán đang áp dụng', 'tax', 'Hồ sơ chưa có kỳ và phương pháp khai; cần đối chiếu với tình trạng hoạt động thực tế.', 'verify', 'high', 'Kế toán', 'Xác nhận các nghĩa vụ định kỳ thực tế và người phụ trách trước khi tạo lịch nhắc.', 'Lịch kê khai do kế toán xác nhận');

  if (!profile.employees || profile.employees === 'unknown') add('labor-profile', 'Xác nhận quy mô lao động hiện tại', 'labor', 'Hồ sơ chưa xác nhận doanh nghiệp có người lao động hay không.', 'verify', 'normal', 'Nhân sự', 'Cập nhật số người lao động trong hồ sơ để xác định các nhóm việc cần rà soát.', 'Thông tin quy mô lao động được xác nhận');
  if (profile.employees && !['0', 'unknown'].includes(profile.employees)) {
    add('labor-insurance', 'Xác nhận tình trạng tham gia BHXH', 'labor', 'Doanh nghiệp xác nhận đang có người lao động.', 'verify', 'high', 'Nhân sự/Kế toán', 'Đối chiếu danh sách người lao động với đối tượng tham gia và hồ sơ hiện có.', 'Danh sách và hồ sơ tham gia');
  }
  if (['10-49', '50-99', '100+'].includes(profile.employees)) add('labor-rules', 'Kiểm tra nội quy lao động và thủ tục liên quan', 'labor', 'Quy mô lao động do doanh nghiệp khai báo thuộc nhóm cần rà soát thêm.', 'verify', 'normal', 'Nhân sự', 'Xác minh số lao động thực tế và yêu cầu cụ thể trước khi kết luận.', 'Nội quy và hồ sơ liên quan');

  for (const template of checklistTemplates) {
    if (template.manualApply) continue;
    if (templateMatch(profile, template) !== 'match') continue;
    add(template.id, template.title, template.category, template.reason, 'verify', template.priority, template.owner, template.action, template.evidence, template.sourceNote);
    tasks[tasks.length - 1].origin = 'saved-template';
  }
  if (profile.places.some(place => ['warehouse', 'factory', 'store'].includes(place))) add('fire-scope', 'Xác minh nghĩa vụ PCCC theo từng địa điểm', 'fire', 'Doanh nghiệp có kho, nhà xưởng hoặc cửa hàng; chưa đủ thông tin để phân loại.', 'verify', 'high', 'Vận hành', 'Bổ sung công năng, diện tích, số tầng và loại hàng/thiết bị tại địa điểm.', 'Thông tin địa điểm và hồ sơ PCCC nếu có');
  if (profile.signals.includes('regulated')) add('industry-licence', 'Xác định điều kiện đối với hàng hóa/dịch vụ đặc thù', 'licence', 'Doanh nghiệp chọn có hàng hóa hoặc dịch vụ cần điều kiện.', 'verify', 'high', 'Chủ doanh nghiệp', 'Ghi rõ mặt hàng/dịch vụ để đối chiếu giấy phép và nghĩa vụ chuyên ngành.', 'Danh mục hàng hóa và giấy phép hiện có');
  if (profile.signals.includes('foreign')) add('foreign-investment', 'Xác minh nghĩa vụ có yếu tố nước ngoài', 'investment', 'Doanh nghiệp chọn có nhà đầu tư hoặc người lao động nước ngoài.', 'verify', 'normal', 'Chủ doanh nghiệp', 'Làm rõ yếu tố nước ngoài là sở hữu vốn, nhân sự hay giao dịch để chọn đúng checklist.', 'Thông tin loại giao dịch');
  if (profile.signals.includes('crossborder')) add('import-export', 'Rà soát nghĩa vụ liên quan xuất nhập khẩu', 'commerce', 'Doanh nghiệp xác nhận có hoạt động xuất nhập khẩu.', 'verify', 'normal', 'Kế toán/Vận hành', 'Xác định loại hàng, thị trường và quy trình chứng từ đang dùng.', 'Chứng từ mẫu');
  if (profile.signals.includes('ads')) add('advertising', 'Rà soát nội dung quảng cáo/khuyến mại', 'commerce', 'Doanh nghiệp xác nhận có quảng cáo hoặc khuyến mại.', 'verify', 'normal', 'Marketing', 'Xác định kênh, sản phẩm và nội dung quảng cáo để kiểm tra nghĩa vụ phù hợp.', 'Mẫu nội dung quảng cáo');
  alerts.forEach(alert => {
    if (appliedAlerts.includes(alert.id) && alert.task) {
      const t = alert.task;
      const matched = alert.test(profile);
      const reason = matched ? t.reason : `${t.reason} Công việc được tạo chủ động từ cảnh báo để doanh nghiệp xử lý.`;
      // Người dùng đã chọn “Tạo công việc” từ cảnh báo, nên đây là một đầu việc cần xử lý,
      // không quay lại bước xác minh phạm vi.
      add(t.id, t.title, t.category, reason, 'todo', t.priority, t.owner, t.action, t.evidence, t.source);
      Object.assign(tasks[tasks.length - 1], {
        alertId: alert.id,
        requiresScopeVerification: !matched,
        legalDate: alert.deadlineDate || alert.effectiveDate || alert.observedAt || alert.issuedAt,
        alertKind: alert.kind,
      });
    }
  });

  return tasks.sort((a, b) => compareTasksForAttention(a, b, profile.topics || []));
}

export function countTasks(tasks) {
  return {
    total: tasks.length,
    todo: tasks.filter(task => task.status === 'todo').length,
    verify: tasks.filter(task => task.status === 'verify').length,
    doing: tasks.filter(task => task.status === 'doing').length,
    review: tasks.filter(task => task.status === 'review').length,
    done: tasks.filter(task => task.status === 'done').length,
    na: tasks.filter(task => task.status === 'na').length,
  };
}
