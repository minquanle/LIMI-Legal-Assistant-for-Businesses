import { BookOpen, Search, FileText, Share2, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Tìm kiếm văn bản",
    desc: "Sử dụng ô tìm kiếm trên trang chủ hoặc trang Tra cứu để nhập số hiệu, trích yếu, hoặc nội dung văn bản. Hệ thống tìm kiếm toàn văn trong hơn 158.000 văn bản.",
  },
  {
    icon: FileText,
    title: "Xem nội dung chi tiết",
    desc: "Nhấp vào kết quả tìm kiếm để xem toàn bộ nội dung văn bản. Mục lục bên trái giúp bạn điều hướng nhanh đến các Phần, Chương, Điều cụ thể.",
  },
  {
    icon: Share2,
    title: "Tra cứu lược đồ liên kết",
    desc: "Tab 'Lược đồ liên kết' hiển thị các văn bản có quan hệ với văn bản hiện tại: văn bản căn cứ, văn bản hướng dẫn, văn bản sửa đổi, thay thế.",
  },
];

const features = [
  { title: "Bộ lọc thông minh", desc: "Lọc theo loại văn bản, cơ quan ban hành, tình trạng hiệu lực, năm ban hành." },
  { title: "Dữ liệu phong phú", desc: "Hơn 158.000 văn bản từ năm 1945 đến nay, đa dạng loại văn bản." },
  { title: "Giao diện thân thiện", desc: "Tối ưu cho mọi thiết bị, dễ dàng tra cứu và theo dõi." },
  { title: "Hoàn toàn miễn phí", desc: "Dữ liệu pháp luật được công khai, không mất phí tra cứu." },
];

export default function HuongDanPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-10">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Hướng dẫn sử dụng</h1>
        <p className="text-slate-500 text-sm max-w-2xl">
          Hướng dẫn chi tiết cách tra cứu và sử dụng hệ thống văn bản pháp luật Việt Nam.
        </p>
      </div>

      {/* Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {steps.map((step, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 relative">
            <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-blue-700 text-white text-sm font-bold flex items-center justify-center shadow-md">
              {i + 1}
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-4 mt-2">
              <step.icon className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">{step.title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
          </div>
        ))}
      </div>

      {/* Features */}
      <h2 className="text-xl font-bold text-slate-900 mb-5">Tính năng nổi bật</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        {features.map((f) => (
          <div key={f.title} className="bg-white rounded-xl border border-slate-200 p-5 flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-700 mt-2 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-slate-900 text-sm mb-1">{f.title}</h3>
              <p className="text-xs text-slate-500">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 rounded-xl p-8 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Bắt đầu tra cứu ngay</h2>
        <p className="text-white/70 text-sm mb-5">Nhập từ khóa để tìm kiếm văn bản pháp luật</p>
        <a
          href="/search"
          className="inline-flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-blue-900 font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          Tra cứu ngay <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
