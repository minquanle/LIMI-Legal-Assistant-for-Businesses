import { Router, Request, Response } from 'express';

export const legalDiffRouter = Router();

export interface ComparisonPair {
  id: string;
  title: string;
  topic: string;
  oldLaw: {
    number: string;
    name: string;
    effectiveDate: string;
  };
  newLaw: {
    number: string;
    name: string;
    effectiveDate: string;
  };
  keyHighlights: Array<{
    title: string;
    description: string;
    impactLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  }>;
  articlesDiff: Array<{
    articleNumber: string;
    topicName: string;
    changeType: 'MODIFIED' | 'ADDED' | 'DELETED';
    oldContent: string;
    newContent: string;
    analysisNote: string;
  }>;
}

const COMPARISON_DATA: ComparisonPair[] = [
  {
    id: 'luat-dat-dai',
    title: 'So sánh Luật Đất đai 2013 vs Luật Đất đai 2024',
    topic: 'BẤT ĐỘNG SẢN & ĐẤT ĐAI',
    oldLaw: {
      number: '45/2013/QH13',
      name: 'Luật Đất đai 2013',
      effectiveDate: '01/07/2014',
    },
    newLaw: {
      number: '31/2024/QH15',
      name: 'Luật Đất đai 2024',
      effectiveDate: '01/08/2024',
    },
    keyHighlights: [
      {
        title: 'Bỏ hoàn toàn Khung giá đất định kỳ 5 năm',
        description: 'Các tỉnh thành tự xây dựng và ban hành Bảng giá đất hàng năm sát giá thị trường bắt đầu từ 01/01/2026.',
        impactLevel: 'CRITICAL',
      },
      {
        title: 'Mở rộng đối tượng và hạn mức nhận chuyển nhượng đất nông nghiệp',
        description: 'Cá nhân không trực tiếp sản xuất nông nghiệp và Doanh nghiệp được nhận chuyển nhượng đất trồng lúa; nâng hạn mức lên gấp 15 lần.',
        impactLevel: 'HIGH',
      },
      {
        title: 'Cấp Sổ đỏ cho đất không giấy tờ sử dụng trước 01/07/2014',
        description: 'Được UBND cấp xã xác nhận không có tranh chấp và phù hợp quy hoạch sẽ được cấp Giấy chứng nhận quyền sử dụng đất.',
        impactLevel: 'CRITICAL',
      },
      {
        title: 'Quy định bồi thường, tái định cư phải hoàn thành trước khi thu hồi đất',
        description: 'Khu tái định cư phải hoàn thiện hạ tầng kỹ thuật và xã hội đồng bộ trước khi cơ quan nhà nước ban hành quyết định thu hồi.',
        impactLevel: 'HIGH',
      },
    ],
    articlesDiff: [
      {
        articleNumber: 'Điều 114 (2013) vs Điều 159 (2024)',
        topicName: 'Bảng giá đất và Nguyên tắc định giá đất',
        changeType: 'MODIFIED',
        oldContent: 'Chính phủ ban hành khung giá đất định kỳ 05 năm một lần đối với từng loại đất, theo từng vùng. Bảng giá đất của UBND cấp tỉnh phải căn cứ vào khung giá đất của Chính phủ.',
        newContent: 'Bỏ khung giá đất của Chính phủ. Ủy ban nhân dân cấp tỉnh xây dựng, trình Hội đồng nhân dân cùng cấp quyết định Bảng giá đất lần đầu để công bố và áp dụng từ ngày 01 tháng 01 năm 2026. Hằng năm, UBND cấp tỉnh có trách nhiệm trình HĐND cấp tỉnh quyết định điều chỉnh, sửa đổi, bổ sung bảng giá đất.',
        analysisNote: 'Thay đổi mang tính cách mạng: Giá đất tính tiền sử dụng đất, bồi thường sẽ tiệm cận giá giao dịch thực tế thị trường, hạn chế cơ chế 2 giá.',
      },
      {
        articleNumber: 'Điều 101 (2013) vs Điều 138 (2024)',
        topicName: 'Cấp Giấy chứng nhận cho hộ gia đình, cá nhân không có giấy tờ',
        changeType: 'MODIFIED',
        oldContent: 'Hộ gia đình, cá nhân đang sử dụng đất trước ngày 01 tháng 7 năm 2004 mà không có giấy tờ quy định tại Điều 100 của Luật này, có hộ khẩu thường trú tại địa phương và trực tiếp sản xuất nông nghiệp.',
        newContent: 'Mở rộng mốc thời gian đến trước ngày 01 tháng 7 năm 2014. Hộ gia đình, cá nhân sử dụng đất ổn định, được UBND cấp xã nơi có đất xác nhận là không có tranh chấp, phù hợp với quy hoạch sử dụng đất cấp huyện thì được cấp Giấy chứng nhận quyền sử dụng đất.',
        analysisNote: 'Nới lỏng thêm 10 năm (từ 2004 lên 2014) giải quyết hàng triệu hồ sơ đất đai tồn đọng lâu năm.',
      },
      {
        articleNumber: 'Điều 127 (2024) [Mới]',
        topicName: 'Sử dụng đất để thực hiện dự án phát triển kinh tế - xã hội thông qua thỏa thuận',
        changeType: 'ADDED',
        oldContent: '(Chưa có quy định chi tiết riêng về việc thỏa thuận nhận quyền sử dụng đất để làm nhà ở thương mại chỉ giới hạn đất ở).',
        newContent: 'Được thỏa thuận nhận quyền sử dụng đất ở hoặc đất khác để thực hiện dự án nhà ở thương mại nếu phù hợp với quy hoạch đô thị và quy hoạch sử dụng đất cấp huyện đã được phê duyệt.',
        analysisNote: 'Gỡ nút thắt pháp lý lớn cho hàng trăm dự án bất động sản bị tắc do không có sẵn 100% đất ở.',
      },
    ],
  },
  {
    id: 'luat-bhxh',
    title: 'So sánh Luật Bảo hiểm Xã hội 2014 vs Luật BHXH 2024',
    topic: 'LAO ĐỘNG & BẢO HIỂM',
    oldLaw: {
      number: '58/2014/QH13',
      name: 'Luật Bảo hiểm Xã hội 2014',
      effectiveDate: '01/01/2016',
    },
    newLaw: {
      number: '41/2024/QH15',
      name: 'Luật Bảo hiểm Xã hội 2024',
      effectiveDate: '01/07/2025',
    },
    keyHighlights: [
      {
        title: 'Giảm số năm đóng BHXH tối thiểu để hưởng lương hưu xuống 15 năm',
        description: 'Thay vì phải đóng đủ 20 năm, người lao động chỉ cần đóng đủ 15 năm BHXH là đủ điều kiện hưởng lương hưu hàng tháng khi đủ tuổi.',
        impactLevel: 'CRITICAL',
      },
      {
        title: 'Quy định mới về rút BHXH một lần',
        description: 'Người bắt đầu tham gia BHXH từ 01/07/2025 trở đi chỉ được rút 1 lần trong 4 trường hợp đặc biệt (đủ tuổi nghỉ hưu, ra nước ngoài định cư, bệnh hiểm nghèo, suy giảm 81% LĐ).',
        impactLevel: 'CRITICAL',
      },
      {
        title: 'Chế tài xử lý nghiêm chậm đóng, trốn đóng BHXH',
        description: 'Tính lãi 0.03%/ngày trên số tiền chậm nộp, phạt vi phạm hành chính và cấm xuất cảnh đối với người đại diện theo pháp luật của doanh nghiệp trốn đóng.',
        impactLevel: 'HIGH',
      },
    ],
    articlesDiff: [
      {
        articleNumber: 'Điều 54 (2014) vs Điều 64 (2024)',
        topicName: 'Điều kiện hưởng lương hưu hàng tháng',
        changeType: 'MODIFIED',
        oldContent: 'Người lao động đủ tuổi nghỉ hưu theo quy định và có đủ 20 năm đóng bảo hiểm xã hội trở lên thì được hưởng lương hưu.',
        newContent: 'Người lao động khi nghỉ việc có thời gian đóng bảo hiểm xã hội bắt buộc từ đủ 15 năm trở lên thì được hưởng lương hưu nếu đủ tuổi nghỉ hưu theo quy định tại khoản 2 Điều 169 của Bộ luật Lao động.',
        analysisNote: 'Tạo cơ hội cho hàng trăm nghìn lao động tham gia BHXH muộn (ở độ tuổi 40-45) vẫn có cơ hội nhận lương hưu khi về già.',
      },
      {
        articleNumber: 'Điều 39 & Điều 40 (2024) [Mới]',
        topicName: 'Biện pháp xử lý hành vi chậm đóng, trốn đóng bảo hiểm xã hội bắt buộc',
        changeType: 'ADDED',
        oldContent: '(Chỉ quy định thu tiền lãi chậm đóng 2 lần lãi suất đầu tư quỹ BHXH).',
        newContent: 'Bắt buộc đóng đủ số tiền trốn đóng; nộp số tiền bằng 0,03%/ngày tính trên số tiền trốn đóng; không xem xét trao tặng các danh hiệu thi đua; cơ quan có thẩm quyền quyết định tạm hoãn xuất cảnh đối với người đại diện theo pháp luật của người sử dụng lao động trốn đóng từ 12 tháng trở lên.',
        analysisNote: 'Bổ sung biện pháp mạnh tạm hoãn xuất cảnh và truy cứu trách nhiệm hình sự trực tiếp.',
      },
    ],
  },
  {
    id: 'luat-nha-o',
    title: 'So sánh Luật Nhà ở 2014 vs Luật Nhà ở 2023',
    topic: 'BẤT ĐỘNG SẢN & XÂY DỰNG',
    oldLaw: {
      number: '65/2014/QH13',
      name: 'Luật Nhà ở 2014',
      effectiveDate: '01/07/2015',
    },
    newLaw: {
      number: '27/2023/QH15',
      name: 'Luật Nhà ở 2023',
      effectiveDate: '01/08/2024',
    },
    keyHighlights: [
      {
        title: 'Không quy định thời hạn sở hữu nhà chung cư',
        description: 'Chỉ quy định thời hạn sử dụng nhà chung cư theo hồ sơ thiết kế công trình, bảo vệ quyền sở hữu tài sản lâu dài của người mua nhà.',
        impactLevel: 'CRITICAL',
      },
      {
        title: 'Quy định siết chặt điều kiện an toàn PCCC đối với Chung cư mini',
        description: 'Nhà ở nhiều tầng nhiều căn hộ của cá nhân từ 2 tầng và có từ 20 căn hộ trở lên bắt buộc phải lập dự án đầu tư và đáp ứng tiêu chuẩn PCCC như chung cư thương mại.',
        impactLevel: 'HIGH',
      },
    ],
    articlesDiff: [
      {
        articleNumber: 'Điều 57 (2023) [Mới]',
        topicName: 'Phát triển nhà ở nhiều tầng nhiều căn hộ của cá nhân (Chung cư mini)',
        changeType: 'ADDED',
        oldContent: '(Chưa có quy định riêng biệt chi tiết về phân loại cấp phép chung cư mini).',
        newContent: 'Cá nhân xây dựng nhà ở có từ 02 tầng trở lên mà tại mỗi tầng có thiết kế căn hộ để bán, cho thuê mua, cho thuê từ 20 căn hộ trở lên phải lập dự án đầu tư; đáp ứng yêu cầu PCCC theo quy chuẩn kỹ thuật quốc gia.',
        analysisNote: 'Chấm dứt tình trạng xây chung cư mini tràn lan không đảm bảo an toàn PCCC và lối thoát hiểm.',
      },
    ],
  },
];

/**
 * GET /api/legal-diff/pairs — List all available comparison pairs
 */
legalDiffRouter.get('/pairs', async (_req: Request, res: Response) => {
  return res.json(
    COMPARISON_DATA.map((p) => ({
      id: p.id,
      title: p.title,
      topic: p.topic,
      oldLaw: p.oldLaw,
      newLaw: p.newLaw,
      highlightsCount: p.keyHighlights.length,
      articlesCount: p.articlesDiff.length,
    }))
  );
});

/**
 * GET /api/legal-diff/pairs/:id — Get full side-by-side diff details
 */
legalDiffRouter.get('/pairs/:id', async (req: Request, res: Response) => {
  const pair = COMPARISON_DATA.find((p) => p.id === req.params.id);
  if (!pair) {
    return res.status(404).json({ error: 'Comparison pair not found' });
  }
  return res.json(pair);
});
