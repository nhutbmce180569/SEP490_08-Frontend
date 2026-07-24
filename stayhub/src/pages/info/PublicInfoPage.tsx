import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { PATH } from "../../config/routes/route";
import { useTranslation } from "../../contexts/LocaleContext";
import type { Locale } from "../../i18n";
import { useSystemSettings } from "../../features/system/hooks/useSystemSettings";

type InfoCard = {
  title: string;
  body: string;
  href?: string;
};

type InfoContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
  cards: InfoCard[];
};

const CONTACT_EMAIL = "stayhub.fpt@gmail.com";
const MAP_LINK =
  "https://www.google.com/maps/search/?api=1&query=Tr%C6%B0%E1%BB%9Dng%20%C4%90%E1%BA%A1i%20h%E1%BB%8Dc%20FPT%20C%E1%BA%A7n%20Th%C6%A1%20600%20Nguy%E1%BB%85n%20V%C4%83n%20C%E1%BB%AB%20n%E1%BB%91i%20d%C3%A0i";

export default function PublicInfoPage() {
  const { slug = "" } = useParams();
  const { locale, t } = useTranslation();
  const { getSetting } = useSystemSettings();

  const companyEmail = getSetting("CompanyEmail") || CONTACT_EMAIL;
  const companyAddress = getSetting("CompanyAddress") || (locale === "vi" ? "Trường Đại học FPT Cần Thơ, 600 Nguyễn Văn Cừ nối dài, phường An Bình, TP. Cần Thơ." : "FPT University Can Tho, 600 Nguyen Van Cu extended, An Binh Ward, Can Tho City.");
  
  const mapIframeStr = getSetting("MapIframeUrl");
  let mapLink = MAP_LINK;
  if (mapIframeStr) {
    if (mapIframeStr.startsWith("http")) {
        mapLink = mapIframeStr;
    } else {
        const srcMatch = mapIframeStr.match(/src="([^"]+)"/);
        if (srcMatch) mapLink = srcMatch[1];
    }
  }

  const content: Record<Locale, Record<string, InfoContent>> = {
    vi: {
      reviews: {
        eyebrow: "Đánh giá",
        title: "Đánh giá StayHub",
        subtitle: "Tổng hợp trải nghiệm đặt tour, thanh toán, voucher và hỗ trợ khách hàng trên StayHub.",
        cards: [
          { title: "Đánh giá tour", body: "Khách hàng có thể xem và gửi đánh giá sau khi hoàn tất chuyến đi.", href: PATH.PUBLIC.TOURS },
          { title: "Minh bạch trải nghiệm", body: "Điểm đánh giá, nhận xét và phản hồi giúp customer chọn tour phù hợp hơn." },
          { title: "Cải thiện dịch vụ", body: "StayHub dùng phản hồi để cải thiện quy trình đặt vé, hỗ trợ và đề xuất tour." },
        ],
      },
      contact: {
        eyebrow: "Liên hệ",
        title: "Liên hệ StayHub",
        subtitle: "Kênh liên hệ chính thức của hệ thống StayHub.",
        cards: [
          { title: "Email hệ thống", body: companyEmail, href: `mailto:${companyEmail}` },
          { title: "Địa chỉ", body: companyAddress, href: mapLink },
          { title: "Hỗ trợ nhanh", body: "Dùng trợ lý AI ở góc phải dưới để hỏi về tour, voucher, đặt vé và thanh toán.", href: PATH.PUBLIC.AI_ASSISTANT },
        ],
      },
      "travel-guides": {
        eyebrow: "Cẩm nang",
        title: "Cẩm nang du lịch",
        subtitle: "Các gợi ý giúp customer chọn điểm đến, lịch trình và loại tour phù hợp.",
        cards: [
          { title: "Tìm tour theo điểm đến", body: "Dùng trang tìm kiếm để lọc tour theo từ khóa, giá, lịch trình và danh mục.", href: PATH.PUBLIC.TOUR_SEARCH },
          { title: "Gợi ý bằng AI", body: "Trả lời vài câu hỏi để AI đề xuất tour phù hợp với ngân sách và phong cách du lịch.", href: PATH.PUBLIC.AI_ASSISTANT },
          { title: "Theo dõi lịch trình", body: "Các thông tin lịch trình và điểm tham quan được hiển thị trong chi tiết tour." },
        ],
      },
      "help-center": {
        eyebrow: "Hỗ trợ",
        title: "Trung tâm trợ giúp",
        subtitle: "Các lối tắt tới những chức năng customer thường cần khi sử dụng StayHub.",
        cards: [
          { title: "Đặt tour", body: "Chọn tour, chọn lịch khởi hành, nhập thông tin hành khách và thanh toán.", href: PATH.PUBLIC.TOURS },
          { title: "Voucher", body: "Voucher được áp dụng ở trang checkout nếu còn hiệu lực và phù hợp tour." },
          { title: "Đơn đặt chỗ", body: "Đăng nhập để xem trạng thái thanh toán, vé và chi tiết booking.", href: PATH.CUSTOMER.MY_BOOKINGS },
        ],
      },
      "how-it-works": {
        eyebrow: "Quy trình",
        title: "StayHub hoạt động như thế nào",
        subtitle: "Quy trình cơ bản từ tìm tour đến thanh toán và quản lý đơn đặt chỗ.",
        cards: [
          { title: "1. Tìm tour", body: "Khám phá tour hoặc dùng AI để nhận đề xuất phù hợp.", href: PATH.PUBLIC.TOURS },
          { title: "2. Chọn lịch và vé", body: "Ở trang chi tiết tour, chọn lịch khởi hành và loại vé còn chỗ." },
          { title: "3. Thanh toán", body: "Thanh toán bằng VNPay hoặc MoMo. Giá trị thanh toán chính thức luôn là VND." },
        ],
      },
      sitemap: {
        eyebrow: "Điều hướng",
        title: "Sơ đồ trang",
        subtitle: "Các trang và tính năng chính trong hệ thống StayHub.",
        cards: [
          { title: "Trang chủ", body: "Điểm bắt đầu để khám phá StayHub.", href: PATH.PUBLIC.HOME },
          { title: "Tìm tour", body: "Danh sách và bộ lọc tour.", href: PATH.PUBLIC.TOUR_SEARCH },
          { title: "Về chúng tôi", body: "Thông tin hệ thống và đội ngũ.", href: PATH.PUBLIC.ABOUT },
          { title: "Điều khoản", body: "Điều khoản sử dụng nền tảng.", href: PATH.PUBLIC.TERMS },
          { title: "Bảo mật", body: "Chính sách quyền riêng tư.", href: PATH.PUBLIC.PRIVACY },
          { title: "Gợi ý AI", body: "Trợ lý đề xuất tour.", href: PATH.PUBLIC.AI_ASSISTANT },
        ],
      },
    },
    en: {
      reviews: {
        eyebrow: "Reviews",
        title: "StayHub Reviews",
        subtitle: "Customer feedback about tours, checkout, vouchers, and support on StayHub.",
        cards: [
          { title: "Tour reviews", body: "Customers can view and submit reviews after completing their trip.", href: PATH.PUBLIC.TOURS },
          { title: "Transparent experience", body: "Ratings and comments help customers choose better-fit tours." },
          { title: "Service improvement", body: "StayHub uses feedback to improve booking, support, and recommendations." },
        ],
      },
      contact: {
        eyebrow: "Contact",
        title: "Contact StayHub",
        subtitle: "Official StayHub contact information.",
        cards: [
          { title: "System email", body: companyEmail, href: `mailto:${companyEmail}` },
          { title: "Address", body: companyAddress, href: mapLink },
          { title: "Quick support", body: "Use the AI assistant at the bottom-right for tour, voucher, booking, and payment questions.", href: PATH.PUBLIC.AI_ASSISTANT },
        ],
      },
      "travel-guides": {
        eyebrow: "Guides",
        title: "Travel Guides",
        subtitle: "Practical suggestions for choosing destinations, schedules, and tour styles.",
        cards: [
          { title: "Search by destination", body: "Use search filters for keywords, price, schedules, and categories.", href: PATH.PUBLIC.TOUR_SEARCH },
          { title: "AI recommendations", body: "Answer a few questions and get tour suggestions based on budget and travel style.", href: PATH.PUBLIC.AI_ASSISTANT },
          { title: "Itinerary details", body: "Tour detail pages show schedules, ticket options, and attraction information." },
        ],
      },
      "help-center": {
        eyebrow: "Support",
        title: "Help Center",
        subtitle: "Shortcuts to the customer flows most often used in StayHub.",
        cards: [
          { title: "Book a tour", body: "Choose a tour, departure schedule, passenger details, and payment method.", href: PATH.PUBLIC.TOURS },
          { title: "Vouchers", body: "Eligible vouchers can be applied during checkout." },
          { title: "Bookings", body: "Log in to view payment status, tickets, and booking details.", href: PATH.CUSTOMER.MY_BOOKINGS },
        ],
      },
      "how-it-works": {
        eyebrow: "Process",
        title: "How StayHub Works",
        subtitle: "The basic flow from tour discovery to payment and booking management.",
        cards: [
          { title: "1. Find a tour", body: "Browse tours or use AI for personalized suggestions.", href: PATH.PUBLIC.TOURS },
          { title: "2. Pick schedule and tickets", body: "On the tour detail page, choose an available departure and ticket type." },
          { title: "3. Pay", body: "Pay with VNPay or MoMo. Official payment amounts remain in VND." },
        ],
      },
      sitemap: {
        eyebrow: "Navigation",
        title: "Sitemap",
        subtitle: "Main pages and features available in StayHub.",
        cards: [
          { title: "Home", body: "Start exploring StayHub.", href: PATH.PUBLIC.HOME },
          { title: "Tour search", body: "Tour list and filters.", href: PATH.PUBLIC.TOUR_SEARCH },
          { title: "About us", body: "System and team information.", href: PATH.PUBLIC.ABOUT },
          { title: "Terms", body: "Platform terms of service.", href: PATH.PUBLIC.TERMS },
          { title: "Privacy", body: "Privacy policy.", href: PATH.PUBLIC.PRIVACY },
          { title: "AI Guide", body: "AI tour recommendation assistant.", href: PATH.PUBLIC.AI_ASSISTANT },
        ],
      },
    },
  };

  const page = content[locale][slug];

  if (!page) return <Navigate to={PATH.PUBLIC.HOME} replace />;

  return (
    <div className="page-container section-shell pb-12">
      <PageHeader eyebrow={page.eyebrow} title={page.title} subtitle={page.subtitle} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {page.cards.map((card) => {
          const external = card.href?.startsWith("http") || card.href?.startsWith("mailto:");
          const cardContent = (
            <div className="glass-card flex h-full flex-col p-5 transition hover:-translate-y-0.5 hover:border-brand/20">
              <h2 className="text-base font-black text-navy">{card.title}</h2>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{card.body}</p>
              {card.href && (
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-brand">
                  {locale === "vi" ? "Mở liên kết" : "Open link"}
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </div>
          );

          if (!card.href) return <div key={card.title}>{cardContent}</div>;
          if (external) {
            return (
              <a key={card.title} href={card.href} target={card.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="!no-underline">
                {cardContent}
              </a>
            );
          }

          return (
            <Link key={card.title} to={card.href} className="!no-underline">
              {cardContent}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
