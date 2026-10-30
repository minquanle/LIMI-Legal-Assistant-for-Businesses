export const CHECKLIST_PROFILE_FACTS = [
  {
    "key": "operationsStartedDate",
    "label": "Ngày bắt đầu hoạt động",
    "group": "Lao động",
    "kind": "date",
    "options": null,
    "help": "",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "hasBonusScheme",
    "label": "Có chế độ thưởng",
    "group": "Lao động",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "salaryPaymentDate",
    "label": "Ngày của đợt trả lương đang kiểm tra",
    "group": "Lao động",
    "kind": "date",
    "options": null,
    "help": "Kiểm tra tất cả lần trả lương trong ngày này; đổi ngày để kiểm tra đợt mới.",
    "tier": "PERIOD",
    "deprecated": false
  },
  {
    "key": "hasOrdinaryHealthExamWorkers",
    "label": "Có nhóm lao động khám sức khỏe hằng năm",
    "group": "An toàn lao động",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "hasSpecialHealthExamWorkers",
    "label": "Có nhóm lao động phải khám tối thiểu sáu tháng một lần",
    "group": "An toàn lao động",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Nhóm công việc nặng nhọc/độc hại/nguy hiểm, lao động khuyết tật, chưa thành niên, cao tuổi; cần chuyên gia xác nhận phân loại.",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "lastSpecialHealthExamDate",
    "label": "Ngày khám gần nhất của nhóm đặc thù đến hạn sớm nhất",
    "group": "An toàn lao động",
    "kind": "date",
    "options": null,
    "help": "Không dùng ngày khám mới nhất của cả doanh nghiệp nếu còn người khám sớm hơn. Rà soát hồ sơ từng người ở hệ thống nhân sự.",
    "tier": "PERIOD",
    "deprecated": false
  },
  {
    "key": "hasHazardousWork",
    "label": "Có công việc tiếp xúc yếu tố nguy hiểm hoặc có hại",
    "group": "An toàn lao động",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "accountingBooksOpeningDate",
    "label": "Ngày đầu kỳ kế toán / thành lập cần mở sổ",
    "group": "Kế toán",
    "kind": "date",
    "options": null,
    "help": "",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "accountingFiscalYearEndDate",
    "label": "Ngày kết thúc kỳ kế toán năm đang kiểm tra",
    "group": "Kế toán",
    "kind": "date",
    "options": null,
    "help": "",
    "tier": "PERIOD",
    "deprecated": true
  },
  {
    "key": "fiscalYearEnd",
    "label": "Kỳ kế toán năm kết thúc vào ngày",
    "group": "Kế toán",
    "kind": "enum",
    "options": [
      [
        "12-31",
        "31/12"
      ],
      [
        "03-31",
        "31/03"
      ],
      [
        "06-30",
        "30/06"
      ],
      [
        "09-30",
        "30/09"
      ]
    ],
    "help": "Kỳ kế toán năm gồm 12 tháng; nếu doanh nghiệp không áp dụng kỳ khác thì theo năm dương lịch (31/12). Chỉ nhập một lần, hệ thống tự tính từng năm.",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "companyForm",
    "label": "Loại hình pháp lý đã xác nhận",
    "group": "Doanh nghiệp",
    "kind": "enum",
    "options": [
      [
        "LLC_MULTI",
        "TNHH hai thành viên trở lên"
      ],
      [
        "JSC",
        "Công ty cổ phần"
      ],
      [
        "OTHER",
        "Loại khác"
      ]
    ],
    "help": "",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "companyRegistrationDate",
    "label": "Ngày cấp giấy chứng nhận đăng ký doanh nghiệp lần đầu",
    "group": "Doanh nghiệp",
    "kind": "date",
    "options": null,
    "help": "",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "handlesConsumerTransactions",
    "label": "Giao dịch với người tiêu dùng",
    "group": "Người tiêu dùng",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Người mua sử dụng cho mục đích tiêu dùng, sinh hoạt và không vì mục đích thương mại; không suy ra chỉ từ kênh bán.",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "collectsConsumerData",
    "label": "Thu thập thông tin người tiêu dùng",
    "group": "Người tiêu dùng",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "usesConsumerContracts",
    "label": "Sử dụng hợp đồng giao dịch với người tiêu dùng",
    "group": "Người tiêu dùng",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "socialInsuranceSubject",
    "label": "Có nghĩa vụ đóng BHXH bắt buộc trong kỳ",
    "group": "BHXH",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Xác nhận đối tượng theo Điều 2 Luật BHXH; không suy ra từ số nhân viên.",
    "tier": "LEGAL_CONCLUSION",
    "deprecated": false
  },
  {
    "key": "socialInsurancePaymentMethod",
    "label": "Phương thức đóng BHXH đã xác nhận",
    "group": "BHXH",
    "kind": "enum",
    "options": [
      [
        "monthly",
        "Hằng tháng"
      ],
      [
        "quarterly",
        "Ba tháng"
      ],
      [
        "semiannual",
        "Sáu tháng"
      ]
    ],
    "help": "",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "socialInsuranceMonthlyExemption",
    "label": "Có trường hợp không phải đóng trong kỳ này",
    "group": "BHXH",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Mục tổng hợp chỉ chạy khi xác nhận không có ngoại lệ của khoản 5 Điều 33; có ngoại lệ cần chuyên gia xét từng người.",
    "tier": "LEGAL_CONCLUSION",
    "deprecated": false
  },
  {
    "key": "socialInsuranceContributionPeriodEndDate",
    "label": "Ngày cuối tháng BHXH đang kiểm tra",
    "group": "BHXH",
    "kind": "date",
    "options": null,
    "help": "Đổi kỳ phải xác nhận lại đối tượng, phương thức và ngoại lệ của kỳ mới.",
    "tier": "PERIOD",
    "deprecated": true
  },
  {
    "key": "vatFilingRequired",
    "label": "Phải nộp hồ sơ khai GTGT trong kỳ",
    "group": "Thuế GTGT",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Kế toán xác nhận nghĩa vụ và trường hợp miễn/không phải nộp của kỳ cụ thể; không tự suy ra từ doanh thu.",
    "tier": "LEGAL_CONCLUSION",
    "deprecated": false
  },
  {
    "key": "vatFilingFrequency",
    "label": "Kỳ khai GTGT được xác nhận",
    "group": "Thuế GTGT",
    "kind": "enum",
    "options": [
      [
        "monthly",
        "Theo tháng"
      ],
      [
        "quarterly",
        "Theo quý"
      ],
      [
        "OTHER",
        "Trường hợp khác"
      ]
    ],
    "help": "",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "vatMonthlyPeriodEndDate",
    "label": "Ngày cuối tháng khai GTGT đang kiểm tra",
    "group": "Thuế GTGT",
    "kind": "date",
    "options": null,
    "help": "",
    "tier": "PERIOD",
    "deprecated": true
  },
  {
    "key": "vatQuarterPeriodEndDate",
    "label": "Ngày cuối quý khai GTGT đang kiểm tra",
    "group": "Thuế GTGT",
    "kind": "date",
    "options": null,
    "help": "Xác nhận quý theo lịch hoặc năm tài chính áp dụng; không dùng ngày kết thúc quý tự đoán.",
    "tier": "PERIOD",
    "deprecated": true
  },
  {
    "key": "hasProbation",
    "label": "Có sử dụng lao động thử việc",
    "group": "Lao động",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "hasContractAmendments",
    "label": "Có quy trình sửa đổi hợp đồng lao động",
    "group": "Lao động",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "hasTemporaryJobTransfers",
    "label": "Có tạm chuyển sang công việc khác hợp đồng",
    "group": "Lao động",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "hasOvertime",
    "label": "Có làm thêm giờ",
    "group": "Lao động",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "hasNightWork",
    "label": "Có làm việc ban đêm",
    "group": "Lao động",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "usesSalaryDeductions",
    "label": "Có khấu trừ lương để bồi thường thiệt hại tài sản",
    "group": "Lao động",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Khác với trích BHXH/thuế. Cần kiểm tra căn cứ bồi thường và giới hạn khấu trừ.",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "hasProductionBusinessBase",
    "label": "Có cơ sở sản xuất, kinh doanh cần quản lý ATVSLĐ",
    "group": "An toàn lao động",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "inKindAllowanceEligibilityConfirmed",
    "label": "Có người thuộc diện bồi dưỡng bằng hiện vật đã được xác nhận",
    "group": "An toàn lao động",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chuyên gia xác nhận điều kiện theo quy định hướng dẫn; không tự suy ra chỉ từ tên công việc hoặc nhãn có nguy cơ.",
    "tier": "LEGAL_CONCLUSION",
    "deprecated": false
  },
  {
    "key": "usesElectronicAccountingDocuments",
    "label": "Có sử dụng chứng từ kế toán điện tử",
    "group": "Kế toán",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "hasAccountingStaffChange",
    "label": "Có thay đổi người làm kế toán",
    "group": "Kế toán",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "annualFinancialSubmissionCase",
    "label": "Chế độ hạn nộp BCTC năm đã được kế toán xác nhận",
    "group": "Kế toán",
    "kind": "enum",
    "options": [
      [
        "standard90",
        "Hạn 90 ngày, không có quy định riêng ngắn hơn"
      ],
      [
        "OTHER",
        "Trường hợp khác / cần chuyên gia tính riêng"
      ]
    ],
    "help": "Các quy định chi tiết hoặc chuyên ngành có thể có hạn khác; mục 90 ngày chỉ áp dụng khi kế toán xác nhận đúng trường hợp.",
    "tier": "LEGAL_CONCLUSION",
    "deprecated": false
  },
  {
    "key": "annualFinancialDisclosureCase",
    "label": "Chế độ hạn công khai BCTC năm đã được xác nhận",
    "group": "Kế toán",
    "kind": "enum",
    "options": [
      [
        "standard120",
        "Hạn 120 ngày của đơn vị kinh doanh"
      ],
      [
        "OTHER",
        "Chứng khoán/tín dụng/bảo hiểm hoặc trường hợp khác"
      ]
    ],
    "help": "",
    "tier": "LEGAL_CONCLUSION",
    "deprecated": false
  },
  {
    "key": "usesBusinessSeal",
    "label": "Có sử dụng dấu doanh nghiệp / chữ ký số như dấu",
    "group": "Doanh nghiệp",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "businessConditionsRequired",
    "label": "Có ngành nghề kinh doanh có điều kiện đã được xác nhận",
    "group": "Doanh nghiệp",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "",
    "tier": "LEGAL_CONCLUSION",
    "deprecated": false
  },
  {
    "key": "capitalContributionDeadlineCase",
    "label": "Trường hợp góp vốn ban đầu đã được xác nhận",
    "group": "Doanh nghiệp",
    "kind": "enum",
    "options": [
      [
        "standard90",
        "90 ngày, không có thời gian loại trừ hoặc hạn ngắn hơn"
      ],
      [
        "OTHER",
        "Có thời gian loại trừ, hạn ngắn hơn hoặc tình huống khác"
      ]
    ],
    "help": "Nhánh đơn giản của TNHH nhiều thành viên / cổ phần. Không tự tính khi nhập khẩu, chuyển quyền sở hữu tài sản hoặc điều lệ/hợp đồng quy định hạn ngắn hơn.",
    "tier": "LEGAL_CONCLUSION",
    "deprecated": false
  },
  {
    "key": "hasConsumerWarranty",
    "label": "Có sản phẩm được bảo hành theo thỏa thuận hoặc bắt buộc",
    "group": "Người tiêu dùng",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "isMicroEnterprise",
    "label": "Là doanh nghiệp siêu nhỏ theo tiêu chí pháp luật đã xác nhận",
    "group": "Người tiêu dùng",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Không tự suy ra từ riêng số nhân viên; dùng để xét ngoại lệ công khai quy trình khiếu nại.",
    "tier": "LEGAL_CONCLUSION",
    "deprecated": false
  },
  {
    "key": "usesStandardConsumerContracts",
    "label": "Có sử dụng hợp đồng theo mẫu với người tiêu dùng",
    "group": "Người tiêu dùng",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "hasRemoteConsumerTransactions",
    "label": "Có giao dịch từ xa với người tiêu dùng",
    "group": "Người tiêu dùng",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "providesContinuousConsumerServices",
    "label": "Có cung cấp dịch vụ liên tục cho người tiêu dùng",
    "group": "Người tiêu dùng",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "sellsConsumerGoods",
    "label": "Có bán/cung cấp sản phẩm, hàng hóa cho người tiêu dùng",
    "group": "Người tiêu dùng",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "electronicInvoiceRequired",
    "label": "Thuộc diện phải lập hóa đơn điện tử đã được xác nhận",
    "group": "Thuế – hóa đơn",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "",
    "tier": "LEGAL_CONCLUSION",
    "deprecated": false
  },
  {
    "key": "hasTaxFilingObligations",
    "label": "Có nghĩa vụ lập hồ sơ khai thuế đã được xác nhận",
    "group": "Thuế – hóa đơn",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "",
    "tier": "LEGAL_CONCLUSION",
    "deprecated": false
  },
  {
    "key": "socialInsuranceEmployerRegistrationRequired",
    "label": "Có người thuộc diện doanh nghiệp phải nộp hồ sơ tham gia BHXH",
    "group": "BHXH",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "",
    "tier": "LEGAL_CONCLUSION",
    "deprecated": false
  },
  {
    "key": "socialInsuranceCoverageStartDate",
    "label": "Ngày thuộc diện BHXH của nhóm chưa đăng ký đến hạn sớm nhất",
    "group": "BHXH",
    "kind": "date",
    "options": null,
    "help": "Ngày từng người thuộc diện, không mặc định là ngày bắt đầu hợp đồng. Tự theo dõi từng người trong hồ sơ nhân sự; không lấy ngày muộn nhất để bỏ qua người đã đến hạn.",
    "tier": "PERIOD",
    "deprecated": false
  },
  {
    "key": "processesPersonalData",
    "label": "Có xử lý dữ liệu cá nhân",
    "group": "Dữ liệu cá nhân",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "personalDataImpactFilingRequired",
    "label": "Thuộc diện phải gửi hồ sơ đánh giá tác động xử lý dữ liệu",
    "group": "Dữ liệu cá nhân",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "LEGAL_CONCLUSION",
    "deprecated": false
  },
  {
    "key": "crossBorderImpactFilingRequired",
    "label": "Thuộc diện phải gửi hồ sơ chuyển dữ liệu xuyên biên giới",
    "group": "Dữ liệu cá nhân",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "LEGAL_CONCLUSION",
    "deprecated": false
  },
  {
    "key": "processesChildData",
    "label": "Có xử lý dữ liệu trẻ em hoặc người cần bảo vệ đặc biệt",
    "group": "Dữ liệu cá nhân",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "usesCloudPersonalData",
    "label": "Có xử lý dữ liệu cá nhân trên đám mây",
    "group": "Dữ liệu cá nhân",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "hasBusinessPremises",
    "label": "Có cơ sở kinh doanh thuộc phạm vi quản lý PCCC đã xác nhận",
    "group": "PCCC",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "LEGAL_CONCLUSION",
    "deprecated": false
  },
  {
    "key": "fireDesignApprovalRequired",
    "label": "Có công trình thuộc diện thẩm định và nghiệm thu PCCC",
    "group": "PCCC",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "LEGAL_CONCLUSION",
    "deprecated": false
  },
  {
    "key": "mandatoryFireInsuranceRequired",
    "label": "Có cơ sở thuộc diện bảo hiểm cháy nổ bắt buộc",
    "group": "PCCC",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "LEGAL_CONCLUSION",
    "deprecated": false
  },
  {
    "key": "fireAlarmConnectionRequired",
    "label": "Thuộc diện trang bị, kết nối truyền tin báo cháy",
    "group": "PCCC",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "LEGAL_CONCLUSION",
    "deprecated": false
  },
  {
    "key": "generatesBusinessWaste",
    "label": "Có phát sinh chất thải tại cơ sở kinh doanh",
    "group": "Môi trường",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "generatesIndustrialWaste",
    "label": "Có phát sinh chất thải rắn công nghiệp thông thường",
    "group": "Môi trường",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "generatesHazardousWaste",
    "label": "Có phát sinh chất thải nguy hại đã được phân định",
    "group": "Môi trường",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "dischargesWastewater",
    "label": "Có phát sinh nước thải cần quản lý",
    "group": "Môi trường",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "emitsAirPollutants",
    "label": "Có phát sinh bụi, khí thải cần quản lý",
    "group": "Môi trường",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "environmentalImpactAssessmentRequired",
    "label": "Có dự án thuộc diện đánh giá tác động môi trường",
    "group": "Môi trường",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "LEGAL_CONCLUSION",
    "deprecated": false
  },
  {
    "key": "environmentalPermitRequired",
    "label": "Có dự án/cơ sở thuộc diện giấy phép môi trường",
    "group": "Môi trường",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "LEGAL_CONCLUSION",
    "deprecated": false
  },
  {
    "key": "environmentalRegistrationRequired",
    "label": "Có dự án/cơ sở thuộc diện đăng ký môi trường",
    "group": "Môi trường",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "LEGAL_CONCLUSION",
    "deprecated": false
  },
  {
    "key": "eprRecyclingRequired",
    "label": "Thuộc diện trách nhiệm tái chế sản phẩm, bao bì",
    "group": "Môi trường",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "LEGAL_CONCLUSION",
    "deprecated": false
  },
  {
    "key": "producesFood",
    "label": "Có sản xuất thực phẩm",
    "group": "Thực phẩm",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "tradesFood",
    "label": "Có kinh doanh thực phẩm",
    "group": "Thực phẩm",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "providesFoodServices",
    "label": "Có cơ sở dịch vụ ăn uống",
    "group": "Thực phẩm",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "foodSelfDeclarationRequired",
    "label": "Có sản phẩm thuộc diện tự công bố",
    "group": "Thực phẩm",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "LEGAL_CONCLUSION",
    "deprecated": false
  },
  {
    "key": "foodProductRegistrationRequired",
    "label": "Có sản phẩm thuộc diện đăng ký bản công bố",
    "group": "Thực phẩm",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "LEGAL_CONCLUSION",
    "deprecated": false
  },
  {
    "key": "foodCertificateRequired",
    "label": "Có cơ sở thuộc diện giấy chứng nhận ATTP",
    "group": "Thực phẩm",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "LEGAL_CONCLUSION",
    "deprecated": false
  },
  {
    "key": "importsFood",
    "label": "Có nhập khẩu thực phẩm",
    "group": "Thực phẩm",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "advertisesFood",
    "label": "Có quảng cáo thực phẩm",
    "group": "Thực phẩm",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "hasForeignWorkers",
    "label": "Có sử dụng lao động nước ngoài",
    "group": "Lao động",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "hasProtectedWorkers",
    "label": "Có lao động nữ mang thai, nuôi con nhỏ hoặc nhóm cần bảo vệ",
    "group": "Lao động",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "hasMinorWorkers",
    "label": "Có sử dụng người lao động chưa thành niên",
    "group": "Lao động",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "hasLaborTermination",
    "label": "Có phát sinh chấm dứt hợp đồng lao động",
    "group": "Lao động",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "hasLaborAccident",
    "label": "Có phát sinh tai nạn lao động cần xử lý",
    "group": "An toàn lao động",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "usesStrictSafetyEquipment",
    "label": "Có máy, thiết bị thuộc danh mục yêu cầu nghiêm ngặt",
    "group": "An toàn lao động",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "healthInsuranceEmployerRequired",
    "label": "Có người thuộc diện doanh nghiệp tham gia BHYT",
    "group": "BHXH",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "LEGAL_CONCLUSION",
    "deprecated": false
  },
  {
    "key": "unemploymentInsuranceEmployerRequired",
    "label": "Có người thuộc diện doanh nghiệp tham gia BHTN",
    "group": "BHXH",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "LEGAL_CONCLUSION",
    "deprecated": false
  },
  {
    "key": "hasInsuranceBenefitApplications",
    "label": "Có hồ sơ ốm đau, thai sản của người lao động",
    "group": "BHXH",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "corporateIncomeTaxRequired",
    "label": "Thuộc diện thuế thu nhập doanh nghiệp",
    "group": "Thuế – hóa đơn",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "LEGAL_CONCLUSION",
    "deprecated": false
  },
  {
    "key": "paysPersonalIncome",
    "label": "Có chi trả thu nhập cho cá nhân cần xét khấu trừ thuế",
    "group": "Thuế – hóa đơn",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "hasRelatedPartyTransactions",
    "label": "Có giao dịch liên kết đã được xác định",
    "group": "Thuế – hóa đơn",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "LEGAL_CONCLUSION",
    "deprecated": false
  },
  {
    "key": "claimsVatDeduction",
    "label": "Có kê khai khấu trừ thuế GTGT đầu vào",
    "group": "Thuế – hóa đơn",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "claimsTaxIncentives",
    "label": "Có dự kiến áp dụng ưu đãi, miễn giảm thuế",
    "group": "Thuế – hóa đơn",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "claims2026TaxExtension",
    "label": "Có dự kiến áp dụng gia hạn thuế, tiền thuê đất năm 2026",
    "group": "Thuế – hóa đơn",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "hasTaxRegistrationChanges",
    "label": "Có phát sinh thay đổi thông tin đăng ký thuế",
    "group": "Thuế – hóa đơn",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "hasInvoiceErrors",
    "label": "Có hóa đơn điện tử sai sót cần xử lý",
    "group": "Thuế – hóa đơn",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "hasCompanyRegistrationChanges",
    "label": "Có phát sinh thay đổi nội dung đăng ký doanh nghiệp",
    "group": "Doanh nghiệp",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "hasBeneficialOwners",
    "label": "Thuộc diện kê khai chủ sở hữu hưởng lợi đã xác nhận",
    "group": "Doanh nghiệp",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "LEGAL_CONCLUSION",
    "deprecated": false
  },
  {
    "key": "plansBusinessSuspension",
    "label": "Có dự định tạm ngừng hoặc hoạt động lại trước hạn",
    "group": "Doanh nghiệp",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "plansDissolution",
    "label": "Có dự định giải thể doanh nghiệp",
    "group": "Doanh nghiệp",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "hasInvestmentProject",
    "label": "Có dự án đầu tư cần quản lý",
    "group": "Doanh nghiệp",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "hasForeignInvestment",
    "label": "Có yếu tố đầu tư nước ngoài",
    "group": "Doanh nghiệp",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "claimsSmeSupport",
    "label": "Có dự kiến đề nghị hỗ trợ doanh nghiệp nhỏ và vừa",
    "group": "Doanh nghiệp",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "operatesEcommercePlatform",
    "label": "Có vận hành nền tảng thương mại điện tử",
    "group": "Thương mại",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "sellsOnEcommerce",
    "label": "Có bán hàng trên nền tảng thương mại điện tử",
    "group": "Thương mại",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "hasLivestreamSales",
    "label": "Có bán hàng qua livestream",
    "group": "Thương mại",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "hasAdvertising",
    "label": "Có quảng cáo hàng hóa, dịch vụ",
    "group": "Thương mại",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "usesThirdPartyIp",
    "label": "Có sử dụng tác phẩm, nhãn hiệu hoặc tài sản trí tuệ của bên khác",
    "group": "Thương mại",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "usesElectronicContracts",
    "label": "Có giao kết hợp đồng bằng phương tiện điện tử",
    "group": "Thương mại",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "consumerContractRegistrationRequired",
    "label": "Có hợp đồng theo mẫu thuộc diện phải đăng ký",
    "group": "Người tiêu dùng",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "LEGAL_CONCLUSION",
    "deprecated": false
  },
  {
    "key": "hasHungYenLandLease",
    "label": "Có thuê đất của Nhà nước tại Hưng Yên thuộc quyết định địa phương",
    "group": "Hưng Yên",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "OBSERVABLE",
    "deprecated": true
  },
  {
    "key": "hasHungYenLandProcedure",
    "label": "Có hồ sơ thủ tục đất đai tại Hưng Yên",
    "group": "Hưng Yên",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "OBSERVABLE",
    "deprecated": true
  },
  {
    "key": "hasHungYenInspection",
    "label": "Có quyết định kiểm tra đăng ký kinh doanh tại Hưng Yên",
    "group": "Hưng Yên",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "OBSERVABLE",
    "deprecated": true
  },
  {
    "key": "accountingRegime",
    "label": "Chế độ kế toán đã được kế toán xác nhận",
    "group": "Kế toán",
    "kind": "enum",
    "options": [
      [
        "TT99",
        "Thông tư 99/2025"
      ],
      [
        "TT133",
        "Thông tư 133/2016"
      ],
      [
        "TT132",
        "Thông tư 132/2018"
      ],
      [
        "OTHER",
        "Chế độ khác"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "firstPersonalDataProcessingDate",
    "label": "Ngày đầu tiên xử lý dữ liệu của hồ sơ thuộc diện gửi",
    "group": "Dữ liệu cá nhân",
    "kind": "date",
    "options": null,
    "help": "Xét chuyển tiếp, miễn/hoãn và thời điểm bắt đầu thực tế; không lấy ngày tạo tài khoản thay cho ngày phát sinh.",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "firstCrossBorderDataTransferDate",
    "label": "Ngày đầu tiên chuyển dữ liệu xuyên biên giới thuộc diện gửi",
    "group": "Dữ liệu cá nhân",
    "kind": "date",
    "options": null,
    "help": "Xét chuyển tiếp, miễn/hoãn và thời điểm bắt đầu thực tế; không lấy ngày tạo tài khoản thay cho ngày phát sinh.",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "hasNotarialTransactions",
    "label": "Có giao dịch phải công chứng hoặc đã chọn công chứng",
    "group": "Doanh nghiệp",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "hasVatReducedRateSales",
    "label": "Có hàng hóa, dịch vụ cần xét giảm thuế GTGT theo NQ 204",
    "group": "Thuế – hóa đơn",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "claimsZeroRateVat",
    "label": "Có kê khai thuế GTGT 0% thuộc diện phải có hồ sơ",
    "group": "Thuế – hóa đơn",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "foreignContractorVatWithholdingRequired",
    "label": "Có khoản thanh toán nhà thầu nước ngoài thuộc diện khấu trừ GTGT",
    "group": "Thuế – hóa đơn",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "LEGAL_CONCLUSION",
    "deprecated": false
  },
  {
    "key": "hasEmployeeRecoveryApplications",
    "label": "Có người nghỉ dưỡng sức, phục hồi sức khỏe sau ốm đau hoặc thai sản",
    "group": "BHXH",
    "kind": "enum",
    "options": [
      [
        "yes",
        "Có"
      ],
      [
        "no",
        "Không"
      ]
    ],
    "help": "Chỉ xác nhận sau khi đối chiếu tình trạng thực tế; chưa biết giữ Chưa xác định.",
    "tier": "OBSERVABLE",
    "deprecated": false
  },
  {
    "key": "internalRegulationsIssuedDate",
    "label": "Ngày ban hành bộ nội quy lao động đang cần đăng ký",
    "group": "Lao động",
    "kind": "date",
    "options": null,
    "help": "Dùng ngày ban hành của bộ nội quy đang cần đăng ký; theo dõi riêng từng bộ.",
    "tier": "PERIOD",
    "deprecated": false
  }
] as const;
export const DATE_FACT_NAMES = ["operationsStartedDate","salaryPaymentDate","lastSpecialHealthExamDate","accountingBooksOpeningDate","accountingFiscalYearEndDate","companyRegistrationDate","socialInsuranceContributionPeriodEndDate","vatMonthlyPeriodEndDate","vatQuarterPeriodEndDate","socialInsuranceCoverageStartDate","firstPersonalDataProcessingDate","firstCrossBorderDataTransferDate","internalRegulationsIssuedDate"] as const;
