import type { AboutContent } from "./types";

export const aboutContentVi: AboutContent = {
  hero: {
    eyebrow: "Về StayHub",
    title: "Hệ sinh thái đặt tour thông minh",
    subtitle:
      "Nền tảng du lịch tích hợp tour, thanh toán, mạng xã hội và trợ lý AI — xây dựng trên kiến trúc microservices.",
    exploreTours: "Khám phá tour",
    stats: [
      { value: "10+", label: "Microservices" },
      { value: "5", label: "Developers" },
      { value: "1", label: "Mentor" },
    ],
  },
  system: {
    summary:
      "StayHub là đồ án tốt nghiệp hướng tới trải nghiệm đặt tour trọn vẹn — kết hợp web, mobile và backend phân tách theo domain, phục vụ cả khách hàng lẫn admin, staff và đối tác.",
  },
  features: {
    title: "Tính năng chính",
    items: [
      { title: "Đặt tour & thanh toán", description: "Đặt chỗ, voucher, thanh toán và quản lý đơn." },
      { title: "Trợ lý AI", description: "Gợi ý tour, thời tiết và lập lịch trình." },
      { title: "Social du lịch", description: "Khoảnh khắc, chat và theo dõi hành trình." },
      { title: "Quản trị đa vai trò", description: "Dashboard cho admin, staff và đối tác." },
      { title: "Microservices", description: "Backend .NET phân tách, kết nối qua Gateway." },
      { title: "Mobile app", description: "Ứng dụng Flutter đồng bộ với web." },
    ],
  },
  people: {
    mentorSection: {
      eyebrow: "Mentor",
      title: "Người hướng dẫn dự án",
      subtitle: "Giảng viên định hướng chuyên môn, kiến trúc và quy trình phát triển.",
      badge: "Mentor",
      member: {
        id: "mentor",
        name: "Thầy Võ Hoàng Tú",
        role: "Giảng viên hướng dẫn",
        summary:
          "Định hướng kiến trúc, review code và góp ý nghiệp vụ — giúp nhóm xây dựng sản phẩm bài bản, không chỉ dừng ở mức demo.",
        highlights: ["Kiến trúc hệ thống", "Code review", "Làm việc nhóm"],
      },
    },
    teamSection: {
      eyebrow: "Đội ngũ",
      title: "Thành viên phát triển",
      subtitle: "5 thành viên full-stack phụ trách backend và frontend của StayHub.",
      members: [
      {
        id: "bui-minh-nhut",
        name: "Bùi Minh Nhựt",
        role: "Full-stack Developer",
        summary: "Thiết kế API, luồng nghiệp vụ và các trang quản trị React.",
        highlights: ["Backend API", "React / TS"],
      },
      {
        id: "ly-thi-kieu-thy",
        name: "Lý Thị Kiều Thy",
        role: "Full-stack Developer",
        summary: "Giao diện người dùng, tích hợp API và responsive layout.",
        highlights: ["UI/UX", "Frontend"],
      },
      {
        id: "pham-thanh-tu",
        name: "Phạm Thanh Tú",
        role: "Full-stack Developer",
        summary: "Module tour, lịch trình, đặt chỗ và debug cross-service.",
        highlights: ["Microservices", "Database"],
      },
      {
        id: "pham-vu-thanh-nguyen",
        name: "Phạm Vũ Thành Nguyên",
        role: "Full-stack Developer",
        summary: "Xác thực, real-time (chat, thông báo) và state management.",
        highlights: ["Auth", "SignalR"],
      },
      {
        id: "mai-phuong-tuong",
        name: "Mai Phương Tường",
        role: "Full-stack Developer",
        summary: "Nội dung, voucher, form phức tạp và kiểm thử luồng nghiệp vụ.",
        highlights: ["Content", "QA"],
      },
      ],
    },
  },
  tech: {
    title: "Công nghệ",
    groups: [
      { label: "Frontend", items: ["React", "TypeScript", "Vite", "TailwindCSS"] },
      { label: "Backend", items: [".NET", "Microservices", "SignalR", "EF Core"] },
      { label: "Mobile", items: ["Flutter", "Dart"] },
      { label: "Khác", items: ["AI Assistant", "Docker", "REST API"] },
    ],
  },
  cta: {
    title: "Sẵn sàng khám phá?",
    browseTours: "Xem tour",
    aiAssistant: "Trợ lý AI",
  },
  card: {
    addPhoto: "Thêm ảnh",
  },
};
