# Legal Knowledge Graph — Ontology v2.0 (large)

Chuẩn trích xuất đồ thị tri thức pháp luật Việt Nam (Norm-centric). Sinh tự động từ `legal-analysis-template.large.json` và ví dụ thực tế từ 10 luật 2025-2026.

## Entity

| STT | Thực thể | Mô tả | Ví dụ |
|-----|--------|--------|--------|
| 1 | LegalDocument | Văn bản do cơ quan có thẩm quyền ban hành hoặc cá nhân lập để ghi nhận sự kiện pháp lý. Làm phát sinh, thay đổi hoặc chấm dứt quyền nghĩa vụ. | Giấy chứng nhận quyền sử dụng đất |
| 2 | Law | Văn bản quy phạm pháp luật do cơ quan nhà nước có thẩm quyền ban hành, quy định quy tắc xử sự bắt buộc chung và có hiệu lực pháp lý cao nhất trong hệ thống. | Luật Doanh nghiệp 2020 |
| 3 | Code | Bộ luật là văn bản quy phạm pháp luật do Quốc hội ban hành dưới dạng tổng hợp quy định toàn diện một lĩnh vực pháp luật. | Bộ luật Dân sự 2015 |
| 4 | Resolution | Nghị quyết là văn bản do cơ quan nhà nước có thẩm quyền ban hành để quyết định các vấn đề chính sách hoặc quy phạm pháp luật. | Nghị quyết số 43/2022/QH15 về chính sách tài khóa tiền tệ |
| 5 | Ordinance | Pháp lệnh là văn bản quy phạm pháp luật do Ủy ban Thường vụ Quốc hội ban hành để quy định chi tiết luật hoặc lĩnh vực được giao. | Pháp lệnh Thủ tục bắt giữ tàu biển |
| 6 | Decree | Văn bản quy phạm pháp luật do Chính phủ ban hành để quy định chi tiết thi hành luật, nghị quyết của Quốc hội. | Nghị định 01/2021/NĐ-CP về đăng ký doanh nghiệp |
| 7 | Circular | Văn bản quy phạm pháp luật do bộ hoặc cơ quan ngang bộ phát hành để hướng dẫn thi hành luật, nghị định và quy định thủ tục cụ thể. | Thông tư 80/2021/TT-BTC về thuế |
| 8 | Decision | Kết quả cuối cùng của thủ tục do cơ quan có thẩm quyền ban hành dưới dạng văn bản hoặc hành động pháp lý xác nhận. | Cấp giấy phép xây dựng |
| 9 | Guideline | Văn bản hướng dẫn nghiệp vụ hoặc áp dụng pháp luật do cơ quan chuyên môn phát hành, không phải văn bản quy phạm. | Hướng dẫn số 01/HD-TANDTC về áp dụng án lệ |
| 10 | OfficialLetter | Văn bản hành chính dùng để truyền đạt ý kiến chỉ đạo, hướng dẫn hoặc trả lời của cơ quan nhà nước. | Công văn 456/BTC-TCT trả lời vướng mắc về thuế |
| 11 | Appendix | Phần bổ sung kèm theo văn bản pháp luật hoặc hợp đồng để làm rõ hoặc bổ sung chi tiết nội dung chính. | Phụ lục 01 về danh mục hàng hóa cấm xuất khẩu |
| 12 | Attachment | Tài liệu đi kèm văn bản chính nhằm cung cấp thông tin tham khảo hoặc chứng minh nội dung được nêu. | Bản sao công chứng giấy tờ tùy thân đính kèm đơn |
| 13 | Template | Mẫu văn bản được thiết lập sẵn cấu trúc và định dạng để tạo ra các giấy tờ pháp lý thống nhất. | Mẫu hợp đồng mua bán tài sản theo Thông tư 01/2020 |
| 14 | Form | Biểu mẫu có sẵn các trường thông tin cần khai báo để cá nhân hoặc tổ chức cung cấp dữ liệu pháp lý. | Tờ khai đăng ký doanh nghiệp |
| 15 | DraftLaw | Dự thảo văn bản quy phạm pháp luật đang trong quá trình soạn thảo và chưa được cơ quan có thẩm quyền thông qua. | Dự thảo Luật Đất đai sửa đổi năm 2024 |
| 16 | Constitution | Văn bản quy phạm pháp luật cơ bản có hiệu lực pháp lý cao nhất, quy định chế độ chính trị, quyền con người, quyền công dân. Chỉ Quốc hội mới có thẩm quyền ban hành và sửa đổi. | Hiến pháp năm 2013 |
| 17 | Treaty | Thỏa thuận quốc tế được ký kết giữa các quốc gia hoặc chủ thể luật quốc tế, tạo ràng buộc pháp lý theo luật quốc tế. | Hiệp ước Paris 2015 về biến đổi khí hậu |
| 18 | Convention | Điều ước quốc tế đa phương do tổ chức quốc tế soạn thảo, thiết lập chuẩn mực pháp lý chung cho nhiều quốc gia thành viên. | Công ước Vienna về luật điều ước 1969 |
| 19 | Agreement | Thỏa thuận pháp lý giữa hai hoặc nhiều bên về quyền và nghĩa vụ cụ thể, có thể ở cấp song phương, đa phương hoặc thương mại. | Hiệp định thương mại tự do Việt Nam-EU (EVFTA) |
| 20 | TechnicalStandard | Văn bản quy chuẩn kỹ thuật do cơ quan có thẩm quyền ban hành, quy định yêu cầu kỹ thuật bắt buộc hoặc tự nguyện để đảm bảo an toàn và tương thích. | TCVN ISO 9001:2015 về hệ thống quản lý chất lượng |
| 21 | NationalStandard | Văn bản quy chuẩn kỹ thuật do cơ quan nhà nước có thẩm quyền ban hành quy định mức giới hạn của đặc tính kỹ thuật nhằm đảm bảo an toàn và chất lượng. | Quy chuẩn kỹ thuật quốc gia về an toàn cháy cho nhà cao tầng |
| 22 | LocalRegulation | Văn bản quy phạm pháp luật do Hội đồng nhân dân hoặc Ủy ban nhân dân cấp tỉnh ban hành để quy định chi tiết luật tại địa phương. | Nghị quyết của HĐND TP Hà Nội về thu phí bảo vệ môi trường |
| 23 | Judgment | Bản án hoặc quyết định của Tòa án đã có hiệu lực hoặc chưa có hiệu lực giải quyết vụ việc cụ thể giữa các đương sự. | Bản án hình sự sơ thẩm vụ án tham ô tài sản |
| 24 | CaseLaw | Các phán quyết của Tòa án được chọn làm tiền lệ áp dụng thống nhất trong xét xử theo quy định của Hội đồng Thẩm phán TAND tối cao. | Án lệ số 01/2016/AL về hợp đồng tín dụng |
| 25 | InterpretationDoc | Văn bản giải thích luật, pháp lệnh do cơ quan có thẩm quyền ban hành để làm rõ nội dung điều luật khi áp dụng. | Nghị quyết giải thích Hiến pháp của Ủy ban Thường vụ Quốc hội |
| 26 | LegalOpinion | Văn bản tư vấn pháp lý do luật sư hoặc tổ chức hành nghề luật sư ban hành, nêu quan điểm pháp lý về một vấn đề cụ thể. Không phải văn bản quy phạm pháp luật, chỉ có giá trị tham khảo. | Công văn tư vấn hợp đồng chuyển nhượng quyền sử dụng đất |
| 27 | QnA | Văn bản ghi nhận câu hỏi pháp lý từ cá nhân/tổ chức và câu trả lời từ cơ quan nhà nước hoặc chuyên gia. Giúp làm rõ cách áp dụng pháp luật vào tình huống cụ thể. | Công dân hỏi thủ tục cấp hộ chiếu, Cục Xuất nhập cảnh trả lời |
| 28 | FAQ | Tài liệu tổng hợp các câu hỏi phổ biến và câu trả lời ngắn gọn về thủ tục hoặc quy định pháp lý. Nhằm hướng dẫn người dân tiếp cận thông tin pháp luật nhanh chóng. | Câu hỏi thường gặp về đăng ký kết hôn với người nước ngoài |
| 29 | Part | Đơn vị cấu trúc lớn nhất trong văn bản quy phạm pháp luật, tập hợp các chương có nội dung liên quan cùng chủ đề lớn. | Phần thứ nhất Bộ luật Hình sự về những quy định chung |
| 30 | Chapter | Đơn vị chia nhỏ Part hoặc văn bản độc lập, gồm các điều hoặc mục có chủ đề thống nhất. | Chương I Bộ luật Dân sự về quyền sở hữu |
| 31 | Section | Đơn vị chia nhỏ Chapter để nhóm các điều cùng phạm vi chi tiết trong một chủ đề nhỏ. | Mục 1 Chương XIV Bộ luật Tố tụng Dân sự về thủ tục sơ thẩm |
| 32 | Subsection | Đơn vị chia nhỏ Section nhằm chi tiết hóa nội dung chuyên sâu hơn trong cùng một mục. | Tiểu mục 1 Mục 1 về chủ thể hợp đồng |
| 33 | Article | Đơn vị cơ bản chứa quy phạm pháp luật cụ thể, được đánh số thứ tự riêng trong văn bản. | Điều 1 Bộ luật Dân sự về phạm vi điều chỉnh |
| 34 | Clause | Phần của hợp đồng hoặc văn bản pháp lý quy định cụ thể quyền, nghĩa vụ hoặc điều kiện giữa các bên. | Điều khoản bảo mật thông tin |
| 35 | Point | Mục được đánh dấu chữ cái hoặc số nhỏ trong khoản dùng để liệt kê nội dung chi tiết. | Điểm a khoản 1 Điều 4 |
| 36 | Paragraph | Đoạn văn bản được đánh số thứ tự trong một điều luật hoặc điều khoản hợp đồng. | Khoản 2 Điều 10 Luật Doanh nghiệp |
| 37 | Sentence | Đơn vị ngôn ngữ hoàn chỉnh trong văn bản pháp lý thể hiện một ý nghĩa hoặc quy định độc lập. | Bên thuê phải trả tiền trước ngày 5 hàng tháng. |
| 38 | Illustration | Hình ảnh, biểu đồ hoặc sơ đồ kèm theo văn bản để làm rõ nội dung quy định. | Sơ đồ cơ cấu tổ chức trong điều lệ |
| 39 | Example | Minh họa cụ thể hóa quy định pháp luật để làm rõ cách áp dụng thực tế. | Hợp đồng mua bán nhà phải công chứng. |
| 40 | Footnote | Chú thích cuối trang cung cấp thông tin tham chiếu hoặc giải thích thuật ngữ. | Chú thích 1: Căn cứ Luật Đất đai 2013. |
| 41 | Title | Tên gọi chính thức của văn bản hoặc đề mục phần chương trong văn bản pháp lý. | Luật Doanh nghiệp 2020 |
| 42 | Preface | Phần mở đầu nêu lý do ban hành và mục đích của văn bản pháp luật. | Lời nói đầu: Nhằm bảo vệ người tiêu dùng. |
| 43 | Scope | Xác định đối tượng và lĩnh vực văn bản pháp luật điều chỉnh. | Áp dụng với tổ chức, cá nhân tại Việt Nam. |
| 44 | Purpose | Mục đích của văn bản pháp luật hoặc điều khoản, xác định lý do và mục tiêu ban hành. | Ngăn chặn hành vi gian lận thuế |
| 45 | Principle | Nguyên tắc pháp lý cơ bản chi phối cách giải thích và áp dụng quy định. | Nguyên tắc suy đoán vô tội |
| 46 | DefinitionSection | Phần quy định giải nghĩa các thuật ngữ dùng trong văn bản để đảm bảo thống nhất hiểu biết. | Điều 3 Luật Doanh nghiệp định nghĩa 'doanh nghiệp' |
| 47 | Table | Bảng biểu trình bày dữ liệu pháp lý như mức thuế, biểu thuế hoặc danh mục kèm theo văn bản. | Biểu thuế xuất nhập khẩu ưu đãi |
| 48 | Formula | Công thức tính toán quy định cách xác định một giá trị pháp lý hoặc tài chính cụ thể. | Thuế TNDN = Thu nhập chịu thuế × 20% |
| 49 | Note | Ghi chú ngắn ghi lại thông tin cần nhớ hoặc chi tiết phụ trợ. Dùng để lưu ý cá nhân hoặc chú thích nhanh. | Ghi chú cuộc họp sáng nay |
| 50 | Norm | Quy tắc xử sự bắt buộc chung do nhà nước ban hành và bảo đảm thực hiện, điều chỉnh các quan hệ xã hội. | Bộ luật Dân sự quy định về giao kết hợp đồng |
| 51 | Obligation | Nghĩa vụ pháp lý buộc chủ thể phải thực hiện hoặc không thực hiện một hành vi nhất định. Được bảo đảm bằng cưỡng chế nhà nước. | Nghĩa vụ nộp thuế |
| 52 | Permission | Sự công nhận của pháp luật cho chủ thể tự do lựa chọn hành động trong phạm vi không bị cấm. | Được phép đăng ký hộ kinh doanh cá thể |
| 53 | Right | Khả năng pháp lý được làm hoặc đòi hỏi người khác làm hành vi nhất định, được nhà nước bảo vệ. | Quyền sở hữu đối với bất động sản |
| 54 | Prohibition | Sự nghiêm cấm bằng pháp luật đối với hành vi cụ thể, vi phạm sẽ bị xử lý chế tài. | Cấm vận chuyển hàng lậu |
| 55 | Recommendation | Đề xuất pháp lý không mang tính bắt buộc, do cơ quan có thẩm quyền hoặc bên liên quan đưa ra để hướng dẫn hành vi. | Khuyến nghị của Ngân hàng Nhà nước về lãi suất cho vay |
| 56 | Authorization | Văn bản hoặc quyết định hợp pháp cho phép chủ thể thực hiện một hành vi nhất định trong phạm vi luật định. | Giấy phép xây dựng do UBND cấp |
| 57 | Delegation | Hành vi ủy quyền cho bên thứ ba thực hiện một hoặc nhiều quyền pháp lý thay mặt bên ủy quyền theo văn bản hợp lệ. | Giấy ủy quyền bán nhà |
| 58 | Exception | Quy định loại trừ việc áp dụng nguyên tắc pháp lý chung đối với một trường hợp cụ thể được xác định rõ. | Miễn trừ trách nhiệm hình sự cho ngoại giao đoàn |
| 59 | Condition | Sự kiện hoặc yêu cầu pháp lý phải xảy ra hoặc được thỏa mãn để làm phát sinh, thay đổi hoặc chấm dứt hiệu lực của quan hệ pháp luật. | Điều kiện tiên quyết để hợp đồng có hiệu lực |
| 60 | Precondition | Điều kiện phải được thỏa mãn trước khi một quyền được thực hiện hoặc nghĩa vụ pháp lý phát sinh theo quy định pháp luật hoặc hợp đồng. | Giấy phép hành nghề phải có trước khi bác sĩ thực hiện phẫu thuật |
| 61 | Postcondition | Trạng thái pháp lý hoặc thực tế buộc phải tồn tại sau khi một hành vi pháp lý hoặc thủ tục hoàn tất. | Quyền sở hữu tài sản sang tên bên mua sau khi đăng ký tại cơ quan thẩm quyền |
| 62 | Eligibility | Tiêu chuẩn chủ thể cần thỏa mãn để được hưởng quyền hoặc tham gia quan hệ pháp luật. | Công dân đủ 18 tuổi mới được bầu cử |
| 63 | Validity | Khoảng thời gian hoặc phạm vi mà văn bản pháp luật hoặc giao dịch được công nhận ràng buộc. | Hợp đồng có hiệu lực trong 2 năm |
| 64 | Termination | Hành vi chấm dứt hiệu lực của hợp đồng hoặc quan hệ pháp lý hiện hữu theo thỏa thuận hoặc quyết định cơ quan có thẩm quyền. | Đơn phương hủy hợp đồng thuê |
| 65 | Responsibility | Nghĩa vụ pháp lý buộc chủ thể phải thực hiện hoặc không thực hiện một hành vi nhất định. Vi phạm có thể dẫn đến chế tài từ cơ quan nhà nước. | Công ty phải nộp thuế thu nhập doanh nghiệp đúng hạn. |
| 66 | Liability | Nghĩa vụ tài sản hoặc trách nhiệm bồi thường thiệt hại được pháp luật xác định khi chủ thể gây thiệt hại hoặc vi phạm hợp đồng. Thường biểu hiện bằng số tiền phải trả. | Bồi thường 500 triệu đồng do làm hư hại tài sản người khác. |
| 67 | CalculationRule | Quy định xác định cách thức, công thức hoặc căn cứ để tính ra một giá trị pháp lý như thuế, phạt, thời hạn. Giúp bảo đảm tính thống nhất khi áp dụng. | Thuế VAT = giá chưa thuế × 10%. |
| 68 | PriorityRule | Quy tắc xác định thứ tự áp dụng văn bản hoặc quyền khi có nhiều chủ thể cùng đối tượng. Bảo đảm sự nhất quán trong thi hành. | Luật cao hơn nghị định khi cùng quy định một vấn đề. |
| 69 | ConflictRule | Quy định giải quyết mâu thuẫn giữa các điều khoản hoặc văn bản pháp luật khác nhau trong cùng một tình huống. Ngăn chặn áp dụng sai quy định. | Điều khoản hợp đồng quốc tế thắng quy định nội địa nếu có cam kết WTO. |
| 70 | InterpretationRule | Quy tắc pháp lý dùng để xác định ý nghĩa, phạm vi áp dụng của thuật ngữ hoặc điều khoản trong văn bản quy phạm pháp luật. | Điều 3 Luật Giao thông đường bộ giải thích 'xe cơ giới' bao gồm cả xe máy điện |
| 71 | ReferenceRule | Quy định dẫn chiếu việc áp dụng văn bản pháp luật khác hoặc điều khoản khác để bổ sung điều chỉnh quan hệ pháp luật. | Điều 12 Nghị định này viện dẫn áp dụng Điều 30 Luật Đất đai về cấp sổ đỏ |
| 72 | TransitionRule | Quy tắc xác định hiệu lực pháp lý của văn bản mới đối với tình tiết, quan hệ pháp luật phát sinh trước thời điểm luật mới có hiệu lực. | Luật mới quy định hợp đồng thuê đất ký trước 2020 tiếp tục thực hiện đến hết hạn |
| 73 | Rule |  |  |
| 74 | Sanction |  |  |
| 75 | NaturalPerson | Cá nhân con người có năng lực pháp luật và năng lực hành vi theo quy định pháp luật. Là chủ thể nguyên thủy của mọi quan hệ pháp luật. | Lê Văn C |
| 76 | LegalEntity | Pháp nhân là tổ chức được thành lập hợp pháp, có tư cách pháp nhân, có tài sản độc lập và tự chịu trách nhiệm bằng tài sản đó. | Công ty TNHH Minh Anh |
| 77 | GovernmentAgency | Cơ quan nhà nước là tổ chức thuộc bộ máy nhà nước, được giao thực hiện quyền lực nhà nước hoặc quản lý hành chính công. | Bộ Tài chính |
| 78 | Authority | Cơ quan có thẩm quyền là tổ chức hoặc người được pháp luật giao quyền ra quyết định hành chính hoặc thực thi công vụ bắt buộc. | Cục Thuế TP.HCM |
| 79 | Organization | Tổ chức là tập hợp người hoặc tài sản có mục đích hoạt động nhất định, có thể chưa có tư cách pháp nhân. | Chi hội Chữ thập đỏ phường |
| 80 | Association | Tổ chức được thành lập hợp pháp bởi cá nhân hoặc tổ chức cùng chung mục đích, hoạt động không vì lợi nhuận theo quy định pháp luật. | Hội Luật gia Việt Nam |
| 81 | Enterprise | Tổ chức kinh tế có tên riêng, có tài sản, có trụ sở giao dịch, được thành lập để thực hiện các hoạt động kinh doanh thu lợi nhuận. | Công ty Cổ phần FPT |
| 82 | Household | Nhóm người cùng chung sống và có tài sản chung trong một gia đình theo quy định của pháp luật dân sự và hộ kinh doanh. | Hộ kinh doanh cá thể tại chợ |
| 83 | Representative | Cá nhân hoặc tổ chức được pháp luật hoặc chủ thể khác ủy quyền để thay mặt thực hiện giao dịch trong phạm vi quyền hạn. | Giám đốc công ty ký hợp đồng |
| 84 | Guardian | Cá nhân hoặc tổ chức được cơ quan nhà nước có thẩm quyền chỉ định để chăm sóc và bảo vệ quyền lợi cho người chưa thành niên hoặc mất năng lực hành vi dân sự. | Cha mẹ đối với con chưa thành niên |
| 85 | Employee | Người lao động làm việc cho người sử dụng lao động theo hợp đồng lao động, được trả lương và chịu sự quản lý, điều hành của họ. | Công nhân ký hợp đồng tại nhà máy |
| 86 | Employer | Cá nhân, hộ gia đình, tổ chức hoặc cơ quan thuê mướn người lao động theo hợp đồng lao động và trả lương cho công việc đó. | Công ty TNHH thuê nhân viên kỹ thuật |
| 87 | Taxpayer | Tổ chức, hộ gia đình, cá nhân có nghĩa vụ nộp thuế theo quy định pháp luật đối với thu nhập, tài sản hoặc hoạt động chịu thuế. | Cá nhân có thu nhập từ lương trên mức giảm trừ gia cảnh |
| 88 | Citizen | Cá nhân mang quốc tịch của một quốc gia, được nhà nước đó bảo hộ và có đầy đủ quyền, nghĩa vụ công dân theo Hiến pháp. | Người sinh ra tại Việt Nam có cha mẹ là công dân Việt Nam |
| 89 | Foreigner | Cá nhân là công dân nước ngoài hoặc người không quốc tịch đang cư trú, làm việc trên lãnh thổ một quốc gia không phải nước gốc. | Chuyên gia Nhật Bản sang làm việc tại Việt Nam |
| 90 | Competence |  | Bộ trưởng Bộ Xây dựng: quy định tỷ lệ |
| 91 | Property | Vật hoặc quyền tài sản thuộc sở hữu hợp pháp của cá nhân, tổ chức, bao gồm động sản và bất động sản. | Xe máy cá nhân |
| 92 | Land | Bề mặt trái đất được Nhà nước giao quyền sử dụng hoặc công nhận, là bất động sản đặc biệt theo Luật Đất đai. | Thửa đất thổ cư |
| 93 | Money | Phương tiện thanh toán hợp pháp do Nhà nước phát hành hoặc công nhận để đo lường giá trị hàng hóa. | Tiền Việt Nam đồng |
| 94 | Asset | Tài sản có giá trị kinh tế thuộc quyền sở hữu của chủ thể, có khả năng sinh lợi hoặc sử dụng. | Cổ phiếu doanh nghiệp |
| 95 | Tax | Khoản thu bắt buộc nộp ngân sách nhà nước theo luật định, không hoàn trả trực tiếp cho người nộp. | Thuế thu nhập cá nhân |
| 96 | Vehicle | Phương tiện giao thông cơ giới hoặc thô sơ dùng để chuyên chở người, hàng hóa trên đường bộ, đường thủy hoặc đường hàng không theo quy định pháp luật. | Ô tô cá nhân |
| 97 | Building | Công trình xây dựng có mái, tường, cột và nền được thiết kế để con người ở hoặc hoạt động, được cấp phép xây dựng theo luật định. | Nhà ở riêng lẻ |
| 98 | License | Văn bản do cơ quan nhà nước có thẩm quyền cấp, cho phép cá nhân hoặc tổ chức được thực hiện hoạt động hoặc sử dụng tài sản theo quy định pháp luật. | Giấy phép kinh doanh |
| 99 | Certificate | Văn bản xác nhận cá nhân đã đạt trình độ, kỹ năng hoặc điều kiện pháp lý nhất định do cơ quan có thẩm quyền cấp. | Chứng chỉ hành nghề luật sư |
| 100 | Permit | Giấy phép cụ thể cho phép thực hiện một hành vi hoặc sự kiện nhất định trong thời hạn và điều kiện giới hạn. | Giấy phép mang súng |
| 101 | Evidence | Chứng cứ là tài liệu, vật chứng hoặc dữ liệu được thu thập hợp pháp nhằm chứng minh sự thật trong vụ việc pháp lý. | Biên bản khám nghiệm hiện trường |
| 102 | Invoice | Hóa đơn là chứng từ do người bán hàng hóa, cung cấp dịch vụ lập để ghi nhận nghĩa vụ thanh toán và kê khai thuế theo pháp luật. | Hóa đơn điện tử VAT mua thiết bị văn phòng |
| 103 | Contract | Hợp đồng là thỏa thuận giữa các bên về việc xác lập, thay đổi hoặc chấm dứt quyền, nghĩa vụ dân sự theo quy định pháp luật. | Hợp đồng mua bán căn hộ chung cư |
| 104 | Application | Đơn là văn bản hoặc bản điện tử cá nhân, tổ chức gửi cơ quan nhà nước để yêu cầu giải quyết thủ tục hành chính hoặc cấp phép. | Đơn xin cấp giấy phép xây dựng |
| 105 | DigitalDocument | Tài liệu điện tử là thông điệp dữ liệu được tạo, lưu trữ trên môi trường điện tử và có giá trị pháp lý như văn bản giấy khi đáp ứng quy định xác thực. | Quyết định hành chính ký số |
| 106 | PersonalData | Theo Nghị định 13/2023/NĐ-CP, là dữ liệu về thông tin định danh hoặc thông tin nhận dạng từ đó xác định được một cá nhân cụ thể. Việc xử lý phải có sự đồng ý của chủ thể dữ liệu trừ trường hợp luật quy định khác. | Họ tên đầy đủ |
| 107 | SensitiveData | Là dữ liệu cá nhân gắn với bí mật đời tư mà nếu bị xâm phạm sẽ ảnh hưởng trực tiếp đến quyền và lợi ích hợp pháp của cá nhân theo quy định pháp luật bảo vệ dữ liệu. Cần sự đồng ý rõ ràng bằng văn bản để xử lý. | Thông tin về tôn giáo hoặc tín ngưỡng |
| 108 | PublicData | Là thông tin được cơ quan nhà nước công khai theo luật hoặc chủ thể dữ liệu đồng ý phát tán rộng rãi không hạn chế quyền tiếp cận. Việc thu thập và sử dụng không vi phạm bí mật riêng tư. | Thông tin đăng ký doanh nghiệp trên cổng quốc gia |
| 109 | Information | Khái niệm bao quát chỉ dữ liệu đã được xử lý thành nội dung có ý nghĩa pháp lý hoặc tri thức, có thể không gắn với cá nhân. Được điều chỉnh bởi Luật Tiếp cận thông tin 2016. | Báo cáo tình hình kinh tế vĩ mô quý |
| 110 | LegalConcept | Khái niệm pháp lý là ý niệm trừu tượng được pháp luật quy định hoặc công nhận để điều chỉnh quan hệ xã hội. Nó làm nền tảng cho việc phân loại và giải quyết vụ việc. | Quyền sở hữu tài sản |
| 111 | LegalDefinition | Định nghĩa pháp lý là sự giải thích rõ ràng về nội dung, phạm vi của một thuật ngữ trong văn bản quy phạm pháp luật. Nó tạo cơ sở thống nhất khi áp dụng luật. | 'Cán bộ' theo Luật Cán bộ công chức là công dân Việt Nam được bầu cử vào vị trí có thẩm quyền |
| 112 | LegalPrinciple | Nguyên tắc pháp lý là quy luật nền tảng được hệ thống pháp luật thừa nhận làm căn cứ giải quyết nhất quán. | Nguyên tắc suy đoán vô tội |
| 113 | LegalPurpose | Mục đích pháp lý là lý do, ý định mà nhà làm luật hướng tới khi ban hành quy định. Nó giúp giải thích và diễn giải luật khi có độ mở. | Bảo vệ lợi ích công cộng qua luật môi trường |
| 114 | LegalInterest | Lợi ích pháp lý là quyền lợi được pháp luật bảo vệ hoặc công nhận cho chủ thể. Sự xâm phạm lợi ích này có thể phát sinh trách nhiệm pháp lý. | Quyền lợi người tiêu dùng được hoàn tiền hàng lỗi |
| 115 | LegalStatus | Tình trạng pháp lý của chủ thể trước pháp luật, xác định quyền và nghĩa vụ cơ bản được công nhận. | Công dân Việt Nam |
| 116 | LegalCapacity | Năng lực pháp luật là khả năng chủ thể được có quyền và gánh vác nghĩa vụ pháp lý do pháp luật quy định. | Người đủ 18 tuổi có năng lực pháp luật đầy đủ |
| 117 | CivilCapacity | Năng lực hành vi dân sự là khả năng cá nhân bằng hành vi của mình xác lập, thực hiện quyền và nghĩa vụ dân sự. | Người thành niên có năng lực hành vi dân sự đầy đủ |
| 118 | AdministrativeViolation | Hành vi vi phạm hành chính là hành vi có lỗi vi phạm quy định quản lý nhà nước mà không cấu thành tội phạm. | Vượt đèn đỏ |
| 119 | Crime | Tội phạm là hành vi nguy hiểm cho xã hội, vi phạm pháp luật hình sự và bị truy cứu trách nhiệm hình sự. | Trộm cắp tài sản |
| 120 | Ownership | Quyền của chủ sở hữu đối với tài sản, bao gồm quyền chiếm hữu, sử dụng và định đoạt theo quy định pháp luật. | Chủ đất có quyền chuyển nhượng thửa ruộng |
| 121 | Possession | Việc chủ thể nắm giữ, quản lý tài sản thực tế dù không phải là chủ sở hữu hợp pháp. | Người thuê nhà đang cư ngụ trong căn hộ |
| 122 | Residence | Nơi cá nhân thường xuyên sinh sống và có đăng ký thường trú hoặc tạm trú theo luật cư trú. | Hộ khẩu thường trú tại phường Bến Nghé |
| 123 | ForceMajeure | Sự kiện xảy ra khách quan không thể lường trước và không thể khắc phục dù đã áp dụng mọi biện pháp cần thiết. | Động đất phá hủy toàn bộ công trình xây dựng |
| 124 | Fact |  | Điều 3 của Luật này: được lập căn cứ vào |
| 125 | LegalTransaction |  |  |
| 126 | Register | Hành vi pháp lý nhằm ghi nhận thông tin vào sổ hoặc hệ thống chính thức của cơ quan nhà nước để xác lập tư cách pháp lý, tạo cơ sở cho quyền và nghĩa vụ của chủ thể. | Đăng ký kinh doanh hộ cá thể tại UBND xã |
| 127 | Declare | Hành vi khai báo thông tin sự kiện, tình trạng hoặc số liệu cho cơ quan có thẩm quyền theo quy định pháp luật phục vụ quản lý nhà nước. | Kê khai thuế thu nhập cá nhân hàng năm |
| 128 | Submit | Việc nộp hồ sơ, tài liệu hoặc đơn yêu cầu đến cơ quan có thẩm quyền để đề nghị giải quyết công việc theo thủ tục hành chính. | Nộp hồ sơ xin cấp giấy phép xây dựng |
| 129 | Approve | Quyết định chấp thuận của cơ quan hoặc người có thẩm quyền đối với yêu cầu hoặc hồ sơ, làm phát sinh hiệu lực pháp lý cho hoạt động được đề nghị. | Cơ quan thuế duyệt hoàn thuế giá trị gia tăng |
| 130 | Reject | Quyết định từ chối chấp thuận yêu cầu hoặc hồ sơ do không đáp ứng điều kiện pháp lý, văn bản từ chối phải nêu rõ lý do và căn cứ. | Từ chối cấp visa do hồ sơ không đầy đủ |
| 131 | Issue | Hành động ban hành hoặc cấp phát văn bản, giấy phép, chứng chỉ có giá trị pháp lý bởi cơ quan có thẩm quyền. | Cơ quan cấp phép ban hành giấy phép xây dựng |
| 132 | Revoke | Hành động thu hồi, hủy bỏ hiệu lực của giấy phép, quyết định hoặc quyền đã được cấp trước đó theo quy định pháp luật. | Thu hồi giấy phép kinh doanh do vi phạm |
| 133 | Inspect | Hoạt động kiểm tra, thanh tra hiện trạng, điều kiện thực tế của đối tượng để đảm bảo tuân thủ quy định. | Kiểm tra an toàn phòng cháy tại chung cư |
| 134 | Audit | Việc rà soát, kiểm toán hồ sơ, sổ sách, báo cáo để xác minh tính hợp pháp và chính xác của thông tin. | Kiểm toán báo cáo tài chính doanh nghiệp nhà nước |
| 135 | Investigate | Quá trình điều tra, thu thập chứng cứ để làm rõ vụ việc vi phạm pháp luật hoặc tranh chấp. | Điều tra vụ tai nạn lao động chết người |
| 136 | Authorize | Hành động cấp quyền hoặc sự đồng ý hợp pháp cho phép thực hiện giao dịch hoặc truy cập tài nguyên, thể hiện ý chí chủ thể được pháp luật công nhận. | Chủ thẻ ký duyệt giao dịch qua mã OTP |
| 137 | Pay | Hành động thanh toán tiền để chi trả hàng hóa, dịch vụ hoặc khoản nợ, tạo nghĩa vụ tài chính chấm dứt khi bên nhận nhận đủ. | Khách hàng quét QR thanh toán hóa đơn điện |
| 138 | Transfer | Hành vi pháp lý chuyển giao quyền sở hữu hoặc quyền sử dụng tài sản từ chủ thể này sang chủ thể khác qua hợp đồng hoặc quyết định pháp luật. | Chuyển nhượng quyền sử dụng đất |
| 139 | Buy | Hành động mua tài sản hoặc dịch vụ bằng trao đổi giá trị tài chính, tạo hợp đồng mua bán theo Bộ luật Dân sự với nghĩa vụ thanh toán. | Cá nhân mua xe máy tại cửa hàng |
| 140 | Sell | Hành động chuyển giao tài sản để nhận giá trị tài chính, hình thành giao dịch thương mại hợp pháp với nguồn gốc tài sản minh bạch. | Chủ shop bán áo qua sàn thương mại điện tử |
| 141 | Lease | Hợp đồng cho thuê tài sản để nhận tiền, bên thuê được quyền sử dụng trong thời hạn nhất định theo quy định pháp luật dân sự. | Thuê nhà ở căn hộ chung cư |
| 142 | Mortgage | Thế chấp tài sản bảo đảm nghĩa vụ trả nợ, tài sản không chuyển giao cho bên nhận thế chấp theo Bộ luật Dân sự. | Thế chấp quyền sử dụng đất tại ngân hàng |
| 143 | Donate | Tặng cho tài sản không bồi hoàn, chuyển quyền sở hữu miễn phí cho bên nhận theo thỏa thuận hợp pháp. | Tặng cho quyền sử dụng đất giữa anh em |
| 144 | Build | Xây dựng công trình hoặc nhà ở trên đất, tạo ra tài sản gắn liền với đất theo giấy phép xây dựng. | Xây dựng nhà ở riêng lẻ |
| 145 | Destroy | Làm phá hủy hoặc hư hại tài sản làm mất giá trị sử dụng, có thể phát sinh trách nhiệm bồi thường hoặc hình sự. | Đập phá công trình xây dựng trái phép |
| 146 | Demolish | Hành động phá bỏ công trình xây dựng hiện có theo quyết định hoặc thẩm quyền pháp lý. | Phá dỡ nhà cũ vi phạm quy hoạch |
| 147 | Sign | Hành động ký tên hoặc ký số để xác nhận nội dung văn bản, thể hiện ý chí pháp lý của chủ thể. | Ký hợp đồng mua bán |
| 148 | Verify | Kiểm tra tính đúng đắn và trung thực của thông tin hoặc tài liệu theo quy định pháp luật. | Xác minh giấy tờ tùy thân |
| 149 | Authenticate | Chứng minh định danh của chủ thể thông qua thông tin hoặc phương thức được pháp luật công nhận. | Xác thực qua CCCD |
| 150 | Notarize | Hành vi công chứng viên chứng nhận tính xác thực, hợp pháp của hợp đồng, giao dịch. | Công chứng di chúc |
| 151 | Store | Hành vi lưu giữ dữ liệu, tài liệu pháp lý trong hệ thống nhằm bảo quản và quản lý lâu dài. | Lưu trữ hồ sơ khách hàng trong cơ sở dữ liệu |
| 152 | Collect | Việc thu thập thông tin, chứng cứ từ cá nhân hoặc tổ chức phục vụ mục đích pháp lý hoặc quản lý. | Thu thập dữ liệu cá nhân khi mở tài khoản ngân hàng |
| 153 | Publish | Hành động công bố công khai văn bản hoặc thông tin pháp lý ra trước cộng đồng theo quy định. | Đăng tải nghị định trên cổng thông tin chính phủ |
| 154 | Modify | Sửa đổi nội dung văn bản hoặc dữ liệu đã tồn tại để điều chỉnh quyền, nghĩa vụ hoặc thông tin. | Sửa đổi điều khoản hợp đồng kinh tế |
| 155 | Delete | Xóa bỏ dữ liệu hoặc văn bản pháp lý khỏi hệ thống, chấm dứt giá trị lưu trữ hoặc hiệu lực. | Xóa hồ sơ người dùng theo yêu cầu thu hồi sự đồng ý |
| 156 | Access | Quyền tiếp cận hoặc vào một tài sản, địa điểm hoặc hệ thống nhất định. | Mở cửa nhà đang thuê |
| 157 | Use | Hành vi khai thác công dụng của tài sản cho mục đích sử dụng. | Lái xe cá nhân đi lại |
| 158 | Possess | Việc chiếm giữ tài sản trên thực tế với ý định làm chủ nó. | Cầm giữ điện thoại nhặt được |
| 159 | Own | Quyền sở hữu hợp pháp đối với tài sản, bao gồm chiếm hữu, sử dụng và định đoạt. | Có sổ đỏ nhà đất |
| 160 | Transport | Việc di chuyển hàng hóa hoặc người từ nơi này sang nơi khác bằng phương tiện. | Chở hàng qua biên giới |
| 161 | Import | Việc đưa hàng hóa, dịch vụ hoặc tài sản từ nước ngoài vào lãnh thổ Việt Nam theo quy định pháp luật hải quan. Hoạt động chịu sự kiểm soát của cơ quan hải quan và các nghĩa vụ thuế, kiểm dịch. | Doanh nghiệp nhập khẩu 100 tấn thép từ Trung Quốc về cảng Hải Phòng |
| 162 | Export | Việc đưa hàng hóa, dịch vụ hoặc tài sản từ lãnh thổ Việt Nam ra nước ngoài theo quy định pháp luật hải quan. Cần hoàn tất thủ tục xuất khẩu và tuân thủ quy định quản lý ngoại thương. | Công ty xuất khẩu 500 tấn gạo sang thị trường Philippines |
| 163 | Action |  | lập đồng thời với nhau |
| 164 | Statement | Tuyên bố pháp lý chung thể hiện thông tin hoặc ý chí của cơ quan nhà nước trong văn bản quy phạm. | Nhà nước bảo hộ quyền sở hữu hợp pháp của công dân |
| 165 | DefinitionStatement | Quy định giải thích rõ nghĩa của thuật ngữ pháp lý được sử dụng trong văn bản. | Tài sản công là tài sản thuộc sở hữu toàn dân do Nhà nước đại diện quản lý |
| 166 | ObligationStatement | Quy định bắt buộc chủ thể phải thực hiện hoặc không được thực hiện một hành vi nhất định. | Tổ chức phải nộp tờ khai thuế trước ngày 31 tháng 3 |
| 167 | ExceptionStatement | Quy định loại trừ hoặc miễn trừ áp dụng nguyên tắc chung trong trường hợp cụ thể. | Quy định này không áp dụng với lực lượng vũ trang trong tình trạng chiến tranh |
| 168 | ConditionStatement | Quy định sự kiện hoặc trạng thái cần có để một quan hệ pháp luật phát sinh hoặc chấm dứt. | Hợp đồng chỉ có hiệu lực khi các bên ký tên xác nhận |
| 169 | PenaltyStatement | Tuyên bố pháp lý ghi nhận việc áp dụng hình phạt hoặc chế tài đối với chủ thể vi phạm nghĩa vụ. Xác định rõ loại, mức và căn cứ pháp lý của hình phạt được thi hành. | Quyết định xử phạt vi phạm hành chính 15 triệu đồng đối với cá nhân không đeo khẩu trang |
| 170 | ReferenceStatement | Tuyên bố pháp lý trích dẫn hoặc tham chiếu đến văn bản, điều khoản khác làm căn cứ pháp lý. Giúp xác định nguồn gốc, hiệu lực và phạm vi áp dụng của quy định được viện dẫn. | Khoản 2 Điều 26 Luật Doanh nghiệp 2020 được viện dẫn để xác định quyền của cổ đông |
| 171 | LegalEvent | Sự kiện làm phát sinh, thay đổi hoặc chấm dứt quyền và nghĩa vụ pháp lý của chủ thể theo quy định pháp luật. | Ký kết hợp đồng lao động |
| 172 | NaturalEvent | Hiện tượng tự nhiên không do ý chí con người tạo ra nhưng theo luật có thể làm phát sinh hậu quả pháp lý như tình trạng bất khả kháng. | Động đất làm sập công trình |
| 173 | AdministrativeEvent | Hành vi hành chính tạo ra thay đổi tình trạng pháp lý của tổ chức, cá nhân trước cơ quan nhà nước có thẩm quyền. | Cấp giấy khai sinh tại UBND xã |
| 174 | CivilEvent | Sự kiện dân sự làm phát sinh, thay đổi hoặc chấm dứt quyền và nghĩa vụ dân sự giữa các chủ thể theo Bộ luật Dân sự. | Lập di chúc thừa kế |
| 175 | CommercialEvent | Hoạt động kinh doanh có mục đích sinh lợi của thương nhân phát sinh quyền và nghĩa vụ trong quan hệ thương mại. | Ký hợp đồng mua bán hàng hóa quốc tế |
| 176 | TaxEvent | Sự kiện pháp lý liên quan đến nghĩa vụ thuế, khai báo hoặc quyết toán thuế với cơ quan nhà nước. Bao gồm thay đổi đối tượng nộp thuế, miễn giảm hoặc thanh tra thuế. | Doanh nghiệp nộp tờ khai thuế giá trị gia tăng quý 2 |
| 177 | ConstructionEvent | Sự kiện pháp lý phát sinh trong quá trình xây dựng như cấp phép, khởi công, nghiệm thu hoặc điều chỉnh công trình. Ràng buộc trách nhiệm chủ đầu tư và nhà thầu theo pháp luật xây dựng. | UBND cấp giấy phép xây dựng nhà ở riêng lẻ |
| 178 | JudicialEvent | Sự kiện tố tụng do cơ quan tư pháp tiến hành để xác minh, xét xử hoặc thi hành án theo quy định pháp luật. | Mở phiên tòa xét xử sơ thẩm |
| 179 | InvestigationEvent | Sự kiện điều tra hình sự hoặc hành chính do cơ quan có thẩm quyền tiến hành để thu thập chứng cứ. Bao gồm khởi tố vụ án, lệnh khám xét hoặc triệu tập người làm chứng. | Cơ quan công an ra quyết định khởi tố bị can |
| 180 | InspectionEvent | Sự kiện kiểm tra chuyên ngành của cơ quan quản lý nhà nước đối với hoạt động sản xuất kinh doanh. Bao gồm lập biên bản vi phạm hoặc kết luận thanh tra định kỳ. | Đoàn thanh tra lao động kiểm tra an toàn tại nhà máy |
| 181 | ViolationEvent | Sự kiện vi phạm pháp luật hoặc quy định, ghi nhận hành vi trái luật của chủ thể. Thường kèm biên bản hoặc quyết định xử phạt theo thủ tục pháp lý. | Lập biên bản vi phạm giao thông |
| 182 | PaymentEvent | Sự kiện thanh toán thực hiện nghĩa vụ tài chính hoặc chi trả giá trị hợp đồng theo pháp luật. Giải trừ nghĩa vụ nợ khi hoàn tất. | Nộp thuế qua kho bạc nhà nước |
| 183 | TransferEvent | Sự kiện chuyển giao quyền sở hữu hoặc quyền sử dụng tài sản hợp pháp giữa các bên. Cần thỏa mãn hình thức và điều kiện hiệu lực luật định. | Chuyển nhượng đất có công chứng |
| 184 | RegistrationEvent | Sự kiện đăng ký với cơ quan nhà nước để xác lập tư cách pháp lý hoặc quyền tài sản. Là điều kiện bắt buộc để phát sinh hiệu lực với bên thứ ba. | Đăng ký thành lập doanh nghiệp |
| 185 | Procedure | Thủ tục hành chính hoặc tố tụng do pháp luật quy định để giải quyết công việc cụ thể một cách có thứ tự và minh bạch. | Thủ tục cấp giấy phép xây dựng |
| 186 | Workflow | Luồng công việc nội bộ mô tả trình tự hoạt động giữa các bộ phận để vận hành một quy trình pháp lý hoặc quản lý. | Luồng tiếp nhận hồ sơ qua phòng ban một cửa |
| 187 | Step | Bước thực hiện là đơn vị hành động có ý nghĩa quản lý độc lập trong quy trình, thường được quy định rõ thời hạn và nội dung. | Bước nộp hồ sơ và nhận biên nhận |
| 188 | Task | Nhiệm vụ là công việc chi tiết do cá nhân hoặc đơn vị đảm nhiệm để hoàn thành một bước quy trình đã định. | Kiểm tra tính hợp lệ của giấy tờ tùy thân |
| 189 | Approval | Phê duyệt là hành vi pháp lý của người có thẩm quyền xác nhận tính hợp pháp và cho phép tiến hành bước tiếp theo. | Ký duyệt của giám đốc chi nhánh |
| 190 | Verification | Hoạt động kiểm tra và xác nhận tính xác thực, hợp lệ của thông tin, tài liệu hoặc đối tượng theo quy định pháp luật. | Xác minh chứng minh nhân dân khi mở tài khoản ngân hàng |
| 191 | Review | Quá trình xem xét, đánh giá nội dung, tính hợp pháp và sự phù hợp của hồ sơ hoặc đề xuất trước khi phê duyệt. | Thẩm định hồ sơ xin cấp phép xây dựng |
| 192 | Submission | Việc nộp hồ sơ, tài liệu hoặc đơn yêu cầu đến cơ quan có thẩm quyền để bắt đầu một thủ tục hành chính hoặc pháp lý. | Nộp tờ khai thuế thu nhập cá nhân |
| 193 | Processing | Các bước xử lý, tiếp nhận và thực hiện nghiệp vụ tiếp theo sau khi hồ sơ đã được nộp và đang trong quá trình giải quyết. | Cơ quan thuế tính toán số thuế phải nộp |
| 194 | Decision | Kết quả cuối cùng của thủ tục do cơ quan có thẩm quyền ban hành dưới dạng văn bản hoặc hành động pháp lý xác nhận. | Cấp giấy phép xây dựng |
| 195 | Notification | Văn bản hoặc hành động thông báo chính thức của cơ quan có thẩm quyền hoặc đương sự để truyền đạt thông tin về một bước trong thủ tục pháp lý. | Thông báo thụ lý vụ án dân sự |
| 196 | Execution | Hành vi ký kết hoặc thực thi văn bản pháp lý làm phát sinh quyền và nghĩa vụ hợp pháp giữa các bên. | Ký hợp đồng lao động |
| 197 | Completion | Sự kiện thủ tục pháp lý kết thúc sau khi các điều kiện luật định được thỏa mãn và cơ quan có thẩm quyền xác nhận. | Cấp giấy chứng nhận đăng ký kết hôn sau khi hoàn tất thủ tục |
| 198 | Cancellation | Hành động chấm dứt hiệu lực hoặc dừng một thủ tục pháp lý đang diễn ra theo yêu cầu hoặc quyết định của cơ quan có thẩm quyền. | Rút đơn khởi kiện trước khi xét xử |
| 199 | Date | Mốc thời gian xác định ngày, tháng, năm theo lịch, làm căn cứ phát sinh hoặc chấm dứt quyền nghĩa vụ pháp lý. | Ngày ký hợp đồng 15/03/2024 |
| 200 | Time | Thời điểm trong ngày xác định giờ giao dịch, họp hoặc cut-off hạn trong ngày. | Giờ mở cửa sàn chứng khoán 9:00 |
| 201 | Deadline | Thời hạn do pháp luật hoặc thỏa thuận ấn định, hết thời điểm đó quyền hoặc nghĩa vụ chấm dứt hoặc phát sinh chế tài. | Hạn nộp phạt vi phạm giao thông 10/04/2025 |
| 202 | Duration | Khoảng thời gian liên tục đo bằng ngày, tháng, năm mà một trạng thái pháp lý hoặc hợp đồng duy trì. | Thời hạn thuê nhà 12 tháng |
| 203 | EffectivePeriod | Khoảng thời gian văn bản pháp luật hoặc thỏa thuận có hiệu lực thi hành, xác định rõ ngày bắt đầu và ngày kết thúc. | Hiệu lực hợp đồng bảo hiểm từ 01/01/2024 đến 31/12/2024 |
| 204 | ValidityPeriod | Khoảng thời gian được xác định trong văn bản mà tại đó quyền và nghĩa vụ pháp lý có giá trị thi hành. | Thời hạn bảo hành 24 tháng theo luật bảo vệ người tiêu dùng |
| 205 | GracePeriod | Khoảng thời gian ân hạn sau khi đến hạn nghĩa vụ mà không bị áp dụng chế tài hoặc phạt. Cho phép bên có nghĩa vụ hoàn thành mà không bị coi là vi phạm. | 15 ngày ân hạn sau ngày đáo hạn hợp đồng bảo hiểm |
| 206 | WaitingPeriod | Khoảng thời gian chờ bắt buộc trước khi một quyền lợi có hiệu lực hoặc trước khi được thực hiện một hành động pháp lý. Nhằm loại trừ rủi ro hoặc đảm bảo điều kiện tiên quyết. | Thời gian chờ 30 ngày trước khi bảo hiểm sức khỏe chi trả quyền lợi |
| 207 | BusinessDay | Ngày làm việc theo quy định pháp luật hoặc thỏa thuận, loại trừ ngày nghỉ cuối tuần và ngày lễ. Dùng để tính thời hạn thực hiện nghĩa vụ pháp lý chính xác. | Ngân hàng cam kết xử lý trong 3 ngày làm việc |
| 208 | WorkingHour | Khung giờ được pháp luật hoặc nội quy lao động cho phép thực hiện công việc hoặc giao dịch hành chính. Giới hạn số giờ làm việc để bảo vệ sức khỏe người lao động. | Cơ quan hành chính làm việc từ 8h00 đến 17h00 hàng ngày |
| 209 | FiscalYear | Kỳ kế toán năm do pháp luật quy định làm căn cứ xác định nghĩa vụ thuế và báo cáo tài chính của tổ chức. | Năm tài chính theo dương lịch của doanh nghiệp nhà nước |
| 210 | TaxPeriod | Kỳ tính thuế là khoảng thời gian được quy định để xác định nghĩa vụ thuế phải nộp, bao gồm theo tháng, quý, năm hoặc từng lần phát sinh. | Quý 2 năm 2024 (01/04-30/06) |
| 211 | Constraint | Ràng buộc pháp lý là giới hạn hoặc điều kiện do luật định hoặc thỏa thuận áp đặt lên quyền và nghĩa vụ của chủ thể. | Điều khoản hạn chế chuyển nhượng cổ phần |
| 212 | AgeConstraint | Ràng buộc về độ tuổi tối thiểu hoặc tối đa để cá nhân được phép thực hiện hành vi pháp lý nhất định. | Pháp luật quy định đủ 18 tuổi mới được kết hôn |
| 213 | AreaConstraint | Ràng buộc về phạm vi lãnh thổ hoặc khu vực địa lý áp dụng đối với hoạt động hoặc đối tượng pháp lý. | Quy hoạch chỉ cho phép xây dựng nhà ở tại khu vực đất ở |
| 214 | MoneyConstraint | Ràng buộc về hạn mức, giới hạn số tiền hoặc giá trị tài chính trong giao dịch hoặc nghĩa vụ pháp lý. | Giới hạn chuyển tiền mặt mỗi ngày qua ngân hàng |
| 215 | TaxConstraint | Ràng buộc về nghĩa vụ thuế, mức thuế suất, hoặc các khoản khấu trừ bắt buộc theo quy định thuế. | Thuế giá trị gia tăng 10% áp dụng cho hàng hóa tiêu dùng |
| 216 | PercentageConstraint | Ràng buộc giới hạn tỷ lệ phần trăm theo quy định pháp luật hoặc hợp đồng, vi phạm có thể dẫn đến vô hiệu. Thường áp dụng trong sở hữu, ký quỹ hoặc phân chia lợi nhuận. | Tỷ lệ sở hữu nước ngoài tối đa 50% trong ngân hàng thương mại |
| 217 | DistanceConstraint | Ràng buộc khoảng cách vật lý tối thiểu hoặc tối đa giữa các công trình theo quy chuẩn quy hoạch. Không tuân thủ bị xử phạt hoặc buộc tháo dỡ. | Công trình phải cách trạm biến áp ít nhất 15 mét |
| 218 | TimeConstraint | Ràng buộc về thời hạn mà chủ thể phải thực hiện hoặc hoàn thành nghĩa vụ pháp lý. | Nộp tờ khai thuế trong vòng 90 ngày kể từ ngày kết thúc năm tài chính |
| 219 | DocumentConstraint | Ràng buộc yêu cầu văn bản pháp lý làm điều kiện hiệu lực hoặc thủ tục. Thiếu tài liệu quy định hồ sơ bị vô hiệu hoặc từ chối. | Di chúc miệng phải lập biên bản có người làm chứng |
| 220 | QualificationConstraint | Ràng buộc về năng lực chuyên môn hoặc điều kiện chủ thể theo luật định. Thiếu tư cách pháp lý bị cấm tham gia hoạt động. | Kiểm toán viên phải có chứng chỉ hành nghề do Bộ Tài chính cấp |
| 221 | LegalReference | Tham chiếu đến văn bản quy phạm pháp luật hoặc nguyên tắc pháp lý làm căn cứ giải quyết vụ việc. | Bộ luật Dân sự 2015 |
| 222 | DocumentReference | Tham chiếu đến tài liệu cụ thể như văn bản hành chính, hợp đồng được trích dẫn trong hồ sơ. | Quyết định số 123/QĐ-UBND |
| 223 | ArticleReference | Tham chiếu đến một điều cụ thể trong văn bản pháp luật hoặc tài liệu quy định nội dung điều chỉnh. | Điều 27 Bộ luật Hình sự |
| 224 | ClauseReference | Tham chiếu đến khoản thuộc điều luật hoặc điều khoản hợp đồng phân định chi tiết quyền nghĩa vụ. | Khoản 2 Điều 15 Luật Doanh nghiệp |
| 225 | PointReference | Tham chiếu đến điểm (a, b, c...) trong khoản hoặc mục xác định nội dung liệt kê cụ thể. | Điểm a Khoản 1 Điều 3 |
| 226 | CaseReference | Tài liệu tham chiếu đến một vụ án cụ thể đã được hồ sơ hóa hoặc xét xử, dùng để đối chiếu tình tiết pháp lý. | Vụ án tranh chấp hợp đồng số 12/2020/KDTM |
| 227 | JudgmentReference | Trích dẫn bản án hoặc quyết định của tòa án đã có hiệu lực pháp luật, làm căn cứ pháp lý cho việc giải quyết vụ việc. | Bản án dân sự phúc thẩm số 45/2021/DS-PT |
| 228 | StandardReference | Tham chiếu đến tiêu chuẩn kỹ thuật hoặc quy chuẩn pháp lý bắt buộc áp dụng trong đánh giá sự tuân thủ. | TCVN 7451:2004 về chất lượng nước sinh hoạt |
| 229 | Synonym | Từ hoặc cụm từ có cùng nghĩa pháp lý với thuật ngữ gốc trong văn bản quy phạm. Thường dùng thay thế nhau mà không làm thay đổi bản chất quan hệ pháp luật. | hợp đồng lao động và giao kèo làm công |
| 230 | Abbreviation | Hình thức viết tắt của một thuật ngữ pháp lý dài nhằm thuận tiện tra cứu. Phải được định nghĩa rõ ràng trong văn bản để tránh ambiguity. | BLDS (Bộ luật Dân sự) |
| 231 | Alias | Tên gọi khác được pháp luật công nhận cho cùng một chủ thể hoặc thực thể. Không làm thay đổi tư cách pháp lý của chủ thể đó. | Công ty CP XYZ còn có tên giao dịch XYZ Corp |
| 232 | EquivalentConcept | Khái niệm trong hệ thống pháp luật khác có nội hàm tương đương về mặt chức năng pháp lý. Dùng trong đối chiếu luật quốc tế hoặc liên ngành. | doanh nghiệp tư nhân (VN) tương đương sole proprietorship (US) |
| 233 | BroaderConcept | Khái niệm pháp lý bao quát hơn, chứa đựng khái niệm đang xét như một thành phần loại phụ. Giúp xác định thứ bậc điều chỉnh trong ontology. | tài sản là broader concept của bất động sản |
| 234 | NarrowerConcept | Khái niệm cụ thể hơn được bao hàm bởi khái niệm rộng hơn trong hệ thống phân loại pháp lý. | Tội trộm cắp tài sản là khái niệm hẹp của Tội xâm phạm sở hữu |
| 235 | ParentConcept | Khái niệm bao quát hơn chứa đựng các khái niệm cụ thể hơn trong cấu trúc ontology pháp luật. | Quyền sở hữu là khái niệm cha của Quyền sử dụng đất |
| 236 | ChildConcept | Khái niệm con trực tiếp kế thừa thuộc tính từ khái niệm cha trong mô hình thực thể pháp lý. | Luật Doanh nghiệp là con của Văn bản luật |
| 237 | Domain | Lĩnh vực pháp lý chuyên biệt bao quát một nhóm thực thể có cùng bối cảnh điều chỉnh. | Lĩnh vực Hình sự |
| 238 | Category | Nhóm phân loại các thực thể pháp lý theo tiêu chí nhất định để thuận tiện quản lý và tra cứu. | Nhóm văn bản hành chính |
| 239 | InferenceRule | Quy tắc suy diễn là quy định pháp lý cho phép rút ra kết luận pháp lý từ sự kiện đã biết thông qua lập luận logic. Quy tắc xác định điều kiện tiên quyết và hệ quả pháp lý tương ứng. | Suy đoán vô tội cho đến khi có bản án có hiệu lực |
| 240 | DerivedFact | Sự kiện suy dẫn là tình tiết pháp lý được xác lập gián tiếp qua áp dụng quy tắc suy diễn thay vì chứng cứ trực tiếp. Sự kiện này có giá trị pháp lý trong giải quyết vụ việc. | Tình trạng phá sản xác định từ báo cáo tài chính |
| 241 | Conflict | Xung đột là mâu thuẫn giữa các quy định hoặc kết luận pháp lý cùng chi phối một vụ việc. Xung đột được giải quyết bằng nguyên tắc ưu tiên hoặc thẩm quyền giải thích. | Mâu thuẫn điều khoản hợp đồng với luật bắt buộc |
| 242 | Priority | Độ ưu tiên là thứ tự áp dụng văn bản hoặc chứng cứ khi nhiều quy định cùng chi phối tình huống. Thứ tự thường do hiến pháp, luật hoặc thẩm quyền xác lập. | Hiến pháp cao nhất hệ thống pháp luật |
| 243 | Override | Quy tắc loại trừ là cơ chế vô hiệu hóa áp dụng quy định thấp hơn bởi quy định có hiệu lực cao hơn. Cơ chế bảo đảm thống nhất pháp luật. | Luật chuyên ngành thay thế luật chung |
| 244 | Dependency | Sự phụ thuộc pháp lý là mối quan hệ mà hiệu lực hoặc thực hiện của một quy định, hành vi phải dựa trên điều kiện hoặc văn bản khác. | Nghị định thi hành Luật phụ thuộc vào ngày Luật có hiệu lực |
| 245 | Requirement | Yêu cầu pháp lý là điều kiện bắt buộc phải thỏa mãn theo quy định của pháp luật để một chủ thể được thực hiện quyền hoặc miễn trách nhiệm. | Doanh nghiệp phải có vốn điều lệ tối thiểu 10 tỷ để thành lập ngân hàng |
| 246 | Trigger | Sự kiện kích hoạt là hành vi hoặc thời điểm làm phát sinh, thay đổi hoặc chấm dứt quan hệ pháp luật được quy định sẵn. | Ngày ký hợp đồng làm phát sinh nghĩa vụ giao hàng |
| 247 | Cause | Nguyên nhân pháp lý là hành vi hoặc sự kiện được pháp luật xác định là nguồn gốc trực tiếp dẫn đến hậu quả pháp lý. | Lỗi cố ý gây thiệt hại tài sản là căn cứ buộc bồi thường |
| 248 | Effect | Hậu quả pháp lý là kết quả về quyền và nghĩa vụ phát sinh từ một sự kiện hoặc hành vi được pháp luật điều chỉnh. | Hợp đồng vô hiệu dẫn đến nghĩa vụ hoàn trả tài sản |
| 249 | Precondition | Điều kiện phải được thỏa mãn trước khi một quyền được thực hiện hoặc nghĩa vụ pháp lý phát sinh theo quy định pháp luật hoặc hợp đồng. | Giấy phép hành nghề phải có trước khi bác sĩ thực hiện phẫu thuật |
| 250 | Postcondition | Trạng thái pháp lý hoặc thực tế buộc phải tồn tại sau khi một hành vi pháp lý hoặc thủ tục hoàn tất. | Quyền sở hữu tài sản sang tên bên mua sau khi đăng ký tại cơ quan thẩm quyền |

## Relationship

| STT | Quan hệ | Mô tả | Ví dụ |
|-----|--------|--------|--------|
| 1 | HAS_PART | Quan hệ chỉ ra một văn bản luật hoặc thực thể pháp lý chứa đựng một phần cấu thành hoặc bộ phận cụ thể bên trong nó. | Bộ luật Dân sự 2015 (Văn bản luật) HAS_PART Phần thứ nhất: Những quy định chung (Phần) |
| 2 | HAS_CHAPTER | Quan hệ chỉ ra một văn bản luật hoặc phần của nó chứa đựng một chương quy định các nội dung cụ thể. | Luật Doanh nghiệp 2020 (Văn bản luật) HAS_CHAPTER Chương I: Những quy định chung (Chương) |
| 3 | HAS_SECTION | Quan hệ chỉ ra một chương trong văn bản luật chứa đựng một điều quy định chi tiết về một vấn đề pháp lý. | Chương X Bộ luật Hình sự (Chương) HAS_SECTION Điều 100: Tội trốn thuế (Điều) |
| 4 | HAS_SUBSECTION | Quan hệ chỉ ra một điều luật chứa đựng một khoản quy định chi tiết hoặc điểm nhỏ bên trong điều đó. | Điều 3 Luật Đất đai 2013 (Điều) HAS_SUBSECTION Khoản 1: Giải thích từ ngữ (Khoản) |
| 5 | HAS_ARTICLE | Quan hệ giữa văn bản luật và các điều được ban hành trong đó. Node nguồn là LawDocument, node đích là Article. | Luật Doanh nghiệp 2020 (LawDocument) có Điều 111 (Article) về quyền của cổ đông. |
| 6 | HAS_CLAUSE | Quan hệ giữa một điều luật và các khoản cấu thành điều đó. Node nguồn là Article, node đích là Clause. | Điều 13 (Article) có Khoản 2 (Clause) định nghĩa quyền nhân thân. |
| 7 | HAS_POINT | Quan hệ giữa một khoản và các điểm chia nhỏ nội dung khoản đó. Node nguồn là Clause, node đích là Point. | Khoản 1 (Clause) bao gồm Điểm a (Point) về loại hợp đồng. |
| 8 | HAS_PARAGRAPH | Quan hệ giữa khoản hoặc điều và các đoạn văn phân tách nội dung trong đó. Node nguồn là Clause hoặc Article, node đích là Paragraph. | Khoản 2 (Clause) chứa Đoạn thứ nhất (Paragraph) nêu nguyên tắc áp dụng. |
| 9 | HAS_SENTENCE | Quan hệ chỉ định một đơn vị văn bản (như điều, khoản) chứa đựng một câu luật hoặc quy định cụ thể. Thể hiện cấu trúc nội dung chi tiết của văn bản pháp luật. | Điều 1 (Điều) HAS_SENTENCE (Câu) 'Nhà nước Cộng hòa xã hội chủ nghĩa Việt Nam là Nhà nước pháp quyền xã hội chủ nghĩa của Nhân dân, do Nhân dân, vì Nhân dân.' |
| 10 | PART_OF | Quan hệ không gian thể hiện đơn vị hành chính hoặc khu vực là bộ phận cấu thành của đơn vị lớn hơn. Xác định cấp bậc địa giới hành chính theo luật định. | Quận C (Node: AdministrativeArea) part_of TP. Hà Nội (Node: AdministrativeArea) |
| 11 | NEXT | Quan hệ tuần tự thể hiện đơn vị pháp lý này đứng ngay sau đơn vị pháp lý khác trong văn bản. Dùng để duy trì trình tự đọc và áp dụng luật. | Điều 10 (Điều) NEXT (Điều) Điều 11 Luật Đất đai năm 2013 quy định về quyền và nghĩa vụ của người sử dụng đất. |
| 12 | PREVIOUS | Quan hệ tuần tự thể hiện đơn vị pháp lý này đứng ngay trước đơn vị pháp lý khác trong văn bản. Hỗ trợ việc truy xuất ngược trình tự quy định. | Điều 5 (Điều) PREVIOUS (Điều) Điều 4 Luật Doanh nghiệp năm 2020 quy định về quyền của doanh nghiệp. |
| 13 | IMPLEMENTS | Quan hệ chỉ việc văn bản cấp dưới quy định chi tiết, hướng dẫn thi hành văn bản cấp trên trong hệ thống pháp luật. | Nghị định 30/2020 (Decree) IMPLEMENTS Luật Căn cước 2023 (Law) |
| 14 | DETAILS | Quan hệ chỉ rằng văn bản nguồn cung cấp giải thích hoặc thông tin chi tiết rõ hơn cho nội dung của văn bản đích. Nguồn làm rõ điều khoản đích. | Công văn 2010/BTC-TCT (LegalDocument) DETAILS Nghị định 126/2020/NĐ-CP (LegalDocument) |
| 15 | GUIDES | Văn bản nguồn hướng dẫn chi tiết cách thi hành văn bản đích. Thường do cơ quan cấp dưới ban hành để thực hiện văn bản cấp trên. | Circular (Thông tư) 01/2020/TT-BTP GUIDES Decree (Nghị định) 23/2015/NĐ-CP về cấp bản sao từ sổ gốc. |
| 16 | INTERPRETS | Văn bản nguồn giải thích nội dung, phạm vi áp dụng của văn bản đích. Giúp xóa bỏ sự mập mờ trong quy định pháp luật. | Official Letter (Công văn) 123/TCT-CS INTERPRETS Law (Luật) Thuế GTGT về đối tượng không chịu thuế. |
| 17 | REFERS_TO | Quan hệ chỉ một văn bản, điều khoản hoặc hợp đồng luật đề cập đến một thực thể pháp lý khác. | Điều 12 Luật Thuế (Node: Norm) refers_to 'Cơ quan thuế' (Node: Organization) |
| 18 | CITES | Văn bản nguồn trích dẫn trực tiếp văn bản đích làm căn cứ pháp lý ban hành. | Nghị định 123/2020/NĐ-CP (Document) trích dẫn Luật Quản lý thuế 2019 (Document) |
| 19 | AMENDS | Quan hệ chỉ việc một văn bản pháp luật sửa đổi, bổ sung nội dung của một văn bản pháp luật khác đã ban hành. | Luật sửa đổi bổ sung một số điều của Luật Giáo dục 2019 (Law) AMENDS Luật Giáo dục 2005 (Law) |
| 20 | REPEALS | Quan hệ chỉ việc một văn bản pháp luật bãi bỏ toàn bộ hoặc một phần hiệu lực pháp lý của văn bản khác. | Luật Ban hành văn bản quy phạm pháp luật 2015 (Law) REPEALS Luật Ban hành văn bản quy phạm pháp luật 2008 (Law) |
| 21 | REPLACES | Quan hệ chỉ văn bản pháp lý thay thế hoàn toàn văn bản khác đã tồn tại, làm cho văn bản cũ chấm dứt hiệu lực. | Nghị định 01/2021/NĐ-CP (node Nghị định) thay thế Nghị định 02/2015/NĐ-CP (node Nghị định). |
| 22 | SUPERSEDES | Quan hệ chỉ văn bản mới thay thế hoàn toàn văn bản cũ. Node nguồn và đích đều là Document. | Luật Doanh nghiệp 2020 (Document) thay thế Luật Doanh nghiệp 2014 (Document). |
| 23 | DERIVED_FROM | Quan hệ chỉ rằng văn bản nguồn được ban hành dựa trên căn cứ pháp lý trực tiếp từ văn bản đích. Nguồn thường là văn bản hướng dẫn. | Thông tư 03/2020/TT-BYT (LegalDocument) DERIVED_FROM Luật Khám bệnh, chữa bệnh 2011 (LegalDocument) |
| 24 | RELATED_DOCUMENT | Quan hệ chỉ văn bản có liên quan về nội dung hoặc chủ đề nhưng không thay thế hay kế thừa trực tiếp. | Luật Doanh nghiệp 2020 (node Luật) liên quan đến Luật Đầu tư 2020 (node Luật). |
| 25 | HAS_NORM | Quan hệ chỉ việc một thực thể pháp lý tham chiếu hoặc chứa đựng một quy phạm pháp luật cụ thể. | Điều 12 Luật Đất đai HAS_NORM Quy phạm về cấp giấy chứng nhận |
| 26 | HAS_SUBJECT | Quan hệ xác định chủ thể (cá nhân/tổ chức) chịu sự điều chỉnh hoặc có quyền nghĩa vụ từ quy phạm. | Quy phạm bảo hiểm y tế HAS_SUBJECT Người lao động |
| 27 | HAS_OBJECT | Quan hệ chỉ ra đối tượng (tài sản, hành vi, trạng thái) là mục tiêu tác động của quy phạm pháp luật. | Quy phạm bảo vệ môi trường HAS_OBJECT Nguồn nước mặt |
| 28 | HAS_ACTION | Quan hệ mô tả hành vi được cho phép, bị cấm hoặc bắt buộc thực hiện theo quy phạm pháp luật. | Quy phạm giao thông đường bộ HAS_ACTION Dừng xe trước vạch kẻ |
| 29 | HAS_CONDITION | Quan hệ chỉ điều kiện cần thiết để một quy phạm pháp luật phát sinh hiệu lực hoặc được áp dụng đối với đối tượng. | Điều 64 Luật Đất đai (LegalProvision) HAS_CONDITION Giấy chứng nhận quyền sử dụng đất (Condition) |
| 30 | HAS_EXCEPTION | Quan hệ chỉ trường hợp loại trừ không áp dụng quy phạm pháp luật trong hoàn cảnh cụ thể dù thỏa mãn điều kiện chung. | Nghĩa vụ tham gia nghĩa vụ quân sự (Obligation) HAS_EXCEPTION Người đang học đại học (Exception) |
| 31 | HAS_DEADLINE | Quan hệ chỉ mốc thời gian hoặc khoảng thời gian tối đa mà chủ thể phải thực hiện hoặc hoàn tất hành vi pháp lý. | Thủ tục cấp giấy phép xây dựng (Procedure) HAS_DEADLINE 20 ngày làm việc (Deadline) |
| 32 | HAS_AUTHORITY | Quan hệ chỉ cơ quan, tổ chức hoặc cá nhân được pháp luật giao thẩm quyền ban hành, thi hành hoặc giám sát quy phạm. | Quyết định xử phạt vi phạm hành chính (Sanction) HAS_AUTHORITY Chủ tịch UBND cấp huyện (Authority) |
| 33 | HAS_CONSEQUENCE | Quan hệ chỉ ra hệ quả pháp lý hoặc chế tài phát sinh từ một quy phạm. Node nguồn là Quy phạm, node đích là Hệ quả pháp lý hoặc Chế tài. | Điều 8 Luật Hình sự (node: Quy phạm) HAS_CONSEQUENCE (node: Chế tài) Khoản 2 Điều 12 (phạt tù 2 năm) |
| 34 | HAS_SCOPE | Quan hệ xác định phạm vi điều chỉnh, đối tượng chịu tác động hoặc giới hạn không gian/thời gian của một quy phạm. | Luật Bảo vệ môi trường 2020 (Node: Văn bản luật) có phạm vi điều chỉnh bao gồm Hoạt động bảo vệ môi trường (Node: Lĩnh vực). |
| 35 | HAS_PRIORITY | Quan hệ thể hiện thứ tự ưu tiên hiệu lực giữa các quy phạm khi có xung đột. Node nguồn là Quy phạm có hiệu lực cao hơn, node đích là Quy phạm bị chi phối. | Hiến pháp 2013 (node: Quy phạm) HAS_PRIORITY (node: Quy phạm) Luật Đất đai 2013 |
| 36 | HAS_REFERENCE | Quan hệ tham chiếu hoặc trích dẫn tới văn bản, điều khoản khác để làm rõ nội dung. Node nguồn là Quy phạm đang xét, node đích là Văn bản hoặc Điều khoản được dẫn. | Điều 10 Thông tư 04 (node: Quy phạm) HAS_REFERENCE (node: Điều khoản) Điều 5 Nghị định 15 |
| 37 | HAS_FORMULA | Quan hệ chỉ định công thức toán học hoặc phương pháp tính được dùng để cụ thể hóa một quy định pháp lý. Thể hiện sự ràng buộc về mặt tính toán giữa văn bản quy phạm và biểu thức tính. | (Node: Điều 7 Luật Thuế TNCN) HAS_FORMULA (Node: Công thức tính thuế lũy tiến từng phần) |
| 38 | HAS_REQUIREMENT | Quan hệ thể hiện điều kiện bắt buộc, nghĩa vụ hoặc tiêu chuẩn hành động mà chủ thể phải tuân thủ theo quy định. Là cầu nối giữa quy phạm và nghĩa vụ cụ thể. | (Node: Luật Doanh nghiệp) HAS_REQUIREMENT (Node: Nghĩa vụ công bố thông tin định kỳ) |
| 39 | HAS_ELIGIBILITY | Quan hệ xác định đối tượng, chủ thể hoặc điều kiện tiên quyết để được hưởng quyền lợi hoặc tham gia cơ chế pháp lý. Giới hạn phạm vi áp dụng của quy định với thực thể. | (Node: Chế độ bảo hiểm thất nghiệp) HAS_ELIGIBILITY (Node: Người lao động đã đóng bảo hiểm trên 12 tháng) |
| 40 | HAS_VALIDITY | Quan hệ xác định khoảng thời gian, địa điểm hoặc phạm vi mà quy định pháp lý còn hiệu lực thi hành. Đảm bảo tính xác thực về mặt thời gian và không gian áp dụng. | (Node: Luật Đất đai 2024) HAS_VALIDITY (Node: Có hiệu lực thi hành từ ngày 01/01/2025) |
| 41 | HAS_TERMINATION | Quan hệ chỉ việc văn bản pháp luật bị chấm dứt hiệu lực. Node nguồn là văn bản luật, node đích là văn bản hoặc sự kiện thay thế. | Luật Đất đai 2013 (Văn bản) HAS_TERMINATION bởi Luật Đất đai 2024 (Văn bản) vào ngày 1/1/2025. |
| 42 | HAS_STATEMENT | Quan hệ giữa văn bản hoặc điều khoản luật với tuyên bố pháp lý cụ thể mà nó chứa đựng. Node nguồn là văn bản luật, node đích là tuyên bố. | (Luật Doanh nghiệp 2020) -[HAS_STATEMENT]-> (Điều 111 về quyền của cổ đông) |
| 43 | HAS_RIGHT | Quan hệ xác định chủ thể được pháp luật công nhận một quyền lợi cụ thể. Node nguồn là chủ thể pháp lý, node đích là quyền được hưởng. | Công dân (Chủ thể) HAS_RIGHT quyền tự do ngôn luận theo Hiến pháp 2013. |
| 44 | HAS_OBLIGATION | Quan hệ buộc chủ thể pháp lý phải thực hiện nghĩa vụ nhất định. Node nguồn là chủ thể, node đích là nghĩa vụ phải thi hành. | Người nộp thuế (Chủ thể) HAS_OBLIGATION kê khai thuế thu nhập cá nhân hàng năm. |
| 45 | HAS_PERMISSION | Quan hệ biểu thị chủ thể pháp lý được cơ quan có thẩm quyền cho phép thực hiện hành vi hoặc sở hữu quyền nhất định. | Điều 23 Luật Doanh nghiệp: Cá nhân (node nguồn: Person) HAS_PERMISSION Giấy chứng nhận đăng ký doanh nghiệp (node đích: Permit). |
| 46 | HAS_PROHIBITION | Quan hệ chỉ việc pháp luật cấm chủ thể thực hiện hành vi nhất định dưới chế tài xử phạt. | Điều 8 Luật Phòng chống ma túy: Công dân (node nguồn: Person) HAS_PROHIBITION Sử dụng trái phép chất ma túy (node đích: IllegalAct). |
| 47 | HAS_DEFINITION | Quan hệ liên kết thuật ngữ pháp lý với nội dung định nghĩa chính thức trong văn bản quy phạm pháp luật. | Điều 3 Luật Hôn nhân: Cơ quan đăng ký (node nguồn: StateAgency) HAS_DEFINITION Kết hôn (node đích: LegalTerm). |
| 48 | HAS_RULE |  |  |
| 49 | HAS_ANTECEDENT |  |  |
| 50 | HAS_CONSEQUENT |  |  |
| 51 | GENERATES | Quan hệ mô tả một bước xử lý, quyết định hoặc tác vụ tạo ra một văn bản, hồ sơ hoặc bản ghi dữ liệu mới trong hệ thống. Thể hiện đầu ra hợp pháp của nút nguồn. | Quyết định (Decision) 'Phê duyệt dự án' sinh ra Văn bản (Document) 'Giấy chứng nhận đầu tư'. |
| 52 | STATEMENT_OF | Quan hệ giữa một tuyên bố pháp lý và thực thể hoặc đối tượng mà tuyên bố đó đề cập đến. Node nguồn là tuyên bố, node đích là thực thể được nói tới. | (Thông báo thu hồi đất) -[STATEMENT_OF]-> (Hộ gia đình ông Nguyễn Văn A) |
| 53 | INSTANCE_OF | Quan hệ chỉ định một thực thể cụ thể thuộc về một loại khái niệm pháp lý nhất định. | Công ty TNHH Bách Khoa (Node: Tổ chức) là INSTANCE_OF Doanh nghiệp tư nhân (Node: Khái niệm pháp lý). |
| 54 | SUBCLASS_OF | Quan hệ phân cấp chỉ một khái niệm pháp lý là lớp con của một khái niệm pháp lý bao quát hơn. | Quyền tác giả (Node: Quyền) là SUBCLASS_OF Quyền sở hữu trí tuệ (Node: Nhóm quyền). |
| 55 | RELATED_TO | Quan hệ liên kết chung giữa các thực thể pháp lý có sự tham chiếu hoặc tương tác không thuộc phân cấp hay thành phần. | Người lao động (Node: Chủ thể) RELATED_TO Người sử dụng lao động (Node: Chủ thể) qua hợp đồng. |
| 56 | SAME_AS | Quan hệ chỉ hai thực thể pháp lý là đồng nhất, cùng một chủ thể duy nhất trên phương diện pháp luật. | Node Công ty TNHH X (nguồn) SAME_AS Node Công ty X (đích) theo giấy phép đổi tên |
| 57 | ALIAS_OF | Tên gọi khác được pháp luật hoặc văn bản quy phạm chấp nhận dùng thay thế cho tên gọi chính thức. | Node Bộ Công an (nguồn) ALIAS_OF Node Cơ quan Công an (đích) trong luật tổ chức |
| 58 | SYNONYM_OF | Thuật ngữ pháp lý có nghĩa tương đương và có thể thay thế trong ngữ cảnh quy định cụ thể. | Node Hợp đồng lao động (nguồn) SYNONYM_OF Node Giao kèo thuê mướn (đích) trong văn bản cũ |
| 59 | ABBREVIATION_OF | Dạng viết tắt được định nghĩa trong văn bản pháp luật tương ứng với tên gọi đầy đủ. | Node UBND (nguồn) ABBREVIATION_OF Node Ủy ban nhân dân (đích) theo luật tổ chức |
| 60 | GENERALIZES | Quan hệ chỉ node nguồn khái quát hóa, bao hàm node đích trong cấu trúc pháp lý. | Văn bản luật (nguồn) GENERALIZES nghị định (đích) quy định chi tiết thi hành. |
| 61 | SPECIALIZES | Quan hệ chỉ node nguồn là trường hợp chuyên biệt, cụ thể hóa từ node đích chung. | Tội cướp tài sản (nguồn) SPECIALIZES tội xâm phạm sở hữu (đích) theo luật hình sự. |
| 62 | IS_A | Quan hệ chỉ node nguồn thuộc phân loại pháp lý của node đích một cách đúng đắn. | Thẻ căn cước (nguồn) IS_A giấy tờ tùy thân (đích) được pháp luật công nhận. |
| 63 | HAS_ROLE | Quan hệ chỉ node nguồn nắm giữ chức năng hoặc vị thế pháp lý đối với node đích. | Người bảo hộ (nguồn) HAS_ROLE đại diện pháp luật (đích) cho người chưa thành niên. |
| 64 | REPRESENTS | Quan hệ chỉ việc node nguồn đại diện pháp lý hoặc chức năng cho node đích. Node nguồn là đại diện, node đích là thực thể được đại diện. | Công ty luật A (Organization) REPRESENTS khách hàng B (Person) trong tranh tụng. |
| 65 | WORKS_FOR | Quan hệ lao động where node nguồn là người lao động có hợp đồng với node đích là người sử dụng lao động. Phát sinh quyền nghĩa vụ theo Bộ luật Lao động. | Nguyễn Văn A (Person) WORKS_FOR công ty TNHH B (Organization). |
| 66 | OWNS | Quan hệ sở hữu hợp pháp where node nguồn nắm quyền đối với node đích là tài sản hoặc cổ phần. Xác lập chủ quyền theo luật dân sự. | Trần Văn C (Person) OWNS bất động sản B (Property). |
| 67 | USES | Quan hệ khai thác tài sản dịch vụ where node nguồn sử dụng node đích không chuyển quyền sở hữu. Thể hiện mục đích sử dụng hợp pháp. | Doanh nghiệp A (Organization) USES phần mềm kế toán B (Software) kê khai thuế. |
| 68 | MEMBER_OF | Quan hệ chỉ việc một thực thể là thành viên của một tổ chức hoặc nhóm lớn hơn theo quy định pháp luật. | Công ty TNHH X (LegalEntity) MEMBER_OF Phòng Thương mại Y (ChamberOfCommerce) |
| 69 | BELONGS_TO | Quan hệ biểu thị quyền sở hữu hoặc sự thuộc quyền quản lý hành chính của một thực thể đối với thực thể khác. | Chi nhánh B (Branch) BELONGS_TO Công ty mẹ C (ParentCompany) |
| 70 | SUPERVISES | Quan hệ whereby chủ thể quản lý (Source) theo dõi, hướng dẫn và kiểm soát hoạt động của chủ thể thuộc quyền (Target) nhằm đảm bảo tuân thủ pháp luật. | Thanh tra Bộ Tài chính (Organization) SUPERVISES Cục Thuế tỉnh (Organization) trong công tác quản lý thuế. |
| 71 | MANAGES | Quan hệ quản lý điều hành trực tiếp nguồn lực, dự án hoặc nhân sự thuộc thẩm quyền của chủ thể. | Giám đốc G (Person) MANAGES Phòng Kinh doanh H (Department) |
| 72 | REFERENCES_ARTICLE | Quan hệ chỉ việc một điều luật tham chiếu đến một điều luật khác trong cùng hoặc khác văn bản pháp luật để làm rõ hoặc bổ sung quy định. | Điều 12 (node nguồn: Article) tham chiếu Điều 5 (node đích: Article) về định nghĩa hành vi vi phạm |
| 73 | REFERENCES_CLAUSE | Quan hệ chỉ việc một khoản trong điều luật tham chiếu đến một khoản khác để quy định điều kiện, ngoại lệ hoặc thủ tục. | Khoản 2 Điều 10 (node nguồn: Clause) tham chiếu Khoản 1 Điều 10 (node đích: Clause) về thời hạn nộp hồ sơ |
| 74 | REFERENCES_POINT | Quan hệ chỉ việc một điểm trong khoản tham chiếu đến một điểm khác để liệt kê, loại trừ hoặc giải thích trường hợp cụ thể. | Điểm a Khoản 1 Điều 3 (node nguồn: Point) tham chiếu Điểm b Khoản 2 Điều 3 (node đích: Point) về đối tượng áp dụng |
| 75 | REFERENCES_APPENDIX | Quan hệ chỉ việc điều luật hoặc khoản tham chiếu đến phụ lục chứa bảng biểu, danh mục hoặc biểu mẫu chi tiết kèm theo văn bản. | Điều 25 (node nguồn: Article) tham chiếu Phụ lục I (node đích: Appendix) về danh mục hàng hóa cấm |
| 76 | POINTS_TO | Quan hệ chỉ hướng từ node nguồn đến node đích cụ thể, biểu thị sự tham chiếu trực tiếp hoặc điều hướng trong văn bản luật. | Điều 5 (node Điều luật) POINTS_TO Điều 10 (node Điều luật) để quy định chi tiết về xử phạt. |
| 77 | HAS_REFERENCE_NODE | Quan hệ biểu thị node nguồn chứa hoặc sở hữu một node tham chiếu phụ trợ phục vụ tra cứu hoặc giải thích thuật ngữ. | Khoản 2 (node Khoản) HAS_REFERENCE_NODE Ghi chú 1 (node Ghi chú) giải thích thuật ngữ chuyên môn. |
| 78 | STARTS | Quan hệ chỉ định quy trình hoặc giai đoạn bắt đầu bằng một bước công việc cụ thể, xác định điểm khởi đầu hợp pháp của luồng thực hiện. | Quy trình xét duyệt hồ sơ (Workflow) STARTS Bước tiếp nhận đơn (Task) |
| 79 | ENDS | Quan hệ xác định bước công việc hoặc giai đoạn kết thúc một quy trình, tạo điểm dừng có hiệu lực pháp lý cho luồng thực hiện. | Quy trình thanh lý hợp đồng (Workflow) ENDS Bước ký biên bản bàn giao (Task) |
| 80 | NEXT_STEP | Quan hệ tuần tự chỉ bước công việc tiếp theo phải được thực hiện sau khi bước hiện tại hoàn tất theo trình tự quy định. | Bước thẩm định (Task) NEXT_STEP Bước phê duyệt (Task) |
| 81 | PREVIOUS_STEP | Quan hệ tuần tự chỉ bước công việc liền trước đã hoàn tất trước khi bước hiện tại được bắt đầu theo trình tự quy định. | Bước cấp giấy phép (Task) PREVIOUS_STEP Bước kiểm tra điều kiện (Task) |
| 82 | BELONGS_TO_PROCEDURE | Quan hệ chỉ định một nhiệm vụ hoặc bước công việc trực thuộc một quy trình thủ tục hành chính cụ thể. Thể hiện phân nhóm luồng công việc trong tổng thể quy trình pháp lý. | Bước (Task) 'Tiếp nhận hồ sơ' thuộc về Quy trình (Procedure) 'Cấp giấy phép xây dựng'. |
| 83 | REQUIRES | Quan hệ thể hiện một bước công việc hoặc hồ sơ đòi hỏi sự tồn tại, hoàn thành hoặc cung cấp của một điều kiện, tài liệu khác trước khi tiến hành. Đảm bảo tính tiên quyết trong luồng xử lý hành chính. | Tác vụ (Task) 'Cấp sổ đỏ' yêu cầu Văn bản (Document) 'Đơn xin giao đất'. |
| 84 | VALIDATES | Quan hệ chỉ việc một cơ quan, bước kiểm tra hoặc tác nhân thực hiện xác minh tính hợp lệ, hợp pháp của hồ sơ, thông tin. Là chốt chặn chất lượng trước khi phê duyệt chính thức. | Cơ quan (Authority) 'Sở Tư pháp' kiểm duyệt Văn bản (Document) 'Hợp đồng ủy quyền'. |
| 85 | HAS_STATE | Quan hệ chỉ định rằng một thực thể quy trình sở hữu một trạng thái xác định trong vòng đời của nó theo quy định pháp luật. | Hồ sơ đăng ký kinh doanh (node: BusinessRegistration) HAS_STATE Đang chờ thẩm định (node: State_PendingReview) |
| 86 | TRANSITIONS_TO | Quan hệ biểu thị sự chuyển đổi trạng thái hoặc bước thực hiện từ node nguồn sang node đích theo trình tự quy định pháp lý. | Bước tiếp nhận hồ sơ (node: Step_Receive) TRANSITIONS_TO Bước thẩm định (node: Step_Verify) |
| 87 | PARALLEL_WITH | Quan hệ xác định hai bước quy trình có thể thực hiện đồng thời mà không vi phạm điều kiện tiên quyết pháp lý. | Bước kiểm tra thuế (node: Step_TaxCheck) PARALLEL_WITH Bước kiểm tra bảo hiểm (node: Step_InsuranceCheck) |
| 88 | OPTIONAL_STEP | Quan hệ chỉ ra bước quy trình không bắt buộc nhưng được phép thực hiện để bảo vệ quyền lợi mà không vô hiệu quy trình chính. | Quy trình đăng ký (node: Process_Register) OPTIONAL_STEP Yêu cầu tư vấn pháp lý (node: Step_LegalConsult) |
| 89 | MANDATORY_STEP | Quan hệ chỉ định bước xử lý bắt buộc phải thực hiện từ node nguồn đến node đích trong quy trình pháp lý. Bỏ qua bước này làm quy trình vô hiệu. | Điều 10: Hồ sơ đăng ký (Node: Application) phải trải qua thẩm định (Node: Review) là bước bắt buộc. |
| 90 | REPEAT_STEP | Quan hệ chỉ định bước lặp lại từ node nguồn đến node đích cho đến khi đạt điều kiện nhất định trong quy trình. Áp dụng cho chu trình lặp hành chính. | Điều 15: Hồ sơ không hợp lệ (Node: InvalidDoc) phải quay lại bổ sung (Node: Supplement) và lặp kiểm tra (Node: Check) đến khi hợp lệ. |
| 91 | AUTHORIZES | Quan hệ whereby cơ quan nhà nước hoặc cấp có thẩm quyền (Source) cấp phép, trao quyền pháp lý cho cá nhân hoặc tổ chức (Target) được thực hiện hành vi nhất định. | Bộ Công an (Organization) AUTHORIZES Công ty TNHH Bảo vệ Minh Anh (Organization) được kinh doanh dịch vụ bảo vệ. |
| 92 | INSPECTS | Quan hệ whereby cơ quan chức năng (Source) tiến hành kiểm tra trực tiếp hiện trạng, hồ sơ, quy trình của đối tượng (Target) theo nhiệm vụ được giao. | Cục An toàn thực phẩm (Organization) INSPECTS Nhà hàng Hương Việt (Organization) về điều kiện vệ sinh. |
| 93 | AUDITS | Quan hệ whereby cơ quan kiểm toán độc lập (Source) xác minh và đánh giá tính trung thực, hợp pháp của báo cáo tài chính hoặc hoạt động của đối tượng (Target). | Kiểm toán Nhà nước (Organization) AUDITS Tập đoàn Điện lực Việt Nam (Organization) cho niên độ 2023. |
| 94 | MONITORS | Quan hệ khi một cơ quan hoặc thực thể có thẩm quyền theo dõi, kiểm tra hoạt động của thực thể khác nhằm đảm bảo tuân thủ pháp luật. | Cơ quan Thanh tra Chính phủ (Node: Cơ quan Nhà nước) MONITORS hoạt động của UBND tỉnh (Node: Cơ quan Nhà nước). |
| 95 | REGULATES | Quan hệ khi cơ quan nhà nước thiết lập quy định pháp lý chi phối quyền, nghĩa vụ hoặc hoạt động của thực thể khác. | Ngân hàng Nhà nước (Node: Cơ quan Quản lý) REGULATES hoạt động tín dụng của ngân hàng thương mại (Node: Tổ chức Tín dụng). |
| 96 | ENFORCES | Quan hệ khi cơ quan có thẩm quyền thi hành biện pháp cưỡng chế hoặc xử lý vi phạm pháp luật đối với thực thể khác. | Cục Hải quan (Node: Cơ quan Nhà nước) ENFORCES quyết định xử phạt đối với doanh nghiệp xuất nhập khẩu (Node: Doanh nghiệp). |
| 97 | ISSUES | Quan hệ khi cơ quan hoặc tổ chức có thẩm quyền ban hành văn bản, giấy phép, quyết định pháp lý cho thực thể khác. | Bộ Tư pháp (Node: Cơ quan Nhà nước) ISSUES giấy phép hành nghề luật sư cho cá nhân (Node: Cá nhân). |
| 98 | REVOKES | Quan hệ chỉ việc chủ thể có thẩm quyền (node nguồn) thu hồi, hủy bỏ hiệu lực giấy phép, quyết định hoặc quyền hạn đã cấp cho chủ thể khác (node đích). | Bộ Công an (node nguồn: Cơ quan nhà nước) thu hồi Giấy phép kinh doanh (node đích: Giấy phép). |
| 99 | CERTIFIES | Quan hệ chỉ việc cơ quan hoặc tổ chức có thẩm quyền (node nguồn) xác nhận, chứng nhận tính hợp pháp hoặc tiêu chuẩn của đối tượng, hồ sơ, cá nhân (node đích). | Bộ Y tế (node nguồn: Cơ quan nhà nước) chứng nhận Cơ sở đạt chuẩn vệ sinh (node đích: Cơ sở sản xuất). |
| 100 | VIOLATES | Quan hệ chỉ việc một hành vi hoặc chủ thể vi phạm một quy định pháp luật hoặc điều khoản cụ thể. | Cá nhân (nguồn) VIOLATES Điều 8 Luật Giao thông đường bộ (đích) khi đi ngược chiều. |
| 101 | PENALIZED_BY | Quan hệ chỉ việc một chủ thể phải chịu chế tài hoặc hình phạt do một quy định hoặc quyết định pháp lý ấn định. | Người điều khiển xe (nguồn) PENALIZED_BY Quyết định xử phạt số 123/QĐ-XPHC (đích) của cơ quan chức năng. |
| 102 | FINED_BY | Quan hệ chỉ việc một chủ thể bị áp dụng hình phạt tiền theo một quy định hoặc quyết định xử phạt cụ thể. | Chủ xe ô tô (nguồn) FINED_BY Điều 5 Nghị định 100/2019/NĐ-CP (đích) với mức 4 triệu đồng. |
| 103 | IMPRISONED_BY | Quan hệ chỉ việc một chủ thể bị tước quyền tự do và chịu hình phạt tù theo bản án hoặc điều luật hình sự. | Bị cáo A (nguồn) IMPRISONED_BY Bản án số 10/2023/HS-ST (đích) với mức án 5 năm tù. |
| 104 | SUSPENDED_BY | Quan hệ chỉ định thực thể (giấy phép, quyền) bị tạm đình chỉ hiệu lực bởi cơ quan có thẩm quyền. Thể hiện trạng thái mất hiệu lực tạm thời do vi phạm pháp luật. | Giấy phép kinh doanh (License) SUSPENDED_BY Cục Thuế (TaxAuthority) do trốn thuế. |
| 105 | CONFISCATED_BY | Quan hệ chỉ định tài sản bị tịch thu sung quỹ nhà nước hoặc chuyển giao quyền sở hữu cưỡng chế bởi cơ quan chức năng. Hành động này chuyển quyền chiếm hữu hợp pháp. | Xe ô tô (Vehicle) CONFISCATED_BY Công an (Police) do vi phạm giao thông nghiêm trọng. |
| 106 | COMPENSATED_BY | Quan hệ chỉ định bên bị thiệt hại nhận bồi thường tài chính hoặc khôi phục lợi ích bởi bên gây thiệt hại hoặc bên bảo hiểm. Phản ánh nghĩa vụ khắc phục hậu quả pháp lý. | Người lao động (Employee) COMPENSATED_BY Công ty (Employer) theo quyết định hòa giải lao động. |
| 107 | RESTORED_BY | Quan hệ chỉ việc một văn bản hoặc điều khoản từng bị bãi bỏ được đưa trở lại hiệu lực bởi văn bản khác. Node nguồn là văn bản được khôi phục, node đích là văn bản khôi phục. | Luật Tổ chức Tòa án nhân dân 1960 (node: Law) được khôi phục một phần bởi Nghị quyết 51/2001/QH10 (node: Resolution) |
| 108 | BEFORE | Quan hệ thời gian chỉ sự kiện pháp lý nguồn xảy ra trước sự kiện đích. Dùng xác định thứ tự ưu tiên hoặc điều kiện tiên quyết trong thời gian. | Quyết định hành chính (node nguồn) ban hành BEFORE Đơn khiếu nại (node đích) được tiếp nhận. |
| 109 | AFTER | Quan hệ thời gian chỉ sự kiện pháp lý nguồn xảy ra sau sự kiện đích. Thường dùng cho thời hiệu khởi kiện hoặc hiệu lực hồi tố. | Đơn khởi kiện (node nguồn) nộp AFTER Sự kiện vi phạm (node đích) phát sinh. |
| 110 | WITHIN | Quan hệ thời gian buộc một hành vi pháp lý phải thực hiện trong khoảng thời hạn nhất định kể từ thời điểm tham chiếu. Đảm bảo tuân thủ thời hiệu hoặc thời hạn luật định. | (Node: Nộp tờ khai thuế) trong vòng 10 ngày kể từ (Node: Phát sinh nghĩa vụ thuế) |
| 111 | UNTIL | Quan hệ thời gian xác định một trạng thái pháp lý hoặc nghĩa vụ duy trì hiệu lực tới một thời điểm cụ thể. Giới hạn thời hạn tồn tại của quyền hoặc giấy phép. | (Node: Giấy phép xây dựng tạm) có hiệu lực cho tới (Node: Ngày 01/01/2026) |
| 112 | SINCE | Quan hệ chỉ thời điểm một thực thể pháp lý bắt đầu tồn tại hoặc phát sinh trạng thái pháp lý. Thường gắn với ngày thành lập hoặc ngày hiệu lực sớm nhất. | (Thực thể: Công ty ABC) SINCE (Thời điểm: Ngày 15/03/2010) - ngày đăng ký kinh doanh |
| 113 | DURING | Quan hệ thời gian chỉ sự kiện nguồn diễn ra trong khoảng thời gian của sự kiện đích. Thể hiện tính liên tục hoặc phạm vi hiệu lực. | Giấy phép kinh doanh (node nguồn) có hiệu lực DURING Kỳ báo cáo thuế (node đích). |
| 114 | VALID_FROM | Thời điểm văn bản hoặc quy định bắt đầu có hiệu lực pháp luật. Mọi hệ quả pháp lý chỉ phát sinh sau mốc này. | (Văn bản: Nghị định 123) VALID_FROM (Thời điểm: Ngày 01/01/2024) |
| 115 | VALID_TO | Thời điểm văn bản hoặc quyền hạn chấm dứt hiệu lực pháp lý. Sau mốc này thực thể không còn giá trị ràng buộc. | (Hợp đồng: Hợp đồng bảo hiểm) VALID_TO (Thời điểm: Ngày 31/12/2025) |
| 116 | EFFECTIVE_FROM | Quan hệ chỉ thời điểm văn bản hoặc quy định bắt đầu có hiệu lực pháp lý. Node nguồn là văn bản/điều luật, node đích là mốc thời gian cụ thể. | Luật Đất đai 2024 (Văn bản luật) có hiệu lực từ ngày 01/01/2025 (Ngày hiệu lực). |
| 117 | EXPIRES_ON | Quan hệ chỉ thời điểm văn bản hoặc quy định chấm dứt hiệu lực pháp lý. Node nguồn là văn bản/điều luật, node đích là mốc thời gian cụ thể. | Nghị định 12/2020 (Văn bản luật) hết hiệu lực vào ngày 30/06/2023 (Ngày hết hiệu lực). |
| 118 | HAS_AMOUNT | Quan hệ chỉ số tiền, số lượng vật chất hoặc định mức được quy định gắn với thực thể pháp lý. | Điều 23: Mức phạt tối thiểu 5.000.000 VND (QUY_DINH_PHAT -> HAS_AMOUNT -> SO_TIEN) |
| 119 | HAS_RATE | Quan hệ xác định tỷ lệ phần trăm hoặc hệ số áp dụng cho một nghĩa vụ hoặc đối tượng theo quy định pháp luật. | [Hợp đồng tín dụng] HAS_RATE [Lãi suất 12%/năm] - lãi suất vay không quá 12% mỗi năm. |
| 120 | HAS_LIMIT | Quan hệ quy định giới hạn tối đa hoặc tối thiểu được phép của một quyền, nghĩa vụ hoặc hoạt động. | [Giấy phép môi trường] HAS_LIMIT [Lưu lượng 1000 m3/ngày] - xả thải tối đa 1000 mét khối mỗi ngày. |
| 121 | HAS_THRESHOLD | Quan hệ chỉ ngưỡng giới hạn số lượng hoặc giá trị mà tại đó hệ quả pháp lý phát sinh. | Doanh thu trên 1 tỷ phải nộp thuế (NGUONG -> HAS_THRESHOLD -> GIA_TRI) |
| 122 | HAS_DURATION | Quan hệ xác định khoảng thời gian hoặc thời hạn hiệu lực của nghĩa vụ hoặc quyền pháp lý. | Điều 10: Thời hạn hợp đồng 24 tháng (HOP_DONG -> HAS_DURATION -> THOI_GIAN) |
| 123 | HAS_AREA | Quan hệ biểu thị diện tích đất hoặc tài sản bất động sản được đề cập trong văn bản pháp luật hoặc giao dịch. | Thửa đất số 123 (Node: LandPlot) HAS_AREA 500 mét vuông (Node: Area) |
| 124 | HAS_WEIGHT | Quan hệ thể hiện khối lượng hàng hóa, tang vật hoặc tài sản vật chất liên quan đến quy định hoặc tranh chấp pháp lý. | Lô hàng bị tịch thu (Node: SeizedGoods) HAS_WEIGHT 2 tấn (Node: Weight) |
| 125 | HAS_DISTANCE | Quan hệ chỉ khoảng cách địa lý giữa các địa điểm liên quan đến quy hoạch, hành chính hoặc ranh giới pháp lý. | Công trình xây dựng (Node: Construction) HAS_DISTANCE 200 mét đến sông (Node: River) |
| 126 | HAS_PERCENTAGE | Quan hệ biểu thị tỷ lệ phần trăm của giá trị được áp dụng trong quy định pháp luật. | Điều 5: Thuế suất 10% trên doanh thu (QUY_DINH_THUE -> HAS_PERCENTAGE -> TY_LE) |
| 127 | USES_VARIABLE | Quan hệ chỉ định công thức pháp lý sử dụng một biến số cụ thể làm đầu vào. Biến số được định nghĩa trong văn bản luật làm cơ sở tính toán. | Formula(TínhThuếTNCN) USES_VARIABLE Variable(ThuNhậpChịuThuế) |
| 128 | CALCULATES | Quan hệ thể hiện công thức thực hiện tính toán để xác định một giá trị pháp lý cụ thể. Giá trị thường là số tiền, tỷ lệ hoặc thời hạn. | Formula(TínhLãiSuấtChậmNộp) CALCULATES Amount(SốTiềnLãi) |
| 129 | OUTPUT | Quan hệ liên kết bước tính toán với kết quả đầu ra được luật quy định. Kết quả có thể làm căn cứ cho quyết định hành chính. | Calculation(BướcTínhPhạtChậmNộp) OUTPUT Penalty(KhoảnPhạtViPhạm) |
| 130 | HAS_EXPRESSION | Quan hệ giữa điều luật và biểu thức toán học hoặc logic được quy định trong đó. Biểu thức mã hóa quy tắc tính toán một cách chính xác. | Article(Điều56LuậtBảoHiểm) HAS_EXPRESSION Expression(mức_hưởng = 60% * mức_bình_quân) |
| 131 | BASED_ON_FORMULA | Quan hệ chỉ định một thực thể pháp lý hoặc quy định được xác định, tính toán hoặc thiết lập dựa trên một công thức toán học hoặc phương pháp tính cụ thể đã được quy định. | Điều 7 Nghị định 123/2020: Mức phạt tiền (Node: Sanction) được tính BASED_ON_FORMULA Công thức phạt theo tỷ lệ doanh thu (Node: Formula). |
| 132 | EQUIVALENT_TO | Quan hệ hai node nguồn và đích mang nghĩa tương đương, có thể thay thế lẫn nhau. Dùng đồng nhất thực thể trùng lặp trong đồ thị. | Node A EQUIVALENT_TO Node B |
| 133 | SIMILAR_TO | Quan hệ hai node có đặc điểm hay ngữ nghĩa gần giống nhau. Rõ node nguồn và node đích cùng lớp thực thể. | Node nguồn: Mèo --SIMILAR_TO--> Node đích: Hổ |
| 134 | BROADER_THAN | Quan hệ chỉ node nguồn bao quát hoặc khái quát hơn node đích. Node đích là thể hiện cụ thể hoặc hẹp hơn của node nguồn. | Động vật là broader than Chó |
| 135 | NARROWER_THAN | Quan hệ chỉ node nguồn là thể hiện cụ thể, hẹp hơn node đích bao quát. Ngược của BROADER_THAN. | Chó là narrower than Động vật |
| 136 | SYNONYM | Quan hệ chỉ hai thuật ngữ pháp lý có cùng nghĩa hoặc được luật cho phép dùng thay thế nhau trong ngữ cảnh. | 'Hợp đồng lao động' (Node: Term) synonym 'Giao kèo làm việc' (Node: Term) |
| 137 | ABBREVIATION | Quan hệ chỉ node nguồn là dạng viết tắt của node đích. Node nguồn từ viết gọn, node đích từ đầy đủ. | AI là viết tắt của Trí tuệ nhân tạo |
| 138 | EXPANDS_TO | Quan hệ chỉ rõ node nguồn mở rộng thành node đích. Nguồn sinh đích hoặc đích là phần chi tiết của nguồn. | Project EXPANDS_TO Task |
| 139 | HAS_ALIAS | Quan hệ biểu thị thực thể pháp lý được tham chiếu bằng tên gọi khác, bao gồm tên viết tắt hoặc số hiệu thay thế. Đảm bảo nhất quán khi truy xuất định danh trong hệ thống văn bản quy phạm. | Văn bản luật (node nguồn: LegalDocument) HAS_ALIAS Luật số 59/2020/QH14 (node đích: DocumentAlias) |
| 140 | IMPLIES | Quan hệ suy dẫn pháp lý: quy định nguồn bao hàm hoặc dẫn đến hệ quả bắt buộc tại quy định đích. | Điều 21 Luật Hôn nhân (node: Điều luật) IMPLIES Điều 8 Luật Trẻ em (node: Điều luật) về nghĩa vụ bảo vệ trẻ. |
| 141 | CONTRADICTS | Quan hệ chỉ hai quy định hoặc nghĩa vụ pháp lý mâu thuẫn nhau không thể đồng thời áp dụng. | Điều 10 Luật A (Node: Norm) contradicts Điều 20 Luật B (Node: Norm) |
| 142 | OVERRIDES | Quan hệ thay thế ưu tiên: văn bản luật cao hơn hoặc mới hơn làm mất hiệu lực áp dụng của văn bản thấp hơn hoặc cũ hơn. | Luật Đất đai 2024 (node: Văn bản luật) OVERRIDES Luật Đất đai 2013 (node: Văn bản luật) tại Điều 20. |
| 143 | DERIVES | Quan hệ xuất phát: quy định đích được hình thành, chiết xuất hoặc cụ thể hóa trực tiếp từ quy định nguồn. | Hiến pháp 2013 (node: Văn bản luật) DERIVES Luật Tổ chức Quốc hội (node: Văn bản luật) về quyền lập pháp. |
| 144 | DEPENDS_ON | Quan hệ pháp lý chỉ rằng hiệu lực hoặc tồn tại của quy định nguồn phụ thuộc vào quy định đích. | Điều 10 (Điều khoản) DEPENDS_ON Điều 9 (Điều khoản) về điều kiện cấp phép. |
| 145 | BLOCKS | Quan hệ chỉ rằng quy định nguồn ngăn cản hoặc đình chỉ hiệu lực của quy định đích. | Luật Đất đai 2024 (Luật) BLOCKS Quyết định cũ (Quyết định) về thu hồi đất trái thẩm quyền. |
| 146 | ENABLES | Quan hệ chỉ rằng quy định nguồn tạo cơ sở pháp lý hoặc điều kiện cần để quy định đích được thực thi. | Luật Doanh nghiệp (Luật) ENABLES Cổng đăng ký quốc gia (Hệ thống) hoạt động cấp mã số thuế. |
| 147 | ACTIVATES | Quan hệ chỉ rằng quy định nguồn kích hoạt hoặc làm phát sinh hiệu lực của quy định đích tại thời điểm cụ thể. | Nghị định 01 (Nghị định) ACTIVATES Điều 5 (Điều khoản) về xử phạt giao thông từ 01/07. |
| 148 | DEACTIVATES | Quan hệ chỉ định một quy định làm mất hiệu lực quy định khác. Node nguồn là văn bản/điều khoản bãi bỏ, node đích là văn bản/điều khoản bị bãi bỏ. | Nghị định 2023/DEACTIVATES/Nghị định 2010 (node nguồn: Nghị định, node đích: Nghị định) |
| 149 | PRECONDITION_OF | Quan hệ chỉ điều kiện tiên quyết phải thỏa mãn trước khi hành động pháp lý hoặc quyền được thực hiện. Node nguồn là điều kiện, node đích là hành động hoặc quyền. | Chứng chỉ hành nghề/PRECONDITION_OF/Giấy phép xây dựng (node nguồn: Giấy tờ, node đích: Giấy phép) |
| 150 | POSTCONDITION_OF | Quan hệ chỉ trạng thái hoặc nghĩa vụ phát sinh sau khi hành động pháp lý hoàn tất. Node nguồn là trạng thái/nghĩa vụ, node đích là hành động pháp lý. | Nghĩa vụ nộp thuế/POSTCONDITION_OF/Đăng ký kinh doanh (node nguồn: Nghĩa vụ, node đích: Thủ tục) |
| 151 | ALTERNATIVE_TO | Quan hệ chỉ phương án thay thế có giá trị pháp lý tương đương cho quy định hoặc biện pháp. Node nguồn và node đích cùng loại, là các lựa chọn khác nhau. | Hòa giải tại trung tâm/ALTERNATIVE_TO/Khởi kiện tòa án (node nguồn: Biện pháp, node đích: Biện pháp) |
| 152 | EXCLUSIVE_WITH | Quan hệ loại trừ lẫn nhau giữa hai khái niệm hoặc trạng thái pháp lý, khi một bên tồn tại thì bên kia bị vô hiệu hoặc không thể áp dụng đồng thời. | (Node: Tình_Trạng_Độc_Thân) EXCLUSIVE_WITH (Node: Tình_Trạng_Kết_Hôn) theo quy định Luật Hôn nhân và Gia đình. |
| 153 | REFERENCES | Quan hệ thể hiện văn bản dẫn chiếu văn bản khác. Node nguồn và đích đều là Document. | Luật Đất đai 2024 (Document) tham chiếu Luật Nhà ở 2023 (Document). |
| 154 | REPLACED_BY | Quan hệ chỉ văn bản quy phạm pháp luật cũ ngừng áp dụng vì có văn bản mới thay thế toàn bộ nội dung. Node nguồn là văn bản cũ, node đích là văn bản thay thế. | Luật Đất đai 2003 (node: Law) được thay thế bởi Luật Đất đai 2013 (node: Law) |
| 155 | ABOLISHED_BY | Quan hệ chỉ một cơ quan, tổ chức hoặc quy định cụ thể bị xóa bỏ bởi một văn bản pháp lý khác. Node nguồn là thực thể bị xóa bỏ, node đích là văn bản xóa bỏ. | Ủy ban Dân số Gia đình và Trẻ em (node: Agency) bị xóa bỏ bởi Nghị định 22/2003/NĐ-CP (node: Decree) |
| 156 | INTRODUCED_BY | Quan hệ chỉ văn bản quy phạm pháp luật (node nguồn) được giới thiệu, đưa vào chương trình hoặc hệ thống pháp luật bởi một văn bản khác (node đích). Thường thấy ở nghị quyết của cơ quan quyền lực nhà nước giới thiệu dự thảo để thông qua. | Hiến pháp năm 2013 (Văn bản) INTRODUCED_BY Nghị quyết số 72/2013/QH13 (Văn bản) của Quốc hội. |
| 157 | MODIFIED_BY | Quan hệ chỉ văn bản quy phạm pháp luật (node nguồn) bị sửa đổi, bổ sung nội dung bởi một văn bản khác (node đích). Văn bản đích chứa điều khoản thay thế hoặc cập nhật văn bản nguồn. | Bộ luật Hình sự 2015 (Văn bản) MODIFIED_BY Luật số 12/2017/QH14 (Văn bản) sửa đổi bổ sung một số điều. |
| 158 | IS_VERSION_OF |  |  |
| 159 | APPLIES_TO | Quan hệ chỉ định văn bản pháp luật hoặc quy định áp dụng cho một đối tượng, lĩnh vực hoặc địa bàn cụ thể. | Bộ luật Dân sự 2015 (Node: Văn bản luật) áp dụng cho Giao dịch dân sự (Node: Hành vi pháp lý) trên lãnh thổ Việt Nam. |
| 160 | NOT_APPLIES_TO | Quan hệ xác định văn bản pháp luật hoặc quy định loại trừ việc áp dụng đối với một đối tượng, thực thể cụ thể nào đó. | Luật Cán bộ công chức (Node: Văn bản luật) NOT_APPLIES_TO Người lao động hợp đồng (Node: Cá nhân) |
| 161 | HAS_SCOPE_OF | Quan hệ biểu thị điều khoản hoặc văn bản sở hữu một phạm vi điều chỉnh, đối tượng tác động xác định. | Điều 3 Luật Đất đai (Node: Điều luật) HAS_SCOPE_OF Quyền sử dụng đất (Node: Quyền pháp lý) |
| 162 | REGULATES_SCOPE | Quan hệ thể hiện cơ quan hoặc văn bản cấp trên quy định chi tiết, thiết lập ranh giới phạm vi cho thực thể cấp dưới. | Quốc hội (Node: Cơ quan nhà nước) REGULATES_SCOPE Phạm vi hoạt động ngân hàng (Node: Lĩnh vực) |
| 163 | DEFINES | Quan hệ ngữ nghĩa chỉ việc văn bản quy phạm định nghĩa khái niệm pháp lý, từ node VănBảnQuyPhạm đến node ThuậtNgữPhápLý. | Bộ luật Dân sự 2015 định nghĩa 'Hợp đồng' tại Điều 385 (VănBảnQuyPhạm → ThuậtNgữPhápLý) |
| 164 | HAS_TERM | Quan hệ giữa một điều luật và thuật ngữ chuyên môn được giải thích ý nghĩa trong phạm vi điều đó. Node nguồn là điều/khoản, node đích là thuật ngữ pháp lý. | Điều 4 Luật Đất đai 2013 (Article) HAS_TERM Giấy chứng nhận quyền sử dụng đất (Term) |
| 165 | HAS_BODY | Quan hệ liên kết một điều luật với nội dung quy định cụ thể chứa các quy phạm. Node nguồn là điều luật, node đích là khối văn bản quy định. | Điều 3 Luật Hôn nhân (Article) HAS_BODY Quy định về kết hôn (BodyText) |
| 166 | DEFINED_IN | Quan hệ ngược chỉ định khái niệm pháp lý được quy định tại văn bản hoặc điều khoản cụ thể. Node nguồn là khái niệm, node đích là văn bản hoặc điều luật. | Công ty trách nhiệm hữu hạn (LegalConcept) DEFINED_IN Luật Doanh nghiệp 2020 (Law) |
| 167 | TRIGGERS | Quan hệ chỉ hành vi hoặc sự kiện này làm phát sinh hoặc kích hoạt một sự kiện pháp lý khác. | Hành vi vượt đèn đỏ (Node: Hành vi) TRIGGERS lập biên bản vi phạm (Node: Sự kiện hành chính). |
| 168 | CAUSES | Quan hệ chỉ sự kiện pháp lý này là nguyên nhân trực tiếp dẫn đến hậu quả hoặc nghĩa vụ pháp lý khác. | Tai nạn do lỗi kỹ thuật (Node: Sự kiện) CAUSES nghĩa vụ bồi thường thiệt hại (Node: Nghĩa vụ pháp lý). |
| 169 | INITIATES | Quan hệ chỉ chủ thể hoặc hành động khởi xướng một quy trình, thủ tục hoặc trạng thái pháp lý mới. | Doanh nghiệp (Node: Chủ thể) INITIATES thủ tục đăng ký nhãn hiệu (Node: Quy trình hành chính). |
| 170 | TERMINATES | Quan hệ chỉ sự kiện làm chấm dứt hiệu lực, tồn tại hoặc trạng thái của đối tượng pháp lý khác. | Quyết định tuyên bố phá sản (Node: Văn bản) TERMINATES tư cách pháp nhân (Node: Chủ thể). |
| 171 | PRECEDES | Quan hệ chỉ sự kiện nguồn xảy ra trước sự kiện đích trong trình tự thời gian pháp lý. Xác định điều kiện tiên quyết hoặc thứ tự ưu tiên giữa các sự kiện. | Sự kiện nguồn (Event) [Ký hợp đồng] PRECEDES sự kiện đích (Event) [Bàn giao hàng hóa]. |
| 172 | FOLLOWS | Quan hệ chỉ sự kiện nguồn xảy ra sau sự kiện đích trong trình tự thời gian pháp lý. Xác định hệ quả hoặc nghĩa vụ phát sinh sau một sự kiện khác. | Sự kiện nguồn (Event) [Khởi kiện] FOLLOWS sự kiện đích (Event) [Vi phạm hợp đồng]. |
| 173 | CALCULATED_BY | Quan hệ chỉ định thực thể số tiền hoặc chỉ số được xác định qua phương thức tính toán cụ thể. Thể hiện sự phụ thuộc kết quả vào công thức hoặc quy trình xử lý số liệu. | Nghĩa vụ thuế (TaxObligation) CALCULATED_BY công thức tính thuế (CalculationFormula). |
| 174 | BASED_ON_RATE | Quan hệ xác định giá trị pháp lý hình thành dựa trên tỷ lệ, thuế suất hoặc hệ số do cơ quan có thẩm quyền quy định. Đảm bảo minh bạch việc áp dụng tỷ lệ vào nghĩa vụ. | Tiền thuế giá trị gia tăng (VATLiability) BASED_ON_RATE thuế suất 10% (StatutoryTaxRate). |
| 175 | BASED_ON_AMOUNT | Quan hệ thể hiện khoản phải thu hoặc phải trả xác lập dựa trên số tiền gốc hoặc giá trị tài sản cụ thể. Làm rõ căn cứ số học của nghĩa vụ tài chính. | Thuế thu nhập (IncomeTax) BASED_ON_AMOUNT thu nhập chịu thuế (TaxableIncome). |
| 176 | MULTIPLIED_BY | Quan hệ biểu thị giá trị pháp lý được nhân với hệ số để ra kết quả cuối hoặc điều chỉnh nghĩa vụ. Thường dùng tính phạt tăng nặng hoặc quy đổi đơn vị. | Số tiền phạt chậm nộp (OverduePenalty) MULTIPLIED_BY hệ số điều chỉnh (AdjustmentFactor). |
| 177 | REDUCED_BY | Quan hệ chỉ việc một giá trị, nghĩa vụ hoặc số tiền bị giảm đi do tác động của yếu tố khấu trừ, miễn giảm hoặc bù trừ theo quy định pháp luật. | Nghĩa vụ thuế (TaxObligation) REDUCED_BY Khoản khấu trừ gia cảnh (PersonalDeduction) theo Điều 9 Luật Thuế thu nhập cá nhân. |
| 178 | LOCATED_IN | Quan hệ chỉ thực thể pháp lý hoặc vật lý tồn tại trong một đơn vị hành chính hoặc địa điểm cụ thể. Dùng xác định nơi cư trú, đặt trụ sở hoặc vị trí tài sản theo pháp luật. | Công ty TNHH X (Node: Organization) located_in TP. Hồ Chí Minh (Node: AdministrativeArea) |
| 179 | HAS_JURISDICTION | Quan hệ chỉ cơ quan nhà nước hoặc tòa án có thẩm quyền xét xử hoặc quản lý trên một vùng lãnh thổ hoặc đối tượng. | Tòa án Tối cao (Cơ quan tư pháp) has_jurisdiction Lãnh thổ Quốc gia (Quốc gia) |
| 180 | UNDER_AUTHORITY_OF | Quan hệ thể hiện tổ chức hoặc cá nhân chịu sự quản lý, giám sát trực tiếp từ cơ quan cấp trên theo pháp luật. | Chi cục Thuế Quận (Cơ quan cấp dưới) under_authority_of Cục Thuế Tỉnh (Cơ quan cấp trên) |
| 181 | APPLIES_IN_REGION | Quan hệ chỉ quy định pháp luật hoặc chính sách có hiệu lực thi hành trên một khu vực địa lý xác định. | Luật Đất đai 2024 (Văn bản luật) applies_in_region Việt Nam (Quốc gia) |
| 182 | BELONGS_TO_INDUSTRY | Quan hệ phân loại thực thể kinh tế thuộc về một ngành công nghiệp cụ thể. Node nguồn được xác định là thành phần của ngành tại node đích theo quy định pháp lý. | Công ty TNHH XYZ (Company) thuộc lĩnh vực viễn thông (Industry) theo Giấy chứng nhận đăng ký doanh nghiệp. |
| 183 | REGULATES_INDUSTRY | Quan hệ thể hiện cơ quan có thẩm quyền hoặc văn bản luật thiết lập quy tắc quản lý đối với một ngành công nghiệp. Node nguồn thực thi chức năng kiểm soát node đích. | Ủy ban Chứng khoán Nhà nước (Regulator) quản lý ngành chứng khoán (Industry) theo Luật Chứng khoán 2019. |
| 184 | COMPLIES_WITH | Quan hệ chỉ định thực thể phải tuân thủ quy định pháp lý hoặc tiêu chuẩn bắt buộc theo luật định. | Doanh nghiệp viễn thông (nguồn) COMPLIES_WITH Nghị định 49/2017/NĐ-CP (đích). |
| 185 | NON_COMPLIANT_WITH | Quan hệ chỉ việc chủ thể không tuân thủ hoặc vi phạm quy định, tiêu chuẩn pháp lý bắt buộc. Node nguồn là bên vi phạm, node đích là quy định bị vi phạm. | Xí nghiệp sản xuất (Facility) không tuân thủ Luật Bảo vệ Môi trường 2020 (Law) về xả thải. |
| 186 | SATISFIES | Quan hệ chỉ việc tài liệu, sản phẩm hoặc hành động thỏa mãn điều kiện, yêu cầu hoặc tiêu chí pháp lý đặt ra. Node nguồn là đối tượng đánh giá, node đích là yêu cầu cần thỏa mãn. | Hồ sơ đấu thầu (BidDocument) thỏa mãn Yêu cầu về năng lực kỹ thuật (Requirement) trong hồ sơ mời thầu. |
| 187 | FAILS | Quan hệ chỉ việc thực thể, hồ sơ hoặc kết quả kiểm tra không đạt hoặc thất bại trong việc đáp ứng tiêu chuẩn, bài kiểm định pháp lý. Node nguồn là đối tượng kiểm tra, node đích là tiêu chuẩn hoặc bài kiểm tra. | Lô hàng nhập khẩu (ProductBatch) không đạt Kiểm định chất lượng (Certification) của cơ quan hải quan. |
| 188 | CREATED_BY | Quan hệ chỉ thực thể đã khởi tạo hoặc ban hành một đối tượng pháp lý. Thể hiện nguồn gốc và thẩm quyền tạo lập. | (Văn bản luật) CREATED_BY (Quốc hội) |
| 189 | UPDATED_BY | Quan hệ chỉ thực thể đã sửa đổi hoặc cập nhật nội dung đối tượng pháp lý hiện hành. Thể hiện dấu vết thay đổi và thẩm quyền cập nhật. | (Nghị định) UPDATED_BY (Chính phủ) |
| 190 | INVALIDATED_BY | Quan hệ chỉ văn bản hoặc hành động làm mất hiệu lực của đối tượng pháp lý khác. Thể hiện sự chấm dứt hiệu lực hoặc thay thế. | (Luật cũ) INVALIDATED_BY (Luật mới) |
| 191 | SUPPORTED_BY | Quan hệ chỉ rằng một yêu cầu hoặc luận điểm pháp lý được hỗ trợ bởi tài liệu hoặc bằng chứng liên quan. | [Yêu cầu bồi thường] SUPPORTED_BY [Hóa đơn thiệt hại] |
| 192 | PROVEN_BY | Quan hệ chỉ rằng một sự kiện hoặc cáo buộc pháp lý được chứng minh thỏa mãn tiêu chuẩn chứng cứ theo luật định. | [Tội danh lừa đảo] PROVEN_BY [Biên bản điều tra] |
| 193 | DOCUMENTED_BY | Quan hệ chỉ rằng một nghĩa vụ, quy trình hoặc quy định được ghi nhận rõ ràng trong văn bản pháp quy hoặc hợp đồng. | [Nghĩa vụ khai thuế] DOCUMENTED_BY [Thông tư 80/2021/TT-BTC] |
| 194 | VERIFIED_BY | Quan hệ chỉ rằng một thông tin hoặc chứng nhận được xác minh tính xác thực bởi cơ quan hoặc bên có thẩm quyền. | [Chứng nhận đăng ký doanh nghiệp] VERIFIED_BY [Cơ quan đăng ký kinh doanh] |
| 195 | RESULTS_IN | Quyết định tạo ra hệ quả pháp lý hoặc trạng thái mới. Thể hiện mối quan hệ nhân quả giữa một quyết định và kết quả của nó. | Quyết định hành chính (nguồn) RESULTS_IN Giấy phép kinh doanh (đích) |
| 196 | BASED_ON | Quyết định được xây dựng dựa trên căn cứ pháp lý hoặc sự kiện đã có. Thể hiện nguồn gốc pháp lý của quyết định. | Quyết định xử phạt (nguồn) BASED_ON Biên bản vi phạm (đích) |
| 197 | DENIES | Quyết định từ chối hoặc bác bỏ một yêu cầu, quyền lợi hoặc đề xuất. Thể hiện sự phủ nhận bằng văn bản có thẩm quyền. | Quyết định giải quyết khiếu nại (nguồn) DENIES Yêu cầu bồi thường (đích) |
| 198 | ANNULS | Quyết định hủy bỏ hiệu lực của một văn bản hoặc quyết định khác. Thể hiện tính vô hiệu hóa về mặt pháp lý. | Quyết định của cấp trên (nguồn) ANNULS Quyết định cấp dưới (đích) |
| 199 | UPHOLDS | Quan hệ thể hiện việc một quyết định pháp lý xác nhận, giữ nguyên hoặc bảo vệ hiệu lực của một quyết định, phán quyết hoặc quy định khác. Node nguồn là Decision cấp trên hoặc sau, node đích là Decision hoặc Regulation được duy trì. | Tòa án phúc thẩm (Decision) giữ nguyên bản án sơ thẩm (Decision) vì không phát hiện sai sót thủ tục. |
| 200 | BASED_ON_PRINCIPLE | Quan hệ chỉ việc một quy định hoặc văn bản pháp luật được xây dựng dựa trên một nguyên tắc pháp lý nền tảng. Thể hiện sự kế thừa tư tưởng lập pháp. | Điều 3 Luật Ban hành văn bản quy phạm pháp luật (LegalDocument) dựa trên nguyên tắc pháp chế xã hội chủ nghĩa (Principle) |
| 201 | SERVES_PURPOSE | Quan hệ chỉ việc một hành vi, biện pháp hoặc quy định pháp lý nhằm phục vụ và thực hiện một nguyên tắc pháp luật. Thể hiện mục tiêu điều chỉnh của quy phạm. | Biện pháp xử phạt vi phạm hành chính (Measure) phục vụ mục đích răn đe và giáo dục (Principle) |
| 202 | INTERPRETED_AS | Quan hệ chỉ việc một quy định cụ thể được cơ quan có thẩm quyền diễn giải hoặc xem như một nguyên tắc pháp lý. Thể hiện sự khái quát hóa từ quy phạm sang nguyên tắc. | Quy định về quyền bình đẳng trước pháp luật (Provision) được diễn giải là nguyên tắc không phân biệt đối xử (Principle) |

