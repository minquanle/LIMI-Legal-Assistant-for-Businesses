# Legal Knowledge Graph — Ontology v2.0 (medium)

Chuẩn trích xuất đồ thị tri thức pháp luật Việt Nam (Norm-centric). Sinh tự động từ `legal-analysis-template.medium.json` và ví dụ thực tế từ 10 luật 2025-2026.

## Entity

| STT | Thực thể | Mô tả | Ví dụ |
|-----|--------|--------|--------|
| 1 | LegalDocument | Văn bản do cơ quan có thẩm quyền ban hành hoặc cá nhân lập để ghi nhận sự kiện pháp lý. Làm phát sinh, thay đổi hoặc chấm dứt quyền nghĩa vụ. | Giấy chứng nhận quyền sử dụng đất |
| 2 | Law | Văn bản quy phạm pháp luật do cơ quan nhà nước có thẩm quyền ban hành, quy định quy tắc xử sự bắt buộc chung và có hiệu lực pháp lý cao nhất trong hệ thống. | Luật Doanh nghiệp 2020 |
| 3 | Resolution | Nghị quyết là văn bản do cơ quan nhà nước có thẩm quyền ban hành để quyết định các vấn đề chính sách hoặc quy phạm pháp luật. | Nghị quyết số 43/2022/QH15 về chính sách tài khóa tiền tệ |
| 4 | Decree | Văn bản quy phạm pháp luật do Chính phủ ban hành để quy định chi tiết thi hành luật, nghị quyết của Quốc hội. | Nghị định 01/2021/NĐ-CP về đăng ký doanh nghiệp |
| 5 | Circular | Văn bản quy phạm pháp luật do bộ hoặc cơ quan ngang bộ phát hành để hướng dẫn thi hành luật, nghị định và quy định thủ tục cụ thể. | Thông tư 80/2021/TT-BTC về thuế |
| 6 | Formula | Công thức tính toán quy định cách xác định một giá trị pháp lý hoặc tài chính cụ thể. | Thuế TNDN = Thu nhập chịu thuế × 20% |
| 7 | Norm | Quy tắc xử sự bắt buộc chung do nhà nước ban hành và bảo đảm thực hiện, điều chỉnh các quan hệ xã hội. | Bộ luật Dân sự quy định về giao kết hợp đồng |
| 8 | Obligation | Nghĩa vụ pháp lý buộc chủ thể phải thực hiện hoặc không thực hiện một hành vi nhất định. Được bảo đảm bằng cưỡng chế nhà nước. | Nghĩa vụ nộp thuế |
| 9 | Permission | Sự công nhận của pháp luật cho chủ thể tự do lựa chọn hành động trong phạm vi không bị cấm. | Được phép đăng ký hộ kinh doanh cá thể |
| 10 | Right | Khả năng pháp lý được làm hoặc đòi hỏi người khác làm hành vi nhất định, được nhà nước bảo vệ. | Quyền sở hữu đối với bất động sản |
| 11 | Prohibition | Sự nghiêm cấm bằng pháp luật đối với hành vi cụ thể, vi phạm sẽ bị xử lý chế tài. | Cấm vận chuyển hàng lậu |
| 12 | Exception | Quy định loại trừ việc áp dụng nguyên tắc pháp lý chung đối với một trường hợp cụ thể được xác định rõ. | Miễn trừ trách nhiệm hình sự cho ngoại giao đoàn |
| 13 | Condition | Sự kiện hoặc yêu cầu pháp lý phải xảy ra hoặc được thỏa mãn để làm phát sinh, thay đổi hoặc chấm dứt hiệu lực của quan hệ pháp luật. | Điều kiện tiên quyết để hợp đồng có hiệu lực |
| 14 | Eligibility | Tiêu chuẩn chủ thể cần thỏa mãn để được hưởng quyền hoặc tham gia quan hệ pháp luật. | Công dân đủ 18 tuổi mới được bầu cử |
| 15 | Liability | Nghĩa vụ tài sản hoặc trách nhiệm bồi thường thiệt hại được pháp luật xác định khi chủ thể gây thiệt hại hoặc vi phạm hợp đồng. Thường biểu hiện bằng số tiền phải trả. | Bồi thường 500 triệu đồng do làm hư hại tài sản người khác. |
| 16 | Rule |  |  |
| 17 | Sanction |  |  |
| 18 | NaturalPerson | Cá nhân con người có năng lực pháp luật và năng lực hành vi theo quy định pháp luật. Là chủ thể nguyên thủy của mọi quan hệ pháp luật. | Lê Văn C |
| 19 | GovernmentAgency | Cơ quan nhà nước là tổ chức thuộc bộ máy nhà nước, được giao thực hiện quyền lực nhà nước hoặc quản lý hành chính công. | Bộ Tài chính |
| 20 | Organization | Tổ chức là tập hợp người hoặc tài sản có mục đích hoạt động nhất định, có thể chưa có tư cách pháp nhân. | Chi hội Chữ thập đỏ phường |
| 21 | Competence |  | Bộ trưởng Bộ Xây dựng: quy định tỷ lệ |
| 22 | Property | Vật hoặc quyền tài sản thuộc sở hữu hợp pháp của cá nhân, tổ chức, bao gồm động sản và bất động sản. | Xe máy cá nhân |
| 23 | License | Văn bản do cơ quan nhà nước có thẩm quyền cấp, cho phép cá nhân hoặc tổ chức được thực hiện hoạt động hoặc sử dụng tài sản theo quy định pháp luật. | Giấy phép kinh doanh |
| 24 | Certificate | Văn bản xác nhận cá nhân đã đạt trình độ, kỹ năng hoặc điều kiện pháp lý nhất định do cơ quan có thẩm quyền cấp. | Chứng chỉ hành nghề luật sư |
| 25 | Permit | Giấy phép cụ thể cho phép thực hiện một hành vi hoặc sự kiện nhất định trong thời hạn và điều kiện giới hạn. | Giấy phép mang súng |
| 26 | Contract | Hợp đồng là thỏa thuận giữa các bên về việc xác lập, thay đổi hoặc chấm dứt quyền, nghĩa vụ dân sự theo quy định pháp luật. | Hợp đồng mua bán căn hộ chung cư |
| 27 | Application | Đơn là văn bản hoặc bản điện tử cá nhân, tổ chức gửi cơ quan nhà nước để yêu cầu giải quyết thủ tục hành chính hoặc cấp phép. | Đơn xin cấp giấy phép xây dựng |
| 28 | Fact |  | Điều 3 của Luật này: được lập căn cứ vào |
| 29 | LegalTransaction |  |  |
| 30 | Action |  | lập đồng thời với nhau |
| 31 | Statement | Tuyên bố pháp lý chung thể hiện thông tin hoặc ý chí của cơ quan nhà nước trong văn bản quy phạm. | Nhà nước bảo hộ quyền sở hữu hợp pháp của công dân |
| 32 | LegalEvent | Sự kiện làm phát sinh, thay đổi hoặc chấm dứt quyền và nghĩa vụ pháp lý của chủ thể theo quy định pháp luật. | Ký kết hợp đồng lao động |
| 33 | Procedure | Thủ tục hành chính hoặc tố tụng do pháp luật quy định để giải quyết công việc cụ thể một cách có thứ tự và minh bạch. | Thủ tục cấp giấy phép xây dựng |
| 34 | Workflow | Luồng công việc nội bộ mô tả trình tự hoạt động giữa các bộ phận để vận hành một quy trình pháp lý hoặc quản lý. | Luồng tiếp nhận hồ sơ qua phòng ban một cửa |
| 35 | Step | Bước thực hiện là đơn vị hành động có ý nghĩa quản lý độc lập trong quy trình, thường được quy định rõ thời hạn và nội dung. | Bước nộp hồ sơ và nhận biên nhận |
| 36 | Task | Nhiệm vụ là công việc chi tiết do cá nhân hoặc đơn vị đảm nhiệm để hoàn thành một bước quy trình đã định. | Kiểm tra tính hợp lệ của giấy tờ tùy thân |
| 37 | Deadline | Thời hạn do pháp luật hoặc thỏa thuận ấn định, hết thời điểm đó quyền hoặc nghĩa vụ chấm dứt hoặc phát sinh chế tài. | Hạn nộp phạt vi phạm giao thông 10/04/2025 |
| 38 | Duration | Khoảng thời gian liên tục đo bằng ngày, tháng, năm mà một trạng thái pháp lý hoặc hợp đồng duy trì. | Thời hạn thuê nhà 12 tháng |
| 39 | LegalReference | Tham chiếu đến văn bản quy phạm pháp luật hoặc nguyên tắc pháp lý làm căn cứ giải quyết vụ việc. | Bộ luật Dân sự 2015 |
| 40 | Requirement | Yêu cầu pháp lý là điều kiện bắt buộc phải thỏa mãn theo quy định của pháp luật để một chủ thể được thực hiện quyền hoặc miễn trách nhiệm. | Doanh nghiệp phải có vốn điều lệ tối thiểu 10 tỷ để thành lập ngân hàng |

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
| 25 | HAS_FORMULA | Quan hệ chỉ định công thức toán học hoặc phương pháp tính được dùng để cụ thể hóa một quy định pháp lý. Thể hiện sự ràng buộc về mặt tính toán giữa văn bản quy phạm và biểu thức tính. | (Node: Điều 7 Luật Thuế TNCN) HAS_FORMULA (Node: Công thức tính thuế lũy tiến từng phần) |
| 26 | HAS_REQUIREMENT | Quan hệ thể hiện điều kiện bắt buộc, nghĩa vụ hoặc tiêu chuẩn hành động mà chủ thể phải tuân thủ theo quy định. Là cầu nối giữa quy phạm và nghĩa vụ cụ thể. | (Node: Luật Doanh nghiệp) HAS_REQUIREMENT (Node: Nghĩa vụ công bố thông tin định kỳ) |
| 27 | HAS_ELIGIBILITY | Quan hệ xác định đối tượng, chủ thể hoặc điều kiện tiên quyết để được hưởng quyền lợi hoặc tham gia cơ chế pháp lý. Giới hạn phạm vi áp dụng của quy định với thực thể. | (Node: Chế độ bảo hiểm thất nghiệp) HAS_ELIGIBILITY (Node: Người lao động đã đóng bảo hiểm trên 12 tháng) |
| 28 | HAS_VALIDITY | Quan hệ xác định khoảng thời gian, địa điểm hoặc phạm vi mà quy định pháp lý còn hiệu lực thi hành. Đảm bảo tính xác thực về mặt thời gian và không gian áp dụng. | (Node: Luật Đất đai 2024) HAS_VALIDITY (Node: Có hiệu lực thi hành từ ngày 01/01/2025) |
| 29 | HAS_STATEMENT | Quan hệ giữa văn bản hoặc điều khoản luật với tuyên bố pháp lý cụ thể mà nó chứa đựng. Node nguồn là văn bản luật, node đích là tuyên bố. | (Luật Doanh nghiệp 2020) -[HAS_STATEMENT]-> (Điều 111 về quyền của cổ đông) |
| 30 | HAS_DEFINITION | Quan hệ liên kết thuật ngữ pháp lý với nội dung định nghĩa chính thức trong văn bản quy phạm pháp luật. | Điều 3 Luật Hôn nhân: Cơ quan đăng ký (node nguồn: StateAgency) HAS_DEFINITION Kết hôn (node đích: LegalTerm). |
| 31 | HAS_RULE |  |  |
| 32 | HAS_ANTECEDENT |  |  |
| 33 | HAS_CONSEQUENT |  |  |
| 34 | GENERATES | Quan hệ mô tả một bước xử lý, quyết định hoặc tác vụ tạo ra một văn bản, hồ sơ hoặc bản ghi dữ liệu mới trong hệ thống. Thể hiện đầu ra hợp pháp của nút nguồn. | Quyết định (Decision) 'Phê duyệt dự án' sinh ra Văn bản (Document) 'Giấy chứng nhận đầu tư'. |
| 35 | INSTANCE_OF | Quan hệ chỉ định một thực thể cụ thể thuộc về một loại khái niệm pháp lý nhất định. | Công ty TNHH Bách Khoa (Node: Tổ chức) là INSTANCE_OF Doanh nghiệp tư nhân (Node: Khái niệm pháp lý). |
| 36 | SUBCLASS_OF | Quan hệ phân cấp chỉ một khái niệm pháp lý là lớp con của một khái niệm pháp lý bao quát hơn. | Quyền tác giả (Node: Quyền) là SUBCLASS_OF Quyền sở hữu trí tuệ (Node: Nhóm quyền). |
| 37 | RELATED_TO | Quan hệ liên kết chung giữa các thực thể pháp lý có sự tham chiếu hoặc tương tác không thuộc phân cấp hay thành phần. | Người lao động (Node: Chủ thể) RELATED_TO Người sử dụng lao động (Node: Chủ thể) qua hợp đồng. |
| 38 | SAME_AS | Quan hệ chỉ hai thực thể pháp lý là đồng nhất, cùng một chủ thể duy nhất trên phương diện pháp luật. | Node Công ty TNHH X (nguồn) SAME_AS Node Công ty X (đích) theo giấy phép đổi tên |
| 39 | ALIAS_OF | Tên gọi khác được pháp luật hoặc văn bản quy phạm chấp nhận dùng thay thế cho tên gọi chính thức. | Node Bộ Công an (nguồn) ALIAS_OF Node Cơ quan Công an (đích) trong luật tổ chức |
| 40 | SYNONYM_OF | Thuật ngữ pháp lý có nghĩa tương đương và có thể thay thế trong ngữ cảnh quy định cụ thể. | Node Hợp đồng lao động (nguồn) SYNONYM_OF Node Giao kèo thuê mướn (đích) trong văn bản cũ |
| 41 | ABBREVIATION_OF | Dạng viết tắt được định nghĩa trong văn bản pháp luật tương ứng với tên gọi đầy đủ. | Node UBND (nguồn) ABBREVIATION_OF Node Ủy ban nhân dân (đích) theo luật tổ chức |
| 42 | IS_A | Quan hệ chỉ node nguồn thuộc phân loại pháp lý của node đích một cách đúng đắn. | Thẻ căn cước (nguồn) IS_A giấy tờ tùy thân (đích) được pháp luật công nhận. |
| 43 | HAS_ROLE | Quan hệ chỉ node nguồn nắm giữ chức năng hoặc vị thế pháp lý đối với node đích. | Người bảo hộ (nguồn) HAS_ROLE đại diện pháp luật (đích) cho người chưa thành niên. |
| 44 | SUPERVISES | Quan hệ whereby chủ thể quản lý (Source) theo dõi, hướng dẫn và kiểm soát hoạt động của chủ thể thuộc quyền (Target) nhằm đảm bảo tuân thủ pháp luật. | Thanh tra Bộ Tài chính (Organization) SUPERVISES Cục Thuế tỉnh (Organization) trong công tác quản lý thuế. |
| 45 | REFERENCES_ARTICLE | Quan hệ chỉ việc một điều luật tham chiếu đến một điều luật khác trong cùng hoặc khác văn bản pháp luật để làm rõ hoặc bổ sung quy định. | Điều 12 (node nguồn: Article) tham chiếu Điều 5 (node đích: Article) về định nghĩa hành vi vi phạm |
| 46 | REFERENCES_CLAUSE | Quan hệ chỉ việc một khoản trong điều luật tham chiếu đến một khoản khác để quy định điều kiện, ngoại lệ hoặc thủ tục. | Khoản 2 Điều 10 (node nguồn: Clause) tham chiếu Khoản 1 Điều 10 (node đích: Clause) về thời hạn nộp hồ sơ |
| 47 | POINTS_TO | Quan hệ chỉ hướng từ node nguồn đến node đích cụ thể, biểu thị sự tham chiếu trực tiếp hoặc điều hướng trong văn bản luật. | Điều 5 (node Điều luật) POINTS_TO Điều 10 (node Điều luật) để quy định chi tiết về xử phạt. |
| 48 | HAS_REFERENCE_NODE | Quan hệ biểu thị node nguồn chứa hoặc sở hữu một node tham chiếu phụ trợ phục vụ tra cứu hoặc giải thích thuật ngữ. | Khoản 2 (node Khoản) HAS_REFERENCE_NODE Ghi chú 1 (node Ghi chú) giải thích thuật ngữ chuyên môn. |
| 49 | STARTS | Quan hệ chỉ định quy trình hoặc giai đoạn bắt đầu bằng một bước công việc cụ thể, xác định điểm khởi đầu hợp pháp của luồng thực hiện. | Quy trình xét duyệt hồ sơ (Workflow) STARTS Bước tiếp nhận đơn (Task) |
| 50 | ENDS | Quan hệ xác định bước công việc hoặc giai đoạn kết thúc một quy trình, tạo điểm dừng có hiệu lực pháp lý cho luồng thực hiện. | Quy trình thanh lý hợp đồng (Workflow) ENDS Bước ký biên bản bàn giao (Task) |
| 51 | NEXT_STEP | Quan hệ tuần tự chỉ bước công việc tiếp theo phải được thực hiện sau khi bước hiện tại hoàn tất theo trình tự quy định. | Bước thẩm định (Task) NEXT_STEP Bước phê duyệt (Task) |
| 52 | PREVIOUS_STEP | Quan hệ tuần tự chỉ bước công việc liền trước đã hoàn tất trước khi bước hiện tại được bắt đầu theo trình tự quy định. | Bước cấp giấy phép (Task) PREVIOUS_STEP Bước kiểm tra điều kiện (Task) |
| 53 | BELONGS_TO_PROCEDURE | Quan hệ chỉ định một nhiệm vụ hoặc bước công việc trực thuộc một quy trình thủ tục hành chính cụ thể. Thể hiện phân nhóm luồng công việc trong tổng thể quy trình pháp lý. | Bước (Task) 'Tiếp nhận hồ sơ' thuộc về Quy trình (Procedure) 'Cấp giấy phép xây dựng'. |
| 54 | REQUIRES | Quan hệ thể hiện một bước công việc hoặc hồ sơ đòi hỏi sự tồn tại, hoàn thành hoặc cung cấp của một điều kiện, tài liệu khác trước khi tiến hành. Đảm bảo tính tiên quyết trong luồng xử lý hành chính. | Tác vụ (Task) 'Cấp sổ đỏ' yêu cầu Văn bản (Document) 'Đơn xin giao đất'. |
| 55 | VALIDATES | Quan hệ chỉ việc một cơ quan, bước kiểm tra hoặc tác nhân thực hiện xác minh tính hợp lệ, hợp pháp của hồ sơ, thông tin. Là chốt chặn chất lượng trước khi phê duyệt chính thức. | Cơ quan (Authority) 'Sở Tư pháp' kiểm duyệt Văn bản (Document) 'Hợp đồng ủy quyền'. |
| 56 | HAS_STATE | Quan hệ chỉ định rằng một thực thể quy trình sở hữu một trạng thái xác định trong vòng đời của nó theo quy định pháp luật. | Hồ sơ đăng ký kinh doanh (node: BusinessRegistration) HAS_STATE Đang chờ thẩm định (node: State_PendingReview) |
| 57 | TRANSITIONS_TO | Quan hệ biểu thị sự chuyển đổi trạng thái hoặc bước thực hiện từ node nguồn sang node đích theo trình tự quy định pháp lý. | Bước tiếp nhận hồ sơ (node: Step_Receive) TRANSITIONS_TO Bước thẩm định (node: Step_Verify) |
| 58 | AUTHORIZES | Quan hệ whereby cơ quan nhà nước hoặc cấp có thẩm quyền (Source) cấp phép, trao quyền pháp lý cho cá nhân hoặc tổ chức (Target) được thực hiện hành vi nhất định. | Bộ Công an (Organization) AUTHORIZES Công ty TNHH Bảo vệ Minh Anh (Organization) được kinh doanh dịch vụ bảo vệ. |
| 59 | INSPECTS | Quan hệ whereby cơ quan chức năng (Source) tiến hành kiểm tra trực tiếp hiện trạng, hồ sơ, quy trình của đối tượng (Target) theo nhiệm vụ được giao. | Cục An toàn thực phẩm (Organization) INSPECTS Nhà hàng Hương Việt (Organization) về điều kiện vệ sinh. |
| 60 | AUDITS | Quan hệ whereby cơ quan kiểm toán độc lập (Source) xác minh và đánh giá tính trung thực, hợp pháp của báo cáo tài chính hoặc hoạt động của đối tượng (Target). | Kiểm toán Nhà nước (Organization) AUDITS Tập đoàn Điện lực Việt Nam (Organization) cho niên độ 2023. |
| 61 | REGULATES | Quan hệ khi cơ quan nhà nước thiết lập quy định pháp lý chi phối quyền, nghĩa vụ hoặc hoạt động của thực thể khác. | Ngân hàng Nhà nước (Node: Cơ quan Quản lý) REGULATES hoạt động tín dụng của ngân hàng thương mại (Node: Tổ chức Tín dụng). |
| 62 | ENFORCES | Quan hệ khi cơ quan có thẩm quyền thi hành biện pháp cưỡng chế hoặc xử lý vi phạm pháp luật đối với thực thể khác. | Cục Hải quan (Node: Cơ quan Nhà nước) ENFORCES quyết định xử phạt đối với doanh nghiệp xuất nhập khẩu (Node: Doanh nghiệp). |
| 63 | ISSUES | Quan hệ khi cơ quan hoặc tổ chức có thẩm quyền ban hành văn bản, giấy phép, quyết định pháp lý cho thực thể khác. | Bộ Tư pháp (Node: Cơ quan Nhà nước) ISSUES giấy phép hành nghề luật sư cho cá nhân (Node: Cá nhân). |
| 64 | REVOKES | Quan hệ chỉ việc chủ thể có thẩm quyền (node nguồn) thu hồi, hủy bỏ hiệu lực giấy phép, quyết định hoặc quyền hạn đã cấp cho chủ thể khác (node đích). | Bộ Công an (node nguồn: Cơ quan nhà nước) thu hồi Giấy phép kinh doanh (node đích: Giấy phép). |
| 65 | CERTIFIES | Quan hệ chỉ việc cơ quan hoặc tổ chức có thẩm quyền (node nguồn) xác nhận, chứng nhận tính hợp pháp hoặc tiêu chuẩn của đối tượng, hồ sơ, cá nhân (node đích). | Bộ Y tế (node nguồn: Cơ quan nhà nước) chứng nhận Cơ sở đạt chuẩn vệ sinh (node đích: Cơ sở sản xuất). |
| 66 | VIOLATES | Quan hệ chỉ việc một hành vi hoặc chủ thể vi phạm một quy định pháp luật hoặc điều khoản cụ thể. | Cá nhân (nguồn) VIOLATES Điều 8 Luật Giao thông đường bộ (đích) khi đi ngược chiều. |
| 67 | PENALIZED_BY | Quan hệ chỉ việc một chủ thể phải chịu chế tài hoặc hình phạt do một quy định hoặc quyết định pháp lý ấn định. | Người điều khiển xe (nguồn) PENALIZED_BY Quyết định xử phạt số 123/QĐ-XPHC (đích) của cơ quan chức năng. |
| 68 | FINED_BY | Quan hệ chỉ việc một chủ thể bị áp dụng hình phạt tiền theo một quy định hoặc quyết định xử phạt cụ thể. | Chủ xe ô tô (nguồn) FINED_BY Điều 5 Nghị định 100/2019/NĐ-CP (đích) với mức 4 triệu đồng. |
| 69 | SUSPENDED_BY | Quan hệ chỉ định thực thể (giấy phép, quyền) bị tạm đình chỉ hiệu lực bởi cơ quan có thẩm quyền. Thể hiện trạng thái mất hiệu lực tạm thời do vi phạm pháp luật. | Giấy phép kinh doanh (License) SUSPENDED_BY Cục Thuế (TaxAuthority) do trốn thuế. |
| 70 | CONFISCATED_BY | Quan hệ chỉ định tài sản bị tịch thu sung quỹ nhà nước hoặc chuyển giao quyền sở hữu cưỡng chế bởi cơ quan chức năng. Hành động này chuyển quyền chiếm hữu hợp pháp. | Xe ô tô (Vehicle) CONFISCATED_BY Công an (Police) do vi phạm giao thông nghiêm trọng. |
| 71 | BEFORE | Quan hệ thời gian chỉ sự kiện pháp lý nguồn xảy ra trước sự kiện đích. Dùng xác định thứ tự ưu tiên hoặc điều kiện tiên quyết trong thời gian. | Quyết định hành chính (node nguồn) ban hành BEFORE Đơn khiếu nại (node đích) được tiếp nhận. |
| 72 | AFTER | Quan hệ thời gian chỉ sự kiện pháp lý nguồn xảy ra sau sự kiện đích. Thường dùng cho thời hiệu khởi kiện hoặc hiệu lực hồi tố. | Đơn khởi kiện (node nguồn) nộp AFTER Sự kiện vi phạm (node đích) phát sinh. |
| 73 | WITHIN | Quan hệ thời gian buộc một hành vi pháp lý phải thực hiện trong khoảng thời hạn nhất định kể từ thời điểm tham chiếu. Đảm bảo tuân thủ thời hiệu hoặc thời hạn luật định. | (Node: Nộp tờ khai thuế) trong vòng 10 ngày kể từ (Node: Phát sinh nghĩa vụ thuế) |
| 74 | UNTIL | Quan hệ thời gian xác định một trạng thái pháp lý hoặc nghĩa vụ duy trì hiệu lực tới một thời điểm cụ thể. Giới hạn thời hạn tồn tại của quyền hoặc giấy phép. | (Node: Giấy phép xây dựng tạm) có hiệu lực cho tới (Node: Ngày 01/01/2026) |
| 75 | SINCE | Quan hệ chỉ thời điểm một thực thể pháp lý bắt đầu tồn tại hoặc phát sinh trạng thái pháp lý. Thường gắn với ngày thành lập hoặc ngày hiệu lực sớm nhất. | (Thực thể: Công ty ABC) SINCE (Thời điểm: Ngày 15/03/2010) - ngày đăng ký kinh doanh |
| 76 | DURING | Quan hệ thời gian chỉ sự kiện nguồn diễn ra trong khoảng thời gian của sự kiện đích. Thể hiện tính liên tục hoặc phạm vi hiệu lực. | Giấy phép kinh doanh (node nguồn) có hiệu lực DURING Kỳ báo cáo thuế (node đích). |
| 77 | VALID_FROM | Thời điểm văn bản hoặc quy định bắt đầu có hiệu lực pháp luật. Mọi hệ quả pháp lý chỉ phát sinh sau mốc này. | (Văn bản: Nghị định 123) VALID_FROM (Thời điểm: Ngày 01/01/2024) |
| 78 | VALID_TO | Thời điểm văn bản hoặc quyền hạn chấm dứt hiệu lực pháp lý. Sau mốc này thực thể không còn giá trị ràng buộc. | (Hợp đồng: Hợp đồng bảo hiểm) VALID_TO (Thời điểm: Ngày 31/12/2025) |
| 79 | EFFECTIVE_FROM | Quan hệ chỉ thời điểm văn bản hoặc quy định bắt đầu có hiệu lực pháp lý. Node nguồn là văn bản/điều luật, node đích là mốc thời gian cụ thể. | Luật Đất đai 2024 (Văn bản luật) có hiệu lực từ ngày 01/01/2025 (Ngày hiệu lực). |
| 80 | EXPIRES_ON | Quan hệ chỉ thời điểm văn bản hoặc quy định chấm dứt hiệu lực pháp lý. Node nguồn là văn bản/điều luật, node đích là mốc thời gian cụ thể. | Nghị định 12/2020 (Văn bản luật) hết hiệu lực vào ngày 30/06/2023 (Ngày hết hiệu lực). |
| 81 | HAS_AMOUNT | Quan hệ chỉ số tiền, số lượng vật chất hoặc định mức được quy định gắn với thực thể pháp lý. | Điều 23: Mức phạt tối thiểu 5.000.000 VND (QUY_DINH_PHAT -> HAS_AMOUNT -> SO_TIEN) |
| 82 | HAS_RATE | Quan hệ xác định tỷ lệ phần trăm hoặc hệ số áp dụng cho một nghĩa vụ hoặc đối tượng theo quy định pháp luật. | [Hợp đồng tín dụng] HAS_RATE [Lãi suất 12%/năm] - lãi suất vay không quá 12% mỗi năm. |
| 83 | HAS_LIMIT | Quan hệ quy định giới hạn tối đa hoặc tối thiểu được phép của một quyền, nghĩa vụ hoặc hoạt động. | [Giấy phép môi trường] HAS_LIMIT [Lưu lượng 1000 m3/ngày] - xả thải tối đa 1000 mét khối mỗi ngày. |
| 84 | HAS_THRESHOLD | Quan hệ chỉ ngưỡng giới hạn số lượng hoặc giá trị mà tại đó hệ quả pháp lý phát sinh. | Doanh thu trên 1 tỷ phải nộp thuế (NGUONG -> HAS_THRESHOLD -> GIA_TRI) |
| 85 | HAS_AREA | Quan hệ biểu thị diện tích đất hoặc tài sản bất động sản được đề cập trong văn bản pháp luật hoặc giao dịch. | Thửa đất số 123 (Node: LandPlot) HAS_AREA 500 mét vuông (Node: Area) |
| 86 | HAS_PERCENTAGE | Quan hệ biểu thị tỷ lệ phần trăm của giá trị được áp dụng trong quy định pháp luật. | Điều 5: Thuế suất 10% trên doanh thu (QUY_DINH_THUE -> HAS_PERCENTAGE -> TY_LE) |
| 87 | DEFINES | Quan hệ ngữ nghĩa chỉ việc văn bản quy phạm định nghĩa khái niệm pháp lý, từ node VănBảnQuyPhạm đến node ThuậtNgữPhápLý. | Bộ luật Dân sự 2015 định nghĩa 'Hợp đồng' tại Điều 385 (VănBảnQuyPhạm → ThuậtNgữPhápLý) |
| 88 | HAS_TERM | Quan hệ giữa một điều luật và thuật ngữ chuyên môn được giải thích ý nghĩa trong phạm vi điều đó. Node nguồn là điều/khoản, node đích là thuật ngữ pháp lý. | Điều 4 Luật Đất đai 2013 (Article) HAS_TERM Giấy chứng nhận quyền sử dụng đất (Term) |
| 89 | HAS_BODY | Quan hệ liên kết một điều luật với nội dung quy định cụ thể chứa các quy phạm. Node nguồn là điều luật, node đích là khối văn bản quy định. | Điều 3 Luật Hôn nhân (Article) HAS_BODY Quy định về kết hôn (BodyText) |
| 90 | TRIGGERS | Quan hệ chỉ hành vi hoặc sự kiện này làm phát sinh hoặc kích hoạt một sự kiện pháp lý khác. | Hành vi vượt đèn đỏ (Node: Hành vi) TRIGGERS lập biên bản vi phạm (Node: Sự kiện hành chính). |
| 91 | CAUSES | Quan hệ chỉ sự kiện pháp lý này là nguyên nhân trực tiếp dẫn đến hậu quả hoặc nghĩa vụ pháp lý khác. | Tai nạn do lỗi kỹ thuật (Node: Sự kiện) CAUSES nghĩa vụ bồi thường thiệt hại (Node: Nghĩa vụ pháp lý). |
| 92 | PRECEDES | Quan hệ chỉ sự kiện nguồn xảy ra trước sự kiện đích trong trình tự thời gian pháp lý. Xác định điều kiện tiên quyết hoặc thứ tự ưu tiên giữa các sự kiện. | Sự kiện nguồn (Event) [Ký hợp đồng] PRECEDES sự kiện đích (Event) [Bàn giao hàng hóa]. |
| 93 | FOLLOWS | Quan hệ chỉ sự kiện nguồn xảy ra sau sự kiện đích trong trình tự thời gian pháp lý. Xác định hệ quả hoặc nghĩa vụ phát sinh sau một sự kiện khác. | Sự kiện nguồn (Event) [Khởi kiện] FOLLOWS sự kiện đích (Event) [Vi phạm hợp đồng]. |
| 94 | LOCATED_IN | Quan hệ chỉ thực thể pháp lý hoặc vật lý tồn tại trong một đơn vị hành chính hoặc địa điểm cụ thể. Dùng xác định nơi cư trú, đặt trụ sở hoặc vị trí tài sản theo pháp luật. | Công ty TNHH X (Node: Organization) located_in TP. Hồ Chí Minh (Node: AdministrativeArea) |
| 95 | HAS_JURISDICTION | Quan hệ chỉ cơ quan nhà nước hoặc tòa án có thẩm quyền xét xử hoặc quản lý trên một vùng lãnh thổ hoặc đối tượng. | Tòa án Tối cao (Cơ quan tư pháp) has_jurisdiction Lãnh thổ Quốc gia (Quốc gia) |
| 96 | UNDER_AUTHORITY_OF | Quan hệ thể hiện tổ chức hoặc cá nhân chịu sự quản lý, giám sát trực tiếp từ cơ quan cấp trên theo pháp luật. | Chi cục Thuế Quận (Cơ quan cấp dưới) under_authority_of Cục Thuế Tỉnh (Cơ quan cấp trên) |
| 97 | APPLIES_IN_REGION | Quan hệ chỉ quy định pháp luật hoặc chính sách có hiệu lực thi hành trên một khu vực địa lý xác định. | Luật Đất đai 2024 (Văn bản luật) applies_in_region Việt Nam (Quốc gia) |
| 98 | BELONGS_TO_INDUSTRY | Quan hệ phân loại thực thể kinh tế thuộc về một ngành công nghiệp cụ thể. Node nguồn được xác định là thành phần của ngành tại node đích theo quy định pháp lý. | Công ty TNHH XYZ (Company) thuộc lĩnh vực viễn thông (Industry) theo Giấy chứng nhận đăng ký doanh nghiệp. |
| 99 | REGULATES_INDUSTRY | Quan hệ thể hiện cơ quan có thẩm quyền hoặc văn bản luật thiết lập quy tắc quản lý đối với một ngành công nghiệp. Node nguồn thực thi chức năng kiểm soát node đích. | Ủy ban Chứng khoán Nhà nước (Regulator) quản lý ngành chứng khoán (Industry) theo Luật Chứng khoán 2019. |
| 100 | COMPLIES_WITH | Quan hệ chỉ định thực thể phải tuân thủ quy định pháp lý hoặc tiêu chuẩn bắt buộc theo luật định. | Doanh nghiệp viễn thông (nguồn) COMPLIES_WITH Nghị định 49/2017/NĐ-CP (đích). |
| 101 | NON_COMPLIANT_WITH | Quan hệ chỉ việc chủ thể không tuân thủ hoặc vi phạm quy định, tiêu chuẩn pháp lý bắt buộc. Node nguồn là bên vi phạm, node đích là quy định bị vi phạm. | Xí nghiệp sản xuất (Facility) không tuân thủ Luật Bảo vệ Môi trường 2020 (Law) về xả thải. |
| 102 | SATISFIES | Quan hệ chỉ việc tài liệu, sản phẩm hoặc hành động thỏa mãn điều kiện, yêu cầu hoặc tiêu chí pháp lý đặt ra. Node nguồn là đối tượng đánh giá, node đích là yêu cầu cần thỏa mãn. | Hồ sơ đấu thầu (BidDocument) thỏa mãn Yêu cầu về năng lực kỹ thuật (Requirement) trong hồ sơ mời thầu. |
| 103 | FAILS | Quan hệ chỉ việc thực thể, hồ sơ hoặc kết quả kiểm tra không đạt hoặc thất bại trong việc đáp ứng tiêu chuẩn, bài kiểm định pháp lý. Node nguồn là đối tượng kiểm tra, node đích là tiêu chuẩn hoặc bài kiểm tra. | Lô hàng nhập khẩu (ProductBatch) không đạt Kiểm định chất lượng (Certification) của cơ quan hải quan. |
| 104 | CREATED_BY | Quan hệ chỉ thực thể đã khởi tạo hoặc ban hành một đối tượng pháp lý. Thể hiện nguồn gốc và thẩm quyền tạo lập. | (Văn bản luật) CREATED_BY (Quốc hội) |
| 105 | RESULTS_IN | Quyết định tạo ra hệ quả pháp lý hoặc trạng thái mới. Thể hiện mối quan hệ nhân quả giữa một quyết định và kết quả của nó. | Quyết định hành chính (nguồn) RESULTS_IN Giấy phép kinh doanh (đích) |
| 106 | BASED_ON | Quyết định được xây dựng dựa trên căn cứ pháp lý hoặc sự kiện đã có. Thể hiện nguồn gốc pháp lý của quyết định. | Quyết định xử phạt (nguồn) BASED_ON Biên bản vi phạm (đích) |
| 107 | DENIES | Quyết định từ chối hoặc bác bỏ một yêu cầu, quyền lợi hoặc đề xuất. Thể hiện sự phủ nhận bằng văn bản có thẩm quyền. | Quyết định giải quyết khiếu nại (nguồn) DENIES Yêu cầu bồi thường (đích) |
| 108 | ANNULS | Quyết định hủy bỏ hiệu lực của một văn bản hoặc quyết định khác. Thể hiện tính vô hiệu hóa về mặt pháp lý. | Quyết định của cấp trên (nguồn) ANNULS Quyết định cấp dưới (đích) |
| 109 | UPHOLDS | Quan hệ thể hiện việc một quyết định pháp lý xác nhận, giữ nguyên hoặc bảo vệ hiệu lực của một quyết định, phán quyết hoặc quy định khác. Node nguồn là Decision cấp trên hoặc sau, node đích là Decision hoặc Regulation được duy trì. | Tòa án phúc thẩm (Decision) giữ nguyên bản án sơ thẩm (Decision) vì không phát hiện sai sót thủ tục. |

