# Legal Knowledge Graph — Ontology v2.0 (small)

Chuẩn trích xuất đồ thị tri thức pháp luật Việt Nam (Norm-centric). Sinh tự động từ `legal-analysis-template.small.json` và ví dụ thực tế từ 10 luật 2025-2026.

## Entity

| STT | Thực thể | Mô tả | Ví dụ |
|-----|--------|--------|--------|
| 1 | LegalDocument | Văn bản do cơ quan có thẩm quyền ban hành hoặc cá nhân lập để ghi nhận sự kiện pháp lý. Làm phát sinh, thay đổi hoặc chấm dứt quyền nghĩa vụ. | Giấy chứng nhận quyền sử dụng đất |
| 2 | Law | Văn bản quy phạm pháp luật do cơ quan nhà nước có thẩm quyền ban hành, quy định quy tắc xử sự bắt buộc chung và có hiệu lực pháp lý cao nhất trong hệ thống. | Luật Doanh nghiệp 2020 |
| 3 | Resolution | Nghị quyết là văn bản do cơ quan nhà nước có thẩm quyền ban hành để quyết định các vấn đề chính sách hoặc quy phạm pháp luật. | Nghị quyết số 43/2022/QH15 về chính sách tài khóa tiền tệ |
| 4 | Decree | Văn bản quy phạm pháp luật do Chính phủ ban hành để quy định chi tiết thi hành luật, nghị quyết của Quốc hội. | Nghị định 01/2021/NĐ-CP về đăng ký doanh nghiệp |
| 5 | Circular | Văn bản quy phạm pháp luật do bộ hoặc cơ quan ngang bộ phát hành để hướng dẫn thi hành luật, nghị định và quy định thủ tục cụ thể. | Thông tư 80/2021/TT-BTC về thuế |
| 6 | Norm | Quy tắc xử sự bắt buộc chung do nhà nước ban hành và bảo đảm thực hiện, điều chỉnh các quan hệ xã hội. | Bộ luật Dân sự quy định về giao kết hợp đồng |
| 7 | Obligation | Nghĩa vụ pháp lý buộc chủ thể phải thực hiện hoặc không thực hiện một hành vi nhất định. Được bảo đảm bằng cưỡng chế nhà nước. | Nghĩa vụ nộp thuế |
| 8 | Permission | Sự công nhận của pháp luật cho chủ thể tự do lựa chọn hành động trong phạm vi không bị cấm. | Được phép đăng ký hộ kinh doanh cá thể |
| 9 | Right | Khả năng pháp lý được làm hoặc đòi hỏi người khác làm hành vi nhất định, được nhà nước bảo vệ. | Quyền sở hữu đối với bất động sản |
| 10 | Prohibition | Sự nghiêm cấm bằng pháp luật đối với hành vi cụ thể, vi phạm sẽ bị xử lý chế tài. | Cấm vận chuyển hàng lậu |
| 11 | Exception | Quy định loại trừ việc áp dụng nguyên tắc pháp lý chung đối với một trường hợp cụ thể được xác định rõ. | Miễn trừ trách nhiệm hình sự cho ngoại giao đoàn |
| 12 | Condition | Sự kiện hoặc yêu cầu pháp lý phải xảy ra hoặc được thỏa mãn để làm phát sinh, thay đổi hoặc chấm dứt hiệu lực của quan hệ pháp luật. | Điều kiện tiên quyết để hợp đồng có hiệu lực |
| 13 | Sanction |  |  |
| 14 | NaturalPerson | Cá nhân con người có năng lực pháp luật và năng lực hành vi theo quy định pháp luật. Là chủ thể nguyên thủy của mọi quan hệ pháp luật. | Lê Văn C |
| 15 | GovernmentAgency | Cơ quan nhà nước là tổ chức thuộc bộ máy nhà nước, được giao thực hiện quyền lực nhà nước hoặc quản lý hành chính công. | Bộ Tài chính |
| 16 | Organization | Tổ chức là tập hợp người hoặc tài sản có mục đích hoạt động nhất định, có thể chưa có tư cách pháp nhân. | Chi hội Chữ thập đỏ phường |
| 17 | Competence |  | Bộ trưởng Bộ Xây dựng: quy định tỷ lệ |
| 18 | Property | Vật hoặc quyền tài sản thuộc sở hữu hợp pháp của cá nhân, tổ chức, bao gồm động sản và bất động sản. | Xe máy cá nhân |
| 19 | Fact |  | Điều 3 của Luật này: được lập căn cứ vào |
| 20 | Action |  | lập đồng thời với nhau |
| 21 | Statement | Tuyên bố pháp lý chung thể hiện thông tin hoặc ý chí của cơ quan nhà nước trong văn bản quy phạm. | Nhà nước bảo hộ quyền sở hữu hợp pháp của công dân |
| 22 | Deadline | Thời hạn do pháp luật hoặc thỏa thuận ấn định, hết thời điểm đó quyền hoặc nghĩa vụ chấm dứt hoặc phát sinh chế tài. | Hạn nộp phạt vi phạm giao thông 10/04/2025 |
| 23 | LegalReference | Tham chiếu đến văn bản quy phạm pháp luật hoặc nguyên tắc pháp lý làm căn cứ giải quyết vụ việc. | Bộ luật Dân sự 2015 |

## Relationship

| STT | Quan hệ | Mô tả | Ví dụ |
|-----|--------|--------|--------|
| 1 | HAS_PART | Quan hệ chỉ ra một văn bản luật hoặc thực thể pháp lý chứa đựng một phần cấu thành hoặc bộ phận cụ thể bên trong nó. | Bộ luật Dân sự 2015 (Văn bản luật) HAS_PART Phần thứ nhất: Những quy định chung (Phần) |
| 2 | HAS_ARTICLE | Quan hệ giữa văn bản luật và các điều được ban hành trong đó. Node nguồn là LawDocument, node đích là Article. | Luật Doanh nghiệp 2020 (LawDocument) có Điều 111 (Article) về quyền của cổ đông. |
| 3 | HAS_CLAUSE | Quan hệ giữa một điều luật và các khoản cấu thành điều đó. Node nguồn là Article, node đích là Clause. | Điều 13 (Article) có Khoản 2 (Clause) định nghĩa quyền nhân thân. |
| 4 | HAS_POINT | Quan hệ giữa một khoản và các điểm chia nhỏ nội dung khoản đó. Node nguồn là Clause, node đích là Point. | Khoản 1 (Clause) bao gồm Điểm a (Point) về loại hợp đồng. |
| 5 | PART_OF | Quan hệ không gian thể hiện đơn vị hành chính hoặc khu vực là bộ phận cấu thành của đơn vị lớn hơn. Xác định cấp bậc địa giới hành chính theo luật định. | Quận C (Node: AdministrativeArea) part_of TP. Hà Nội (Node: AdministrativeArea) |
| 6 | NEXT | Quan hệ tuần tự thể hiện đơn vị pháp lý này đứng ngay sau đơn vị pháp lý khác trong văn bản. Dùng để duy trì trình tự đọc và áp dụng luật. | Điều 10 (Điều) NEXT (Điều) Điều 11 Luật Đất đai năm 2013 quy định về quyền và nghĩa vụ của người sử dụng đất. |
| 7 | PREVIOUS | Quan hệ tuần tự thể hiện đơn vị pháp lý này đứng ngay trước đơn vị pháp lý khác trong văn bản. Hỗ trợ việc truy xuất ngược trình tự quy định. | Điều 5 (Điều) PREVIOUS (Điều) Điều 4 Luật Doanh nghiệp năm 2020 quy định về quyền của doanh nghiệp. |
| 8 | IMPLEMENTS | Quan hệ chỉ việc văn bản cấp dưới quy định chi tiết, hướng dẫn thi hành văn bản cấp trên trong hệ thống pháp luật. | Nghị định 30/2020 (Decree) IMPLEMENTS Luật Căn cước 2023 (Law) |
| 9 | GUIDES | Văn bản nguồn hướng dẫn chi tiết cách thi hành văn bản đích. Thường do cơ quan cấp dưới ban hành để thực hiện văn bản cấp trên. | Circular (Thông tư) 01/2020/TT-BTP GUIDES Decree (Nghị định) 23/2015/NĐ-CP về cấp bản sao từ sổ gốc. |
| 10 | INTERPRETS | Văn bản nguồn giải thích nội dung, phạm vi áp dụng của văn bản đích. Giúp xóa bỏ sự mập mờ trong quy định pháp luật. | Official Letter (Công văn) 123/TCT-CS INTERPRETS Law (Luật) Thuế GTGT về đối tượng không chịu thuế. |
| 11 | CITES | Văn bản nguồn trích dẫn trực tiếp văn bản đích làm căn cứ pháp lý ban hành. | Nghị định 123/2020/NĐ-CP (Document) trích dẫn Luật Quản lý thuế 2019 (Document) |
| 12 | AMENDS | Quan hệ chỉ việc một văn bản pháp luật sửa đổi, bổ sung nội dung của một văn bản pháp luật khác đã ban hành. | Luật sửa đổi bổ sung một số điều của Luật Giáo dục 2019 (Law) AMENDS Luật Giáo dục 2005 (Law) |
| 13 | REPEALS | Quan hệ chỉ việc một văn bản pháp luật bãi bỏ toàn bộ hoặc một phần hiệu lực pháp lý của văn bản khác. | Luật Ban hành văn bản quy phạm pháp luật 2015 (Law) REPEALS Luật Ban hành văn bản quy phạm pháp luật 2008 (Law) |
| 14 | REPLACES | Quan hệ chỉ văn bản pháp lý thay thế hoàn toàn văn bản khác đã tồn tại, làm cho văn bản cũ chấm dứt hiệu lực. | Nghị định 01/2021/NĐ-CP (node Nghị định) thay thế Nghị định 02/2015/NĐ-CP (node Nghị định). |
| 15 | HAS_SUBJECT | Quan hệ xác định chủ thể (cá nhân/tổ chức) chịu sự điều chỉnh hoặc có quyền nghĩa vụ từ quy phạm. | Quy phạm bảo hiểm y tế HAS_SUBJECT Người lao động |
| 16 | HAS_OBJECT | Quan hệ chỉ ra đối tượng (tài sản, hành vi, trạng thái) là mục tiêu tác động của quy phạm pháp luật. | Quy phạm bảo vệ môi trường HAS_OBJECT Nguồn nước mặt |
| 17 | HAS_ACTION | Quan hệ mô tả hành vi được cho phép, bị cấm hoặc bắt buộc thực hiện theo quy phạm pháp luật. | Quy phạm giao thông đường bộ HAS_ACTION Dừng xe trước vạch kẻ |
| 18 | HAS_CONDITION | Quan hệ chỉ điều kiện cần thiết để một quy phạm pháp luật phát sinh hiệu lực hoặc được áp dụng đối với đối tượng. | Điều 64 Luật Đất đai (LegalProvision) HAS_CONDITION Giấy chứng nhận quyền sử dụng đất (Condition) |
| 19 | HAS_EXCEPTION | Quan hệ chỉ trường hợp loại trừ không áp dụng quy phạm pháp luật trong hoàn cảnh cụ thể dù thỏa mãn điều kiện chung. | Nghĩa vụ tham gia nghĩa vụ quân sự (Obligation) HAS_EXCEPTION Người đang học đại học (Exception) |
| 20 | HAS_DEADLINE | Quan hệ chỉ mốc thời gian hoặc khoảng thời gian tối đa mà chủ thể phải thực hiện hoặc hoàn tất hành vi pháp lý. | Thủ tục cấp giấy phép xây dựng (Procedure) HAS_DEADLINE 20 ngày làm việc (Deadline) |
| 21 | HAS_AUTHORITY | Quan hệ chỉ cơ quan, tổ chức hoặc cá nhân được pháp luật giao thẩm quyền ban hành, thi hành hoặc giám sát quy phạm. | Quyết định xử phạt vi phạm hành chính (Sanction) HAS_AUTHORITY Chủ tịch UBND cấp huyện (Authority) |
| 22 | HAS_CONSEQUENCE | Quan hệ chỉ ra hệ quả pháp lý hoặc chế tài phát sinh từ một quy phạm. Node nguồn là Quy phạm, node đích là Hệ quả pháp lý hoặc Chế tài. | Điều 8 Luật Hình sự (node: Quy phạm) HAS_CONSEQUENCE (node: Chế tài) Khoản 2 Điều 12 (phạt tù 2 năm) |
| 23 | HAS_SCOPE | Quan hệ xác định phạm vi điều chỉnh, đối tượng chịu tác động hoặc giới hạn không gian/thời gian của một quy phạm. | Luật Bảo vệ môi trường 2020 (Node: Văn bản luật) có phạm vi điều chỉnh bao gồm Hoạt động bảo vệ môi trường (Node: Lĩnh vực). |
| 24 | HAS_REFERENCE | Quan hệ tham chiếu hoặc trích dẫn tới văn bản, điều khoản khác để làm rõ nội dung. Node nguồn là Quy phạm đang xét, node đích là Văn bản hoặc Điều khoản được dẫn. | Điều 10 Thông tư 04 (node: Quy phạm) HAS_REFERENCE (node: Điều khoản) Điều 5 Nghị định 15 |
| 25 | HAS_STATEMENT | Quan hệ giữa văn bản hoặc điều khoản luật với tuyên bố pháp lý cụ thể mà nó chứa đựng. Node nguồn là văn bản luật, node đích là tuyên bố. | (Luật Doanh nghiệp 2020) -[HAS_STATEMENT]-> (Điều 111 về quyền của cổ đông) |
| 26 | HAS_DEFINITION | Quan hệ liên kết thuật ngữ pháp lý với nội dung định nghĩa chính thức trong văn bản quy phạm pháp luật. | Điều 3 Luật Hôn nhân: Cơ quan đăng ký (node nguồn: StateAgency) HAS_DEFINITION Kết hôn (node đích: LegalTerm). |
| 27 | ISSUES | Quan hệ khi cơ quan hoặc tổ chức có thẩm quyền ban hành văn bản, giấy phép, quyết định pháp lý cho thực thể khác. | Bộ Tư pháp (Node: Cơ quan Nhà nước) ISSUES giấy phép hành nghề luật sư cho cá nhân (Node: Cá nhân). |
| 28 | CREATED_BY | Quan hệ chỉ thực thể đã khởi tạo hoặc ban hành một đối tượng pháp lý. Thể hiện nguồn gốc và thẩm quyền tạo lập. | (Văn bản luật) CREATED_BY (Quốc hội) |

