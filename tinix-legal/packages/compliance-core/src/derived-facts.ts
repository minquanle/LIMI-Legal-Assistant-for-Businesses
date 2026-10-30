// Trường "kết luận pháp lý" (vd. vatFilingRequired) do engine tự suy ra từ các trường quan sát được,
// thay vì hỏi doanh nghiệp. Mỗi quy tắc là nội dung pháp lý: chỉ thêm vào đây sau khi chuyên gia
// đã đối chiếu căn cứ và duyệt. Đổi danh sách này phải tăng ENGINE_VERSION.
// Đề xuất chờ duyệt nằm ở outputs/DERIVED_FACTS_DE_XUAT_20261021.md, không nằm trong code.
export type DerivedFactRule={fact:string,rule:unknown,citation:string,approvedBy:string,approvedAt:string};
export const APPROVED_DERIVED_FACTS:DerivedFactRule[]=[];
