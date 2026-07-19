import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ShieldCheck,
  Rocket,
  Zap,
  Sparkles,
  BookOpen,
  Layers,
  CheckCircle2,
  ArrowRight,
  Activity,
  Users,
  MapPin,
  Calendar,
  DollarSign,
  Bot,
  BarChart3,
  HelpCircle,
  Compass,
  Award,
  Briefcase,
  UserCheck,
  Star,
  ShieldAlert,
  Cpu,
  HeartHandshake,
  Eye,
  Lock,
  Globe,
  Server,
  Smartphone,
  Key,
  RefreshCw,
  QrCode,
  Ticket,
  TrendingUp,
  FileText,
  BadgePercent,
  Map,
  Image,
  Gift,
  PieChart,
  ChevronRight,
  Info
} from "lucide-react";
import { PATH } from "../config/routes/route";
import { useTranslation } from "../contexts/LocaleContext";

export type RoleType = "admin" | "partner" | "staff";

type RoleIntroProps = {
  role?: RoleType;
};

interface CapabilityCard {
  titleVi: string;
  titleEn: string;
  descVi: string;
  descEn: string;
  path: string;
  icon: React.ReactNode;
  badgeVi: string;
  badgeEn: string;
  colorClass: string;
}

interface Responsibility {
  titleVi: string;
  titleEn: string;
  descVi: string;
  descEn: string;
  icon: React.ReactNode;
}

interface WorkflowStep {
  step: string;
  titleVi: string;
  titleEn: string;
  descVi: string;
  descEn: string;
  icon: React.ReactNode;
}

export const RoleIntroDashboard: React.FC<RoleIntroProps> = ({ role: propRole }) => {
  const { t, locale } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine role based on prop or pathname
  const currentRole: RoleType =
    propRole ||
    (location.pathname.startsWith("/admin")
      ? "admin"
      : location.pathname.startsWith("/staff")
        ? "staff"
        : "partner");

  const isVi = locale === "vi";

  // Data configuration for each role - All using cohesive corporate Blue/Navy single-company theme
  const roleConfig = {
    partner: {
      titleVi: "TRUNG TÂM QUẢN LÝ & ĐIỀU HÀNH TOUR",
      titleEn: "TOUR MANAGER OPERATIONS CENTER",
      roleNameVi: "Quản lý Tour & Điều hành (Tour Manager)",
      roleNameEn: "Tour Operations Manager",
      badgeVi: "QUYỀN HẠN QUẢN LÝ CẤP CAO",
      badgeEn: "TOUR MANAGER AUTHORITY",
      gradient: "from-navy via-blue-900 to-indigo-950 dark:from-blue-950 dark:via-indigo-950 dark:to-slate-900",
      lightGradient: "from-blue-500/10 via-indigo-500/10 to-blue-600/10",
      borderAccent: "border-blue-500/30",
      heroIcon: <Briefcase className="h-10 w-10 text-white" />,
      sloganVi: "Quản lý toàn diện danh mục tour của công ty, tối ưu hóa điểm khởi hành và gia tăng hiệu suất kinh doanh.",
      sloganEn: "Manage company tour catalog, optimize schedule departures, and drive core travel business performance.",
      overviewVi:
        "Trang tổng quan Quản lý Tour (Tour Manager Dashboard) là trung tâm điều hành nội bộ của công ty. Tại đây, bộ phận Quản lý Tour có toàn quyền chủ động thiết kế và tạo mới các Tour du lịch, định giá vé theo mùa vụ, mở ngày khởi hành (Schedules), phân công nhân viên điều hành hiện trường (Tour Staff), theo dõi GPS đoàn trực tuyến và kiểm soát báo cáo doanh thu chi tiết với sự hỗ trợ của Trí tuệ nhân tạo (AI).",
      overviewEn:
        "The Tour Manager Dashboard is our company's core operational command center. Here, the Tour Management team holds full authority to design and publish travel tours, establish seasonal pricing tiers, schedule departure dates, assign on-field Tour Staff members, track live GPS group telemetry, and analyze business revenue insights empowered by AI trend prediction.",
      stats: [
        { labelVi: "Tỉ lệ sẵn sàng hệ thống", labelEn: "System Uptime", value: "99.99%", icon: <Server className="h-5 w-5 text-blue-400" /> },
        { labelVi: "Định vị GPS trực tuyến", labelEn: "Real-time GPS Tracking", value: "24/7 Live", icon: <MapPin className="h-5 w-5 text-blue-400" /> },
        { labelVi: "Dự báo AI động", labelEn: "AI Trend Engine", value: "Active", icon: <Bot className="h-5 w-5 text-indigo-400" /> },
        { labelVi: "Đồng bộ hóa dữ liệu", labelEn: "Data Sync Latency", value: "< 15ms", icon: <RefreshCw className="h-5 w-5 text-blue-400" /> }
      ],
      responsibilities: [
        {
          titleVi: "Thiết kế & Kiến trúc Tour Công ty",
          titleEn: "Company Tour Architecture",
          descVi: "Xây dựng chi tiết từng điểm đến, chính sách giá vé, hình ảnh trải nghiệm và lịch trình chuẩn cho du khách.",
          descEn: "Build comprehensive day-by-day itineraries, pricing policies, media assets, and company tour offerings.",
          icon: <BookOpen className="h-6 w-6 text-blue-500" />
        },
        {
          titleVi: "Điều phối Lịch & Phân công Staff",
          titleEn: "Schedule & Staff Allocation",
          descVi: "Mở bán các chuyến đi (Schedules), phân công nhân viên/hướng dẫn viên phụ trách và thiết lập cổng soát vé QR.",
          descEn: "Publish departure dates, assign our field Staff members, configure QR check-in gates, and monitor seating.",
          icon: <Calendar className="h-6 w-6 text-indigo-500" />
        },
        {
          titleVi: "Chăm sóc & Phân tích Khách hàng",
          titleEn: "Customer Analytics & Care",
          descVi: "Theo dõi chân dung du khách, tỷ lệ lấp đầy đoàn, đọc phản hồi đánh giá và xử lý yêu cầu hoàn hủy chuyến.",
          descEn: "Track customer demographics, occupancy rates, traveler reviews, and swiftly handle refund requests.",
          icon: <HeartHandshake className="h-6 w-6 text-blue-500" />
        },
        {
          titleVi: "AI Dự báo Xu hướng & Khuyến mãi",
          titleEn: "AI Trend Forecast & Vouchers",
          descVi: "Tận dụng AI phân tích xu hướng du lịch, tự động hóa chiến lược giá và phát hành voucher khuyến mãi cho khách.",
          descEn: "Leverage AI to uncover top travel trends, automate dynamic pricing strategies, and launch company vouchers.",
          icon: <Sparkles className="h-6 w-6 text-indigo-500" />
        }
      ] as Responsibility[],
      capabilities: [
        {
          titleVi: "Báo cáo Doanh số & Giao dịch",
          titleEn: "Sales & Deals Overview",
          descVi: "Xem biểu đồ doanh thu chi tiết của công ty, các đơn đặt tour gần đây, tỷ lệ giao dịch thành công và chờ xử lý.",
          descEn: "View comprehensive company revenue charts, recent bookings, delivered deals and pending transactions.",
          path: "/manager/sales-overview",
          icon: <DollarSign className="h-6 w-6 text-blue-500" />,
          badgeVi: "Biểu đồ trực quan",
          badgeEn: "Live Analytics",
          colorClass: "bg-blue-500/10 text-blue-600 border-blue-500/20"
        },
        {
          titleVi: "Quản lý Danh sách Tour Công ty",
          titleEn: "Company Tours Management",
          descVi: "Tạo mới, chỉnh sửa hành trình, đăng tải hình ảnh chất lượng cao và cấu hình chi tiết giá tour.",
          descEn: "Create, edit, and manage our complete catalog of company tours, itineraries, and price tiers.",
          path: PATH.MANAGER.MY_TOURS,
          icon: <BookOpen className="h-6 w-6 text-indigo-500" />,
          badgeVi: "Quản lý cốt lõi",
          badgeEn: "Core Module",
          colorClass: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20"
        },
        {
          titleVi: "Quản lý Lịch trình Khởi hành",
          titleEn: "Schedule Management",
          descVi: "Điều phối các chuyến đi theo ngày, chỉ định nhân viên Tour Staff phụ trách và theo dõi tình trạng check-in.",
          descEn: "Schedule departures, assign field Tour Staff members, and track customer booking occupancy.",
          path: PATH.MANAGER.SCHEDULE_MANAGEMENT,
          icon: <Calendar className="h-6 w-6 text-blue-500" />,
          badgeVi: "Điều phối 24/7",
          badgeEn: "Operations",
          colorClass: "bg-blue-500/10 text-blue-600 border-blue-500/20"
        },
        {
          titleVi: "Theo dõi Tọa độ GPS Trực tuyến",
          titleEn: "Live Location Tracking",
          descVi: "Giám sát vị trí hiện tại của các đoàn du lịch đang di chuyển trên bản đồ theo thời gian thực.",
          descEn: "Monitor real-time GPS locations of active tour schedules and vehicles on interactive maps.",
          path: PATH.MANAGER.LOCATIONS,
          icon: <MapPin className="h-6 w-6 text-indigo-500" />,
          badgeVi: "GPS Real-time",
          badgeEn: "GPS Real-time",
          colorClass: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20"
        },
        {
          titleVi: "Phân tích Khách hàng (Analytics)",
          titleEn: "Customer Analytics",
          descVi: "Thống kê thói quen, độ tuổi, tỷ lệ quay lại và mức độ hài lòng của du khách trên từng tour.",
          descEn: "Analyze customer demographics, return rates, behaviors, and satisfaction metrics across tours.",
          path: PATH.MANAGER.CUSTOMER_ANALYTICS,
          icon: <BarChart3 className="h-6 w-6 text-blue-500" />,
          badgeVi: "Chuyên sâu",
          badgeEn: "Deep Insights",
          colorClass: "bg-blue-500/10 text-blue-600 border-blue-500/20"
        },
        {
          titleVi: "Thống kê Đặt tour & Lấp đầy",
          titleEn: "Booking Statistics",
          descVi: "Xem báo cáo tình trạng đặt tour, xu hướng đặt sớm và tối ưu chi phí vận hành chuyến đi.",
          descEn: "Review booking trends, early-bird ratios, and occupancy rates to optimize tour profitability.",
          path: PATH.MANAGER.BOOKING_STATISTICS,
          icon: <TrendingUp className="h-6 w-6 text-indigo-500" />,
          badgeVi: "Hiệu suất",
          badgeEn: "Performance",
          colorClass: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20"
        },
        {
          titleVi: "Quản lý Đánh giá & Phản hồi",
          titleEn: "Reviews & Reputation",
          descVi: "Đọc và phản hồi các nhận xét từ khách du lịch sau chuyến đi để nâng cao chất lượng dịch vụ công ty.",
          descEn: "Read and reply to verified traveler reviews to elevate company service reputation and ratings.",
          path: PATH.MANAGER.REVIEWS,
          icon: <Star className="h-6 w-6 text-blue-500" />,
          badgeVi: "Thương hiệu",
          badgeEn: "Reputation",
          colorClass: "bg-blue-500/10 text-blue-600 border-blue-500/20"
        },
        {
          titleVi: "Chương trình Voucher Khuyến mãi",
          titleEn: "Vouchers & Marketing",
          descVi: "Phát hành mã giảm giá riêng cho các tour của công ty, kích cầu đặt vé và tri ân khách hàng thân thiết.",
          descEn: "Launch promotional discount codes and vouchers to boost bookings and reward loyal travelers.",
          path: PATH.MANAGER.VOUCHERS,
          icon: <Ticket className="h-6 w-6 text-indigo-500" />,
          badgeVi: "Tăng doanh thu",
          badgeEn: "Marketing",
          colorClass: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20"
        },
        {
          titleVi: "Dự báo Xu hướng Du lịch AI",
          titleEn: "AI Trend Prediction",
          descVi: "Sử dụng trí tuệ nhân tạo để phân tích nhu cầu du lịch sắp tới, gợi ý chiến lược mở tour mới phù hợp.",
          descEn: "Harness AI to forecast upcoming destination demands and receive smart pricing recommendations.",
          path: PATH.MANAGER.TREND_PREDICTION,
          icon: <Bot className="h-6 w-6 text-blue-500" />,
          badgeVi: "AI Smart",
          badgeEn: "AI Smart",
          colorClass: "bg-blue-500/10 text-blue-600 border-blue-500/20"
        }
      ] as CapabilityCard[],
      workflow: [
        {
          step: "01",
          titleVi: "Thiết lập Tour & Lịch trình",
          titleEn: "Create Tour & Itineraries",
          descVi: "Khai báo thông tin tour của công ty, các điểm dừng chân, giá vé và mở ngày khởi hành (Schedule).",
          descEn: "Define company tour details, stops, ticket tiers, and open departure schedules for booking.",
          icon: <BookOpen className="h-5 w-5 text-blue-500" />
        },
        {
          step: "02",
          titleVi: "Phân công Tour Staff & QR Gate",
          titleEn: "Assign Staff & QR Check-in",
          descVi: "Gán nhân viên/hướng dẫn viên của công ty phụ trách đoàn và bật cổng soát vé tự động bằng mã QR.",
          descEn: "Assign field Tour Staff to schedules and activate automated QR ticket scanning.",
          icon: <Users className="h-5 w-5 text-indigo-500" />
        },
        {
          step: "03",
          titleVi: "Giám sát GPS & Vận hành",
          titleEn: "Monitor Live GPS & Operations",
          descVi: "Theo dõi hành trình của đoàn trên bản đồ GPS và quản lý check-in khách thời gian thực.",
          descEn: "Track your tour groups on live GPS maps and monitor real-time check-in status.",
          icon: <MapPin className="h-5 w-5 text-blue-500" />
        },
        {
          step: "04",
          titleVi: "Phân tích Doanh thu & AI",
          titleEn: "Analyze Revenue & AI Trends",
          descVi: "Đọc báo cáo kinh doanh, đánh giá phản hồi của khách và nhận gợi ý tối ưu từ trợ lý AI.",
          descEn: "Review business reports, traveler ratings, and receive AI optimization tips.",
          icon: <TrendingUp className="h-5 w-5 text-indigo-500" />
        }
      ] as WorkflowStep[],
      permissions: [
        { nameVi: "Tạo & Quản lý Tour công ty", nameEn: "Create & Manage Company Tours", status: "Manager Access" },
        { nameVi: "Quản lý Lịch xuất phát", nameEn: "Manage Departure Schedules", status: "Manager Access" },
        { nameVi: "Phân công Tour Staff", nameEn: "Assign Field Tour Staff", status: "Manager Access" },
        { nameVi: "Xem tọa độ GPS trực tuyến", nameEn: "View Real-time GPS", status: "Manager Access" },
        { nameVi: "Tạo Voucher & Khuyến mãi", nameEn: "Create Company Vouchers", status: "Manager Access" },
        { nameVi: "Duyệt hoàn hủy booking", nameEn: "Approve Cancellations", status: "Manager Access" }
      ]
    },
    staff: {
      titleVi: "KHÔNG GIAN NHÂN VIÊN ĐIỀU HÀNH TOUR",
      titleEn: "TOUR STAFF OPERATIONS CENTER",
      roleNameVi: "Nhân viên Điều hành & Hướng dẫn viên (Tour Staff)",
      roleNameEn: "Tour Guide & Operations Staff",
      badgeVi: "ĐIỀU HÀNH HIỆN TRƯỜNG CÔNG TY",
      badgeEn: "COMPANY FIELD OPERATIONS",
      gradient: "from-navy via-blue-900 to-indigo-950 dark:from-blue-950 dark:via-indigo-950 dark:to-slate-900",
      lightGradient: "from-blue-500/10 via-indigo-500/10 to-blue-600/10",
      borderAccent: "border-blue-500/30",
      heroIcon: <UserCheck className="h-10 w-10 text-white" />,
      sloganVi: "Hỗ trợ Kiểm soát Vé QR siêu tốc, Quản lý Khách đoàn chuẩn xác và Định vị GPS thời gian thực.",
      sloganEn: "Fast QR Ticket Scanning, Accurate Roster Control and Live GPS Group Tracking.",
      overviewVi:
        "Bảng điều khiển Nhân viên (Tour Staff Dashboard) là công cụ chuyên dụng được thiết kế dành riêng cho Hướng dẫn viên và Nhân viên điều hành hiện trường của công ty. Hệ thống giúp bạn tiếp nhận ngay các chuyến đi (Schedules) được phân công, thực hiện soát vé siêu tốc qua camera QR, kiểm tra danh sách khách đoàn, điểm danh và phát tín hiệu GPS trực tiếp về trung tâm điều hành nhằm đảm bảo an toàn cho du khách.",
      overviewEn:
        "The Tour Staff Dashboard is our company's dedicated operational toolkit built for Tour Guides and Field Staff. This space empowers you to instantly review assigned schedules, scan traveler QR tickets in real-time, take fast group attendances, and broadcast live GPS coordinates back to our control center for total group safety.",
      stats: [
        { labelVi: "Tốc độ quét vé QR", labelEn: "QR Scan Speed", value: "< 0.3s", icon: <QrCode className="h-5 w-5 text-blue-400" /> },
        { labelVi: "Độ chính xác định vị", labelEn: "GPS Accuracy", value: "High (±2m)", icon: <MapPin className="h-5 w-5 text-blue-400" /> },
        { labelVi: "Khả năng hoạt động", labelEn: "Mobile Ready", value: "100%", icon: <Smartphone className="h-5 w-5 text-indigo-400" /> },
        { labelVi: "Bảo mật xác thực", labelEn: "Security Check", value: "Encrypted", icon: <Lock className="h-5 w-5 text-blue-400" /> }
      ],
      responsibilities: [
        {
          titleVi: "Tiếp nhận Lịch trình Phân công",
          titleEn: "Assigned Schedule Execution",
          descVi: "Xem rõ thông tin giờ xuất phát, điểm đón, chi tiết hành trình và danh sách đoàn công ty giao phụ trách.",
          descEn: "View precise departure times, meeting points, full itineraries, and assigned group details.",
          icon: <Calendar className="h-6 w-6 text-blue-500" />
        },
        {
          titleVi: "Soát vé QR Siêu tốc qua Camera",
          titleEn: "Instant QR Ticket Scanning",
          descVi: "Sử dụng camera điện thoại/máy tính bảng để quét mã vé QR của du khách, điểm danh tức thì.",
          descEn: "Use mobile camera to verify passenger QR e-tickets and confirm attendance in milliseconds.",
          icon: <QrCode className="h-6 w-6 text-indigo-500" />
        },
        {
          titleVi: "Quản lý Khách đoàn & Hỗ trợ SOS",
          titleEn: "Group Roster & Customer Care",
          descVi: "Kiểm diện thành viên đoàn, ghi chú tình trạng sức khỏe, hỗ trợ y tế khẩn cấp và giải đáp thắc mắc.",
          descEn: "Check off group members, note dietary requirements, provide on-site care and emergency support.",
          icon: <Users className="h-6 w-6 text-blue-500" />
        },
        {
          titleVi: "Chia sẻ Vị trí GPS Trực tiếp",
          titleEn: "Live GPS Location Sharing",
          descVi: "Bật theo dõi GPS từ thiết bị để trung tâm điều hành nắm bắt lộ trình và hỗ trợ an ninh đoàn.",
          descEn: "Turn on live GPS broadcasting so our management center can monitor safety and route progress.",
          icon: <MapPin className="h-6 w-6 text-indigo-500" />
        }
      ] as Responsibility[],
      capabilities: [
        {
          titleVi: "Lịch trình Được phân công",
          titleEn: "Assigned Schedules",
          descVi: "Xem toàn bộ các chuyến đi sắp khởi hành và đang diễn ra do bạn trực tiếp điều hành.",
          descEn: "Browse upcoming and ongoing tour departures assigned directly to your staff profile.",
          path: PATH.STAFF.SCHEDULES,
          icon: <Calendar className="h-6 w-6 text-blue-500" />,
          badgeVi: "Nhiệm vụ chính",
          badgeEn: "Primary Task",
          colorClass: "bg-blue-500/10 text-blue-600 border-blue-500/20"
        },
        {
          titleVi: "Quét mã QR Check-in Đoàn",
          titleEn: "QR Ticket Check-In Gate",
          descVi: "Mở trình quét QR trên thiết bị để xác thực vé khách, kiểm tra hợp lệ và điểm danh vào đoàn.",
          descEn: "Open camera QR gate to validate e-tickets, check booking validity and mark attendances.",
          path: PATH.STAFF.QR_CHECKIN,
          icon: <QrCode className="h-6 w-6 text-indigo-500" />,
          badgeVi: "Quét tức thì",
          badgeEn: "Fast Scan",
          colorClass: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20"
        },
        {
          titleVi: "Danh sách Vé & Khách hàng",
          titleEn: "Ticket List & Roster",
          descVi: "Tra cứu thủ công danh sách vé của toàn bộ du khách, tình trạng thanh toán và số ghế.",
          descEn: "Manually lookup tickets, verify passenger identities, payment status, and seat codes.",
          path: PATH.STAFF.TICKETS,
          icon: <Ticket className="h-6 w-6 text-blue-500" />,
          badgeVi: "Quản lý vé",
          badgeEn: "Ticketing",
          colorClass: "bg-blue-500/10 text-blue-600 border-blue-500/20"
        },
        {
          titleVi: "Theo dõi Tọa độ GPS & Bản đồ",
          titleEn: "Live Location Tracking",
          descVi: "Kích hoạt chia sẻ tọa độ hành trình, xem bản đồ đoàn du lịch và đồng bộ vị trí về trung tâm.",
          descEn: "Activate GPS telemetry, view group map positions, and keep central operators updated.",
          path: PATH.STAFF.LOCATIONS,
          icon: <MapPin className="h-6 w-6 text-indigo-500" />,
          badgeVi: "Bản đồ GPS",
          badgeEn: "GPS Map",
          colorClass: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20"
        },
        {
          titleVi: "Danh sách Khách đoàn theo Chuyến",
          titleEn: "Schedule Customers Care",
          descVi: "Danh sách chi tiết thông tin từng hành khách trong chuyến, liên hệ trực tiếp khi có sự cố.",
          descEn: "Detailed roster of all travelers on your shift with direct contact details for emergency needs.",
          path: PATH.STAFF.CUSTOMERS,
          icon: <Users className="h-6 w-6 text-blue-500" />,
          badgeVi: "Chăm sóc",
          badgeEn: "Customer Care",
          colorClass: "bg-blue-500/10 text-blue-600 border-blue-500/20"
        }
      ] as CapabilityCard[],
      workflow: [
        {
          step: "01",
          titleVi: "Kiểm tra Lịch trình ngày mới",
          titleEn: "Check Daily Schedule",
          descVi: "Mở danh sách lịch trình được phân công, nắm vững thông tin xe, điểm đón và hướng dẫn.",
          descEn: "Review your assigned shift, meeting coordinates, transport details, and tour guidelines.",
          icon: <Calendar className="h-5 w-5 text-blue-500" />
        },
        {
          step: "02",
          titleVi: "Bật GPS Định vị Hành trình",
          titleEn: "Activate Live GPS Sharing",
          descVi: "Bật theo dõi vị trí trên thiết bị trước khi đoàn bắt đầu di chuyển để trung tâm nắm lộ trình.",
          descEn: "Turn on live location tracking before departure so operators can verify group safety.",
          icon: <MapPin className="h-5 w-5 text-indigo-500" />
        },
        {
          step: "03",
          titleVi: "Quét QR Check-in Khách đoàn",
          titleEn: "Scan Traveler QR Tickets",
          descVi: "Dùng camera quét vé QR của từng du khách khi lên xe hoặc vào điểm tham quan.",
          descEn: "Use mobile camera to scan tourist e-tickets upon boarding or entering attractions.",
          icon: <QrCode className="h-5 w-5 text-blue-500" />
        },
        {
          step: "04",
          titleVi: "Hỗ trợ & Chăm sóc Đoàn",
          titleEn: "Care & Complete Tour",
          descVi: "Đảm bảo đầy đủ thành viên, hỗ trợ tận tình và hoàn tất chuyến đi an toàn.",
          descEn: "Ensure full group attendance, provide excellent guidance, and close the shift securely.",
          icon: <CheckCircle2 className="h-5 w-5 text-indigo-500" />
        }
      ] as WorkflowStep[],
      permissions: [
        { nameVi: "Xem lịch trình được gán", nameEn: "View Assigned Schedules", status: "Staff Access" },
        { nameVi: "Quét & Xác thực vé QR", nameEn: "Scan & Validate QR Tickets", status: "Staff Access" },
        { nameVi: "Điểm danh khách đoàn", nameEn: "Mark Group Attendances", status: "Staff Access" },
        { nameVi: "Phát/Truyền tọa độ GPS", nameEn: "Broadcast GPS Coordinates", status: "Staff Access" },
        { nameVi: "Xem thông tin liên hệ đoàn", nameEn: "View Roster Contacts", status: "Staff Access" },
        { nameVi: "Chỉnh sửa Tour/Giá vé", nameEn: "Edit Tours or Pricing", status: "Restricted (No Access)" }
      ]
    },
    admin: {
      titleVi: "TRUNG TÂM QUẢN TRỊ VIÊN HỆ THỐNG",
      titleEn: "SYSTEM ADMIN COMMAND CENTER",
      roleNameVi: "Quản trị viên Hệ thống (System Admin)",
      roleNameEn: "Super System Administrator",
      badgeVi: "QUYỀN HẠN TỐI CAO TOÀN CÔNG TY",
      badgeEn: "FULL SYSTEM SUPREMACY",
      gradient: "from-navy via-blue-900 to-indigo-950 dark:from-blue-950 dark:via-indigo-950 dark:to-slate-900",
      lightGradient: "from-blue-600/10 via-indigo-600/10 to-blue-700/10",
      borderAccent: "border-blue-500/40",
      heroIcon: <ShieldCheck className="h-10 w-10 text-white" />,
      sloganVi: "Giám sát vĩ mô toàn bộ hệ thống công ty, quản lý nhân sự điều hành, kiểm duyệt nội dung và điều phối Trí tuệ AI.",
      sloganEn: "Macro-level company governance, operations personnel oversight, content moderation and AI console mastery.",
      overviewVi:
        "Bảng điều khiển Quản trị viên (System Admin Dashboard) là cơ quan đầu não cao nhất của công ty. Nơi đây cung cấp cho bạn toàn quyền kiểm soát hệ thống: theo dõi các chỉ số kinh doanh, quản lý tài khoản nhân sự (Quản lý Tour, Tour Staff), kiểm duyệt chất lượng danh mục Tour, xử lý các báo cáo vi phạm, cũng như tinh chỉnh cấu hình Trí tuệ nhân tạo (AI Console) và chương trình khuyến mãi của công ty.",
      overviewEn:
        "The System Admin Dashboard is the highest operational command center of our company. Here, you hold absolute authority across the entire system: monitoring growth metrics, managing employee accounts (Tour Managers, Tour Staff), moderating tour catalog quality, resolving reports, and configuring advanced AI intelligence and system-wide promotions.",
      stats: [
        { labelVi: "Giám sát toàn hệ thống", labelEn: "System Coverage", value: "100% Full", icon: <Globe className="h-5 w-5 text-blue-400" /> },
        { labelVi: "Quyền hạn bảo mật", labelEn: "Security Authority", value: "Level 5 Max", icon: <ShieldCheck className="h-5 w-5 text-blue-400" /> },
        { labelVi: "Trợ lý AI Console", labelEn: "AI Core Status", value: "Operational", icon: <Bot className="h-5 w-5 text-indigo-400" /> },
        { labelVi: "Tốc độ xử lý lõi", labelEn: "Core Engine Latency", value: "< 10ms", icon: <Cpu className="h-5 w-5 text-blue-400" /> }
      ],
      responsibilities: [
        {
          titleVi: "Giám sát Vĩ mô & Tài chính Công ty",
          titleEn: "System & Revenue Governance",
          descVi: "Theo dõi tổng sản lượng giao dịch toàn hệ thống, tốc độ tăng trưởng khách hàng và dòng tiền doanh thu.",
          descEn: "Monitor total booking volume, customer growth, revenue splits, and company cashflow pipelines.",
          icon: <PieChart className="h-6 w-6 text-blue-400" />
        },
        {
          titleVi: "Kiểm duyệt Danh mục Tour & Nội dung",
          titleEn: "Tour Catalog & Moderation",
          descVi: "Kiểm duyệt các tour mới tạo bởi bộ phận Quản lý Tour, đảm bảo chất lượng tiêu chuẩn trước khi mở bán.",
          descEn: "Review tour offerings created by Tour Managers and verify quality standards before going live.",
          icon: <ShieldAlert className="h-6 w-6 text-indigo-400" />
        },
        {
          titleVi: "Quản lý Nhân sự & Phân quyền",
          titleEn: "Personnel & Role Administration",
          descVi: "Quản lý tài khoản nhân viên (Tour Manager, Tour Staff, Khách hàng), phân quyền và bảo mật hệ thống.",
          descEn: "Manage all accounts (Tour Managers, Staff, Travelers), assign access levels, and ensure data security.",
          icon: <Users className="h-6 w-6 text-blue-400" />
        },
        {
          titleVi: "Cấu hình AI Console & Marketing",
          titleEn: "AI Console & System Promotions",
          descVi: "Quản trị bộ não Trí tuệ nhân tạo của công ty, thiết lập voucher toàn sàn, banner quảng bá và tin tức du lịch.",
          descEn: "Configure system AI brains, create discount vouchers, homepage banners, and national tourism guides.",
          icon: <Bot className="h-6 w-6 text-indigo-400" />
        }
      ] as Responsibility[],
      capabilities: [
        {
          titleVi: "Phân tích Tổng quan Hệ thống",
          titleEn: "System Analytics",
          descVi: "Biểu đồ trực quan về lưu lượng truy cập, tỷ lệ chuyển đổi booking và chỉ số sức khỏe công ty.",
          descEn: "Visual charts detailing system traffic, booking conversions, and overall operational health.",
          path: PATH.ADMIN.PLATFORM_ANALYTICS,
          icon: <PieChart className="h-6 w-6 text-blue-500" />,
          badgeVi: "Báo cáo vĩ mô",
          badgeEn: "Macro KPIs",
          colorClass: "bg-blue-500/10 text-blue-600 border-blue-500/20"
        },
        {
          titleVi: "Phân tích Hành vi Khách hàng",
          titleEn: "Customer Analytics",
          descVi: "Thống kê phân khúc khách hàng của công ty, sở thích điểm đến và xu hướng tìm kiếm tour.",
          descEn: "Company-wide customer segmentation, top destination interests, and search query patterns.",
          path: PATH.ADMIN.CUSTOMER_ANALYTICS,
          icon: <BarChart3 className="h-6 w-6 text-indigo-500" />,
          badgeVi: "Dữ liệu lớn",
          badgeEn: "Big Data",
          colorClass: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20"
        },
        {
          titleVi: "Thống kê Doanh thu & Dòng tiền",
          titleEn: "Revenue Statistics",
          descVi: "Theo dõi doanh số toàn công ty, chi phí khuyến mãi và báo cáo tài chính định kỳ.",
          descEn: "Monitor total company revenue, promotional expenses, and periodic financial reports.",
          path: PATH.ADMIN.REVENUE_STATISTICS,
          icon: <DollarSign className="h-6 w-6 text-blue-500" />,
          badgeVi: "Tài chính",
          badgeEn: "Finance",
          colorClass: "bg-blue-500/10 text-blue-600 border-blue-500/20"
        },
        {
          titleVi: "Quản lý Tài khoản & Phân quyền",
          titleEn: "User & Personnel Management",
          descVi: "Danh sách toàn bộ User (Khách hàng, Tour Manager, Tour Staff, Admin), cấp quyền hoặc khóa tài khoản.",
          descEn: "Manage all users (Travelers, Tour Managers, Staff, Admins), assign roles or restrict accounts.",
          path: PATH.ADMIN.USER_MANAGEMENT,
          icon: <Users className="h-6 w-6 text-indigo-500" />,
          badgeVi: "Quyền hạn cao",
          badgeEn: "User Admin",
          colorClass: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20"
        },
        {
          titleVi: "Kiểm duyệt Danh mục Tour",
          titleEn: "Tour Moderation & Catalog",
          descVi: "Xem xét, phê duyệt hoặc chỉnh sửa các tour do bộ phận điều hành gửi lên trước khi mở bán chính thức.",
          descEn: "Review, approve, or edit tour proposals before they go live on the public booking catalog.",
          path: PATH.ADMIN.TOUR_MODERATION,
          icon: <Map className="h-6 w-6 text-blue-500" />,
          badgeVi: "Kiểm duyệt",
          badgeEn: "Moderation",
          colorClass: "bg-blue-500/10 text-blue-600 border-blue-500/20"
        },
        {
          titleVi: "Quản lý Hồ sơ Điều hành (Tour Managers)",
          titleEn: "Tour Manager Profiles",
          descVi: "Xem và quản lý danh sách các Quản lý Tour điều hành đang làm việc trong hệ thống công ty.",
          descEn: "View and manage active Tour Managers and operations executives working within our company.",
          path: PATH.ADMIN.PARTNER_APPROVAL,
          icon: <UserCheck className="h-6 w-6 text-indigo-500" />,
          badgeVi: "Quản trị",
          badgeEn: "Personnel",
          colorClass: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20"
        },
        {
          titleVi: "Quản trị Trí tuệ AI Console",
          titleEn: "AI Console & Superintelligence",
          descVi: "Điều khiển tham số trợ lý AI StayHub, mô hình gợi ý hành trình và tự động xử lý ngôn ngữ tự nhiên.",
          descEn: "Manage StayHub AI assistant parameters, itinerary recommendation models, and NLP settings.",
          path: PATH.ADMIN.AI_CONSOLE,
          icon: <Bot className="h-6 w-6 text-blue-500" />,
          badgeVi: "AI Core",
          badgeEn: "AI Core",
          colorClass: "bg-blue-500/10 text-blue-600 border-blue-500/20"
        },
        {
          titleVi: "Voucher & Khuyến mãi Công ty",
          titleEn: "Company Vouchers & Promotions",
          descVi: "Tạo các chiến dịch giảm giá quy mô toàn công ty, mã quà tặng tri ân và chương trình ưu đãi đặc biệt.",
          descEn: "Launch promotional discount codes, holiday sales campaigns, and loyalty rewards for travelers.",
          path: PATH.ADMIN.SYSTEM_VOUCHERS,
          icon: <Gift className="h-6 w-6 text-indigo-500" />,
          badgeVi: "Marketing",
          badgeEn: "Global Promo",
          colorClass: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20"
        },
        {
          titleVi: "Quản lý Banner & Thông tin Du lịch",
          titleEn: "Banners & Tourism Guides",
          descVi: "Cập nhật banner trang chủ, tin tức du lịch điểm đến và các danh mục phân loại tour tiêu chuẩn.",
          descEn: "Update homepage visual banners, national tourism articles, and standard tour categories.",
          path: PATH.ADMIN.BANNER_MANAGEMENT,
          icon: <Image className="h-6 w-6 text-blue-500" />,
          badgeVi: "Nội dung",
          badgeEn: "CMS Content",
          colorClass: "bg-blue-500/10 text-blue-600 border-blue-500/20"
        }
      ] as CapabilityCard[],
      workflow: [
        {
          step: "01",
          titleVi: "Kiểm tra Sức khỏe Hệ thống",
          titleEn: "Monitor System Health",
          descVi: "Xem các chỉ số KPI vĩ mô, lưu lượng truy cập và báo cáo tự động từ AI Console.",
          descEn: "Review macro KPI dashboards, real-time traffic, and AI-generated system health alerts.",
          icon: <Activity className="h-5 w-5 text-blue-400" />
        },
        {
          step: "02",
          titleVi: "Duyệt Tour & Quản lý Nhân sự",
          titleEn: "Review Tours & Staff Roles",
          descVi: "Kiểm duyệt nội dung tour đủ tiêu chuẩn xuất bản và phân quyền cho đội ngũ điều hành.",
          descEn: "Review newly submitted tour itineraries and assign access privileges to operations staff.",
          icon: <ShieldCheck className="h-5 w-5 text-indigo-400" />
        },
        {
          step: "03",
          titleVi: "Quản lý Khuyến mãi & Cấu hình AI",
          titleEn: "Configure Promos & AI",
          descVi: "Điều chỉnh voucher hệ thống theo mùa du lịch và tinh chỉnh cấu hình gợi ý của AI.",
          descEn: "Adjust system-wide voucher campaigns for peak seasons and tune AI recommendation weights.",
          icon: <Sparkles className="h-5 w-5 text-blue-400" />
        },
        {
          step: "04",
          titleVi: "Xử lý Báo cáo & Tài chính",
          titleEn: "Resolve Reports & Finance",
          descVi: "Giải quyết các báo cáo vi phạm, kiểm toán dòng tiền và theo dõi hiệu suất doanh thu.",
          descEn: "Investigate reported violations, audit company cashflows, and oversee financial targets.",
          icon: <DollarSign className="h-5 w-5 text-indigo-400" />
        }
      ] as WorkflowStep[],
      permissions: [
        { nameVi: "Quản trị toàn bộ Tài khoản & Nhân sự", nameEn: "Full Personnel & User Administration", status: "Super Admin (Root)" },
        { nameVi: "Phê duyệt/Khóa Danh mục Tour", nameEn: "Approve/Lock Tour Catalogs", status: "Super Admin (Root)" },
        { nameVi: "Cấu hình AI Console lõi", nameEn: "Configure Core AI Console", status: "Super Admin (Root)" },
        { nameVi: "Quản lý Tài chính & Báo cáo", nameEn: "Manage Finance & Statistics", status: "Super Admin (Root)" },
        { nameVi: "Tạo Voucher & Banner toàn công ty", nameEn: "Create Global Vouchers/Banners", status: "Super Admin (Root)" },
        { nameVi: "Thiết lập cấu hình hệ thống", nameEn: "System Settings Mastery", status: "Super Admin (Root)" }
      ]
    }
  };

  const config = roleConfig[currentRole];

  return (
    <div className="min-h-screen space-y-8 pb-16 animate-in fade-in duration-500">
      {/* 1. HERO HEADER BANNER (Vibrant Premium Brand Blue & Navy Corporate Gradient) */}
      <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-r ${config.gradient} p-6 sm:p-10 shadow-2xl transition-all duration-300 border border-slate-700/60`}>
        {/* Ambient Glow Background Circles */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-80 w-80 rounded-full bg-blue-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 right-1/4 h-72 w-72 rounded-full bg-indigo-500/15 blur-2xl" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1 text-xs font-extrabold uppercase tracking-widest text-white backdrop-blur-md shadow-sm border border-white/20">
              <Sparkles className="h-3.5 w-3.5 text-blue-300 animate-pulse" />
              <span>{isVi ? config.badgeVi : config.badgeEn}</span>
            </div>

            <h1 className="text-2xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl leading-tight">
              {isVi ? config.titleVi : config.titleEn}
            </h1>

            <p className="text-base font-medium text-white/90 sm:text-lg leading-relaxed">
              {isVi ? config.sloganVi : config.sloganEn}
            </p>
          </div>

          <div className="flex shrink-0 items-center justify-center rounded-2xl bg-white/10 p-6 backdrop-blur-xl border border-white/15 shadow-inner">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="rounded-2xl bg-white/15 p-4 backdrop-blur-md shadow-lg border border-white/20">
                {config.heroIcon}
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-white/80">
                {isVi ? "VAI TRÒ CÔNG TY" : "COMPANY ROLE"}
              </span>
              <span className="rounded-lg bg-blue-600/60 px-3 py-1 text-xs font-extrabold text-white border border-blue-400/30">
                {isVi ? config.roleNameVi : config.roleNameEn}
              </span>
            </div>
          </div>
        </div>

        {/* Quick System Pulse Metrics Bar */}
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 pt-6 border-t border-white/15">
          {config.stats.map((stat, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3 backdrop-blur-md transition-transform duration-200 hover:scale-[1.02] border border-white/10"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 shadow-sm border border-white/20">
                {stat.icon}
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-white/75">
                  {isVi ? stat.labelVi : stat.labelEn}
                </p>
                <p className="text-base font-black text-white">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. ROLE INTRODUCTION & CORE RESPONSIBILITIES */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left column: Overview Panel */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-3xl bg-surface-card p-6 sm:p-8 shadow-card border border-border-default backdrop-blur-xl">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand shadow-sm">
                <Info className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-navy dark:text-white">
                  {isVi ? "Giới thiệu Vai trò & Quyền hạn" : "Role Overview & Authority"}
                </h2>
                <p className="text-xs font-medium text-text-muted">
                  {isVi ? "Mô tả vai trò điều hành trong hệ thống công ty StayHub" : "Description of operational duties in StayHub company"}
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-surface-page p-5 border border-border-subtle leading-relaxed text-sm text-navy/85 dark:text-slate-200 shadow-inner">
              {isVi ? config.overviewVi : config.overviewEn}
            </div>

            {/* Permission Matrix Summary Badge Cloud */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
                {isVi ? "BẢNG QUYỀN HẠN THAO TÁC CỐT LÕI" : "CORE ACCESS & PERMISSIONS"}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {config.permissions.map((perm, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl bg-surface-page px-3.5 py-2.5 border border-border-subtle text-xs font-semibold"
                  >
                    <span className="text-navy dark:text-slate-200 flex items-center gap-2 truncate">
                      <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                      <span className="truncate">{isVi ? perm.nameVi : perm.nameEn}</span>
                    </span>
                    <span className="ml-2 shrink-0 rounded-md bg-brand/10 px-2 py-0.5 text-[10px] font-bold text-brand">
                      {perm.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-2xl bg-gradient-to-r from-brand/10 to-indigo-500/10 p-4 border border-brand/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white shadow-sm">
                <Rocket className="h-5 w-5 animate-bounce" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-navy dark:text-white">
                  {isVi ? "Trợ lý AI & Hỗ trợ kỹ thuật 24/7" : "AI Assistant & 24/7 Technical Support"}
                </p>
                <p className="text-text-muted">
                  {isVi ? "Hệ thống tự động hóa tối ưu quy trình làm việc công ty" : "Automated systems optimizing company workflows"}
                </p>
              </div>
            </div>
            <span className="rounded-full bg-brand px-2.5 py-1 text-[10px] font-bold text-white shadow">
              ACTIVE
            </span>
          </div>
        </div>

        {/* Right column: Core Responsibilities Pillars */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-navy dark:text-white">
                {isVi ? "4 Trụ cột Trách nhiệm Điều hành" : "4 Core Operational Pillars"}
              </h2>
              <p className="text-xs font-medium text-text-muted">
                {isVi ? "Các nhiệm vụ trọng tâm hàng ngày được chuẩn hóa cho công ty" : "Standardized daily focus areas & duties for our team"}
              </p>
            </div>
            <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-600 dark:text-blue-400 border border-blue-500/20">
              {isVi ? "CHUẨN VẬN HÀNH" : "STANDARD OPERATING"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {config.responsibilities.map((resp, idx) => (
              <div
                key={idx}
                className="group relative flex flex-col justify-between rounded-3xl bg-surface-card p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover border border-border-default overflow-hidden"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-page shadow-sm border border-border-subtle group-hover:scale-110 group-hover:border-brand/40 transition-all duration-300">
                      {resp.icon}
                    </div>
                    <span className="text-2xl font-black text-slate-200 dark:text-slate-700 select-none">
                      0{idx + 1}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-navy dark:text-white group-hover:text-brand transition-colors">
                      {isVi ? resp.titleVi : resp.titleEn}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-text-muted">
                      {isVi ? resp.descVi : resp.descEn}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-border-subtle flex items-center justify-between text-[11px] font-bold text-brand opacity-80 group-hover:opacity-100 transition-opacity">
                  <span>{isVi ? "Nhiệm vụ cốt lõi" : "Core responsibility"}</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. STANDARD WORKFLOW ROADMAP (Step-by-step Timeline) */}
      <div className="rounded-3xl bg-surface-card p-6 sm:p-8 shadow-card border border-border-default">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-navy dark:text-white flex items-center gap-2">
              <Activity className="h-6 w-6 text-brand" />
              <span>{isVi ? "Quy trình Làm việc & Điều hành Chuẩn" : "Standard Operational Workflow Roadmap"}</span>
            </h2>
            <p className="text-xs font-medium text-text-muted mt-1">
              {isVi ? "Từng bước thực thi giúp tối ưu hóa hiệu suất làm việc đội ngũ và đảm bảo an toàn" : "Step-by-step execution to maximize team efficiency and guarantee operational success"}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl bg-surface-page px-3.5 py-2 text-xs font-bold text-navy dark:text-slate-200 border border-border-subtle">
            <CheckCircle2 className="h-4 w-4 text-blue-500" />
            <span>{isVi ? "4 Bước Chuẩn Hóa" : "4 Standardized Steps"}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {config.workflow.map((item, idx) => (
            <div key={idx} className="relative flex flex-col justify-between rounded-2xl bg-surface-page p-5 border border-border-subtle hover:border-brand/40 transition-all duration-300">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand font-black text-xs">
                    {item.step}
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white dark:bg-slate-800 shadow-sm border border-border-subtle">
                    {item.icon}
                  </div>
                </div>

                <h3 className="text-sm font-bold text-navy dark:text-white leading-snug">
                  {isVi ? item.titleVi : item.titleEn}
                </h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  {isVi ? item.descVi : item.descEn}
                </p>
              </div>

              {idx < config.workflow.length - 1 && (
                <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 h-6 w-6 items-center justify-center rounded-full bg-brand text-white shadow-md">
                  <ChevronRight className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 4. INTERACTIVE CAPABILITY & FUNCTION HUB (Grid of Cards with Quick Navigation) */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-navy dark:text-white flex items-center gap-2">
              <Layers className="h-6 w-6 text-brand" />
              <span>{isVi ? "Danh mục Chức năng & Quyền hạn Điều hành" : "Interactive Capability & Function Catalog"}</span>
            </h2>
            <p className="text-xs font-medium text-text-muted mt-1">
              {isVi ? "Nhấp vào bất kỳ thẻ chức năng nào dưới đây để truy cập ngay vào khu vực làm việc tương ứng" : "Click any capability card below to immediately navigate to its workspace module"}
            </p>
          </div>
          <span className="rounded-full bg-brand/10 px-3.5 py-1.5 text-xs font-extrabold text-brand border border-brand/20">
            {isVi ? `${config.capabilities.length} CHỨC NĂNG SẴN SÀNG` : `${config.capabilities.length} MODULES READY`}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {config.capabilities.map((cap, idx) => (
            <div
              key={idx}
              onClick={() => navigate(cap.path)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  navigate(cap.path);
                }
              }}
              className="group relative flex flex-col justify-between rounded-3xl bg-surface-card p-6 shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card-hover border border-border-default cursor-pointer overflow-hidden focus:outline-none focus:ring-2 focus:ring-brand"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${cap.colorClass} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                    {cap.icon}
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide border ${cap.colorClass}`}>
                    {isVi ? cap.badgeVi : cap.badgeEn}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-navy dark:text-white group-hover:text-brand transition-colors flex items-center gap-1.5">
                    <span>{isVi ? cap.titleVi : cap.titleEn}</span>
                    <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 text-brand" />
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-text-muted">
                    {isVi ? cap.descVi : cap.descEn}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-border-subtle flex items-center justify-between text-xs font-bold text-brand">
                <span className="group-hover:underline">
                  {isVi ? "Truy cập không gian làm việc" : "Open Workspace"}
                </span>
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand/10 text-brand group-hover:bg-brand group-hover:text-white transition-colors">
                  <ChevronRight className="h-4 w-4" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. FOOTER ASSURANCE & QUICK TIPS BANNER */}
      <div className="rounded-3xl bg-gradient-to-r from-navy to-slate-900 p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-800">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand text-white shadow-md border border-white/20">
            <Zap className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold">
              {isVi ? "Bạn cần hỗ trợ điều hành hoặc hướng dẫn kỹ thuật?" : "Need operational guidance or technical support?"}
            </h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-xl">
              {isVi
                ? "Hệ thống StayHub duy trì ghi nhận nhật ký điều hành 24/7 và bảo mật tuyệt đối cho toàn bộ đội ngũ nhân sự công ty. Hãy liên hệ bộ phận IT hoặc tham khảo tài liệu trợ lý AI khi gặp sự cố."
                : "The StayHub system logs operations 24/7 and ensures complete security for all company staff. Contact IT support desk or refer to the AI documentation whenever you need assistance."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="rounded-xl bg-white/10 hover:bg-white/20 px-4 py-2.5 text-xs font-bold transition-colors border border-white/15"
          >
            {isVi ? "Lên đầu trang" : "Back to top"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleIntroDashboard;
