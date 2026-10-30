import { Router, Request, Response } from 'express';
import { prisma } from '../infrastructure/db.js';

export const caseLawRouter = Router();

export const CASE_LAW_TOPICS = [
  { id: 'ALL', name: 'Tất cả Án lệ', icon: 'landmark' },
  { id: 'DAN_SU', name: 'Dân sự & Hợp đồng', icon: 'scroll-text' },
  { id: 'KINH_DOANH_THUONG_MAI', name: 'Kinh doanh & Thương mại', icon: 'briefcase' },
  { id: 'DAT_DAI', name: 'Đất đai & Nhà ở', icon: 'home' },
  { id: 'LAO_DONG', name: 'Lao động & Tiền lương', icon: 'users' },
  { id: 'HON_NHAN_GIA_DINH', name: 'Hôn nhân & Gia đình', icon: 'heart' },
  { id: 'HANH_CHINH', name: 'Hành chính & Khiếu kiện', icon: 'scale' },
];

const SEED_CASE_LAWS = [
  {
    precedentNumber: 'Án lệ số 25/2018/AL',
    title: 'Về việc không phạt cọc khi có thỏa thuận về phạt cọc nhưng một bên có lỗi không cố ý',
    topic: 'DAN_SU',
    issuingDecision: 'Quyết định số 269/QĐ-CA ngày 17/10/2018 của Chánh án TANDTC',
    approvalDate: new Date('2018-10-17'),
    legalRule: 'Trường hợp các bên có thỏa thuận đặt cọc để bảo đảm giao kết hợp đồng chuyển nhượng quyền sử dụng đất, nhưng sau đó việc chuyển nhượng không thực hiện được do trở ngại khách quan (UBND có thông báo thu hồi đất, quy hoạch thay đổi) mà các bên không lường trước được thì bên nhận cọc không phải chịu phạt cọc, chỉ phải trả lại số tiền cọc đã nhận.',
    factualSummary: 'Nguyên đơn đặt cọc 500 triệu đồng cho bị đơn để mua thửa đất tại quận 2, TP.HCM. Trong thời hạn đặt cọc, cơ quan nhà nước công bố quy hoạch đường và tạm dừng chuyển dịch tài sản. Nguyên đơn kiện đòi phạt cọc gấp đôi (1 tỷ đồng). Tòa án xác định không áp dụng phạt cọc do có trở ngại khách quan.',
    applicableArticles: 'Khoản 2 Điều 328 Bộ luật Dân sự 2015, Điều 302 Bộ luật Dân sự 2005',
    fullText: 'Hội đồng Thẩm phán TAND Tối cao nhận định: Mục đích đặt cọc là nhằm bảo đảm giao kết và thực hiện hợp đồng. Tuy nhiên, việc hợp đồng không thể ký kết xuất phát từ việc quy hoạch của Nhà nước thay đổi, không do lỗi chủ quan của bên nhận cọc. Do đó, buộc bên nhận cọc trả lại tiền gốc mà không phải chịu chế tài phạt cọc.',
    keywords: ['đặt cọc', 'phạt cọc', 'trở ngại khách quan', 'quy hoạch', 'hợp đồng mua bán nhà đất'],
    citationCount: 142,
  },
  {
    precedentNumber: 'Án lệ số 01/2016/AL',
    title: 'Về vụ án Giết người có hành vi côn đồ và công cụ nguy hiểm',
    topic: 'HANH_CHINH',
    issuingDecision: 'Quyết định số 220/QĐ-CA ngày 06/04/2016 của Chánh án TANDTC',
    approvalDate: new Date('2016-04-06'),
    legalRule: 'Hành vi dùng hung khí nguy hiểm tấn công vào vùng trọng yếu của cơ thể nạn nhân (vùng đầu, ngực, cổ) gây tử vong hoặc thương tích nặng phải bị xem xét về tội Giết người với tình tiết định khung có tính chất côn đồ.',
    factualSummary: 'Bị cáo dùng hung khí nguy hiểm đâm vào vùng cổ của bị hại do mâu thuẫn bộc phát tại quán ăn.',
    applicableArticles: 'Điều 93 Bộ luật Hình sự 1999 (nay là Điều 123 BLHS 2015)',
    fullText: 'Tòa án cấp sơ thẩm và phúc thẩm phải đánh giá tính chất nguy hiểm của phương tiện gây án và vị trí tấn công trên cơ thể để định tội danh chính xác.',
    keywords: ['hung khí nguy hiểm', 'vùng trọng yếu', 'côn đồ'],
    citationCount: 98,
  },
  {
    precedentNumber: 'Án lệ số 09/2017/AL',
    title: 'Về việc xác định lãi suất quá hạn và phạt vi phạm trong Hợp đồng tín dụng',
    topic: 'KINH_DOANH_THUONG_MAI',
    issuingDecision: 'Quyết định số 698/QĐ-CA ngày 28/12/2017 của Chánh án TANDTC',
    approvalDate: new Date('2017-12-28'),
    legalRule: 'Trong hợp đồng tín dụng giữa Tổ chức tín dụng và khách hàng, các bên được quyền thỏa thuận về mức lãi suất trong hạn và lãi suất quá hạn. Tòa án không áp dụng trần lãi suất 20%/năm của Bộ luật Dân sự đối với hoạt động cho vay thương mại của ngân hàng.',
    factualSummary: 'Doanh nghiệp vay vốn ngân hàng thương mại với lãi suất 13.5%/năm, lãi quá hạn 150%. Khi phát sinh nợ xấu, doanh nghiệp yêu cầu áp dụng mức trần lãi suất 20% theo Bộ luật Dân sự. Tòa án phán quyết áp dụng Luật Các tổ chức tín dụng là luật chuyên ngành.',
    applicableArticles: 'Điều 91 Luật Các tổ chức tín dụng 2010, Điều 468 Bộ luật Dân sự 2015',
    fullText: 'Quan hệ cho vay của tổ chức tín dụng chịu sự điều chỉnh của Luật Các tổ chức tín dụng là luật chuyên ngành ưu tiên áp dụng so với Bộ luật Dân sự.',
    keywords: ['hợp đồng tín dụng', 'lãi suất quá hạn', 'ngân hàng', 'luật các tổ chức tín dụng'],
    citationCount: 215,
  },
  {
    precedentNumber: 'Án lệ số 31/2020/AL',
    title: 'Về việc công nhận hợp đồng chuyển nhượng quyền sử dụng đất khi người nhận chuyển nhượng đã xây nhà kiên cố',
    topic: 'DAT_DAI',
    issuingDecision: 'Quyết định số 50/QĐ-CA ngày 25/02/2020 của Chánh án TANDTC',
    approvalDate: new Date('2020-02-25'),
    legalRule: 'Hợp đồng chuyển nhượng quyền sử dụng đất viết tay trước ngày 01/07/2004, bên nhận chuyển nhượng đã trả đủ tiền, đã nhận đất và xây dựng nhà ở kiên cố công khai, bên bán không có ý kiến phản đối trong thời gian dài thì Tòa án công nhận hiệu lực hợp đồng.',
    factualSummary: 'Năm 1999, ông A bán cho ông B diện tích 200m2 đất bằng giấy viết tay. Ông B đã trả đủ tiền và xây nhà 3 tầng ở từ năm 2000. Đến năm 2018 giá đất tăng, ông A khởi kiện yêu cầu tuyên hợp đồng vô hiệu do không công chứng. Tòa án tuyên công nhận hợp đồng hợp pháp cho ông B.',
    applicableArticles: 'Điều 129 Bộ luật Dân sự 2015, Luật Đất đai 2013',
    fullText: 'Nhằm bảo vệ quyền lợi hợp pháp của bên thứ ba ngay tình và sự ổn định của quan hệ xã hội, Tòa án công nhận hiệu lực của hợp đồng chuyển nhượng khi người mua đã thực hiện trên 2/3 nghĩa vụ và xây dựng công trình ổn định lâu dài.',
    keywords: ['giấy viết tay', 'chuyển nhượng đất', 'xây nhà kiên cố', 'công nhận hợp đồng'],
    citationCount: 310,
  },
  {
    precedentNumber: 'Án lệ số 39/2020/AL',
    title: 'Về việc đơn phương chấm dứt hợp đồng lao động đối với người lao động không hoàn thành công việc',
    topic: 'LAO_DONG',
    issuingDecision: 'Quyết định số 276/QĐ-CA ngày 10/08/2020 của Chánh án TANDTC',
    approvalDate: new Date('2020-08-10'),
    legalRule: 'Người sử dụng lao động chỉ được quyền đơn phương chấm dứt HĐLĐ với lý do người lao động thường xuyên không hoàn thành công việc khi trong Quy chế nội bộ/Thỏa ước lao động có quy định cụ thể tiêu chí đánh giá KPI và việc đánh giá đã được lập biên bản bằng văn bản theo đúng quy trình.',
    factualSummary: 'Công ty sa thải Trưởng phòng kinh doanh với lý do không đạt doanh số bán hàng quý 2. Tuy nhiên công ty chưa ban hành Quy chế đánh giá mức độ hoàn thành công việc có tham khảo ý kiến Công đoàn. Tòa án tuyên buộc công ty bồi thường 18 tháng tiền lương vì sa thải trái luật.',
    applicableArticles: 'Điều 36, Điều 41 Bộ luật Lao động 2019',
    fullText: 'Người sử dụng lao động muốn đơn phương chấm dứt hợp đồng lao động theo điểm a khoản 1 Điều 36 phải đảm bảo tiêu chí đánh giá mức độ hoàn thành công việc được ban hành hợp lệ và tham khảo ý kiến tổ chức đại diện người lao động.',
    keywords: ['đơn phương chấm dứt', 'hợp đồng lao động', 'kpi', 'sa thải trái luật', 'quy chế nội bộ'],
    citationCount: 187,
  },
  {
    precedentNumber: 'Án lệ số 43/2021/AL',
    title: 'Về việc chia tài sản chung vợ chồng khi có công sức đóng góp của gia đình bên chồng/bên vợ',
    topic: 'HON_NHAN_GIA_DINH',
    issuingDecision: 'Quyết định số 48/QĐ-CA ngày 12/03/2021 của Chánh án TANDTC',
    approvalDate: new Date('2021-03-12'),
    legalRule: 'Tài sản chung của vợ chồng hình thành trong thời kỳ hôn nhân nhưng có nguồn gốc chủ yếu từ tài sản riêng của cha mẹ một bên tặng cho hoặc hỗ trợ tiền bạc xây dựng thì khi ly hôn phải trích tính công sức đóng góp nhiều hơn cho bên có nguồn gốc tài sản.',
    factualSummary: 'Vợ chồng ly hôn chia căn nhà 10 tỷ đồng đứng tên cả hai vợ chồng. Quá trình giải quyết chứng minh được bố mẹ người vợ đã tặng cho tiền đất trị giá 70% giá trị căn nhà. Tòa án phân chia người vợ hưởng 65% và người chồng hưởng 35%.',
    applicableArticles: 'Điều 59 Luật Hôn nhân và Gia đình 2014',
    fullText: 'Nguyên tắc phân chia tài sản chung khi ly hôn là bình đẳng nhưng có tính đến công sức đóng góp, nguồn gốc tạo lập tài sản và lỗi của mỗi bên.',
    keywords: ['chia tài sản ly hôn', 'nguồn gốc tài sản', 'công sức đóng góp', 'hôn nhân gia đình'],
    citationCount: 165,
  },
];

async function ensureCaseLawsSeeded() {
  const count = await (prisma as any).caseLawPrecedent.count();
  if (count >= 5) return;

  for (const item of SEED_CASE_LAWS) {
    await (prisma as any).caseLawPrecedent.upsert({
      where: { precedentNumber: item.precedentNumber },
      create: item as any,
      update: item as any,
    });
  }
}

/**
 * GET /api/case-law/items — List case law precedents with topic filter and search
 */
/**
 * GET /api/case-law/topics — List topic taxonomy (single source of truth so the
 * frontend doesn't keep a hand-copied, driftable duplicate of this list).
 */
caseLawRouter.get('/topics', async (_req: Request, res: Response) => {
  return res.json(CASE_LAW_TOPICS);
});

caseLawRouter.get('/items', async (req: Request, res: Response) => {
  try {
    await ensureCaseLawsSeeded();

    const topic = req.query.topic as string | undefined;
    const search = req.query.search as string | undefined;

    const where: any = {};
    if (topic && topic !== 'ALL') {
      where.topic = topic;
    }
    if (search) {
      where.OR = [
        { precedentNumber: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { legalRule: { contains: search, mode: 'insensitive' } },
        { factualSummary: { contains: search, mode: 'insensitive' } },
      ];
    }

    const items = await (prisma as any).caseLawPrecedent.findMany({
      where,
      orderBy: { citationCount: 'desc' },
    });

    return res.json({ items, count: items.length });
  } catch (err) {
    console.error('[CaseLaw Router] Error fetching case laws:', err);
    return res.status(500).json({ error: 'Failed to fetch case law precedents' });
  }
});

/**
 * GET /api/case-law/items/:id — Get full detail of a specific case law
 */
caseLawRouter.get('/items/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const item = await (prisma as any).caseLawPrecedent.findFirst({
      where: {
        OR: [{ id }, { precedentNumber: id }],
      },
    });

    if (!item) {
      return res.status(404).json({ error: 'Case law precedent not found' });
    }

    // Increment citation count as view counter
    await (prisma as any).caseLawPrecedent.update({
      where: { id: item.id },
      data: { citationCount: { increment: 1 } },
    });

    return res.json(item);
  } catch (err) {
    console.error('[CaseLaw Router] Error fetching detail:', err);
    return res.status(500).json({ error: 'Failed to fetch case law detail' });
  }
});
