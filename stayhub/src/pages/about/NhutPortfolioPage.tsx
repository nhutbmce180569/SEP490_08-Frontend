import { Link } from "react-router-dom";
import {
  ArrowDownRight,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Braces,
  CalendarDays,
  Code2,
  Database,
  GraduationCap,
  Layers3,
  MapPinned,
  Rocket,
  ServerCog,
  Sparkles,
  TicketCheck,
  Users,
} from "lucide-react";
import { PATH } from "../../config/routes/route";
import { useTranslation } from "../../contexts/LocaleContext";
import minhNhutPhoto from "../../assets/team/minhnhut.png";

const skills = [
  ".NET",
  "ASP.NET Core",
  "Entity Framework Core",
  "SQL Server",
  "React",
  "TypeScript",
];

const focusAreas = [
  {
    icon: MapPinned,
    key: "tour",
    number: "01",
  },
  {
    icon: CalendarDays,
    key: "itinerary",
    number: "02",
  },
  {
    icon: TicketCheck,
    key: "booking",
    number: "03",
  },
] as const;

const content = {
  en: {
    eyebrow: "Portfolio / Software Engineer",
    greeting: "Hi, I'm",
    name: "Bùi Minh Nhựt.",
    headline: "I build the systems behind seamless journeys.",
    intro:
      "An Information Technology student at FPT University, backend-focused software engineer, and Project Leader of StayHub.",
    status: "Open to learning, building, and meaningful challenges",
    explore: "Explore StayHub",
    discover: "Discover my work",
    role: "Project Leader",
    project: "StayHub",
    roleCaption: "Tourism booking ecosystem",
    aboutEyebrow: "More than code",
    aboutTitle: "Building with clarity. Leading with ownership.",
    aboutParagraphs: [
      "I am deeply interested in software engineering and backend development. I enjoy turning complex business requirements into clean APIs, maintainable architecture, reliable data flows, and interfaces that feel effortless to use.",
      "Throughout academic and team projects, I have worked with tourism management, booking systems, authentication, role-based authorization, payment flows, and admin dashboards. Every challenge has sharpened how I solve problems, communicate decisions, and build as part of a team.",
    ],
    quote:
      "Every project is a small journey: ideas become features, challenges become lessons, and each line of code moves me closer to the developer I want to become.",
    leadershipEyebrow: "Project leadership",
    leadershipTitle: "My ownership in StayHub",
    leadershipDescription:
      "As StayHub's Project Leader, I connect product requirements with technical execution and take direct ownership of three core domains.",
    focus: {
      tour: {
        title: "Tour Management",
        description:
          "Tour lifecycle, categories, ticket configuration, availability, permissions, and manager workflows.",
      },
      itinerary: {
        title: "Itinerary",
        description:
          "Flexible tour and schedule itineraries, location data, daily activities, and operational planning.",
      },
      booking: {
        title: "Booking",
        description:
          "Order creation, ticket inventory, pricing integrity, payment flow, and the customer booking experience.",
      },
    },
    stackEyebrow: "Technical toolkit",
    stackTitle: "From database to interface.",
    stackDescription:
      "I work across the stack, with a strong focus on backend architecture, business logic, and dependable system integration.",
    backend: "Backend & APIs",
    data: "Data & persistence",
    frontend: "Frontend experience",
    teamwork: "Leadership & teamwork",
    backendValue: ".NET / ASP.NET Core",
    dataValue: "EF Core / SQL Server",
    frontendValue: "React / TypeScript",
    teamworkValue: "Planning / Ownership",
    goalEyebrow: "Where I am heading",
    goalTitle: "Reliable systems. Real value. Continuous growth.",
    goal:
      "My goal is to become a backend developer who can design scalable systems, write maintainable software, and create products that solve real problems. I am not chasing technology for its own sake. I am learning how to make technology useful.",
    finalLabel: "Bùi Minh Nhựt",
    finalRole: "Software Engineer / StayHub Project Leader",
  },
  vi: {
    eyebrow: "Portfolio / Kỹ sư phần mềm",
    greeting: "Xin chào, tôi là",
    name: "Bùi Minh Nhựt.",
    headline: "Tôi xây dựng hệ thống phía sau những hành trình liền mạch.",
    intro:
      "Sinh viên Công nghệ Thông tin tại Đại học FPT, định hướng Backend Developer và là Project Leader của StayHub.",
    status: "Luôn sẵn sàng học hỏi, xây dựng và đón nhận thử thách",
    explore: "Khám phá StayHub",
    discover: "Xem hành trình của tôi",
    role: "Project Leader",
    project: "StayHub",
    roleCaption: "Hệ sinh thái booking du lịch",
    aboutEyebrow: "Không chỉ là code",
    aboutTitle: "Xây dựng rõ ràng. Dẫn dắt có trách nhiệm.",
    aboutParagraphs: [
      "Tôi có niềm yêu thích mạnh mẽ với kỹ thuật phần mềm và phát triển backend. Tôi thích biến các yêu cầu nghiệp vụ phức tạp thành API sạch, kiến trúc dễ bảo trì, luồng dữ liệu đáng tin cậy và giao diện tự nhiên với người dùng.",
      "Qua các dự án học tập và làm việc nhóm, tôi đã trực tiếp phát triển hệ thống quản lý du lịch, booking, xác thực, phân quyền theo vai trò, thanh toán và dashboard quản trị. Mỗi thử thách giúp tôi giải quyết vấn đề tốt hơn, giao tiếp quyết định rõ hơn và phối hợp đội nhóm hiệu quả hơn.",
    ],
    quote:
      "Mỗi dự án là một hành trình nhỏ: ý tưởng trở thành tính năng, thử thách trở thành bài học, và từng dòng code đưa tôi gần hơn đến lập trình viên mà mình muốn trở thành.",
    leadershipEyebrow: "Vai trò lãnh đạo",
    leadershipTitle: "Phạm vi tôi đảm nhiệm tại StayHub",
    leadershipDescription:
      "Là Project Leader của StayHub, tôi kết nối yêu cầu sản phẩm với quá trình triển khai kỹ thuật và trực tiếp phụ trách ba mảng cốt lõi.",
    focus: {
      tour: {
        title: "Quản lý Tour",
        description:
          "Vòng đời tour, danh mục, cấu hình vé, số lượng, phân quyền và luồng vận hành của quản lý tour.",
      },
      itinerary: {
        title: "Lịch trình",
        description:
          "Lịch trình tour và chuyến đi linh hoạt, dữ liệu địa điểm, hoạt động từng ngày và kế hoạch vận hành.",
      },
      booking: {
        title: "Booking",
        description:
          "Tạo đơn, tồn kho vé, tính đúng giá, luồng thanh toán và toàn bộ trải nghiệm đặt tour của khách hàng.",
      },
    },
    stackEyebrow: "Bộ công cụ kỹ thuật",
    stackTitle: "Từ cơ sở dữ liệu đến giao diện.",
    stackDescription:
      "Tôi làm việc xuyên suốt hệ thống, tập trung mạnh vào kiến trúc backend, nghiệp vụ và khả năng tích hợp ổn định.",
    backend: "Backend & API",
    data: "Dữ liệu & lưu trữ",
    frontend: "Trải nghiệm frontend",
    teamwork: "Lãnh đạo & teamwork",
    backendValue: ".NET / ASP.NET Core",
    dataValue: "EF Core / SQL Server",
    frontendValue: "React / TypeScript",
    teamworkValue: "Lập kế hoạch / Ownership",
    goalEyebrow: "Đích đến của tôi",
    goalTitle: "Hệ thống tin cậy. Giá trị thực tế. Không ngừng tiến lên.",
    goal:
      "Mục tiêu của tôi là trở thành một Backend Developer có thể thiết kế hệ thống mở rộng tốt, viết phần mềm dễ bảo trì và tạo ra sản phẩm giải quyết vấn đề thực tế. Tôi không chạy theo công nghệ chỉ vì nó mới; tôi học cách biến công nghệ thành giá trị.",
    finalLabel: "Bùi Minh Nhựt",
    finalRole: "Software Engineer / StayHub Project Leader",
  },
};

export default function NhutPortfolioPage() {
  const { locale } = useTranslation();
  const copy = locale === "vi" ? content.vi : content.en;

  const stackCards = [
    { icon: ServerCog, label: copy.backend, value: copy.backendValue },
    { icon: Database, label: copy.data, value: copy.dataValue },
    { icon: Braces, label: copy.frontend, value: copy.frontendValue },
    { icon: Users, label: copy.teamwork, value: copy.teamworkValue },
  ];

  return (
    <div className="overflow-hidden bg-[#f4f7fb] text-slate-900">
      <section className="relative isolate min-h-[720px] overflow-hidden bg-[#060914] text-white">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="absolute -left-32 top-12 h-96 w-96 rounded-full bg-blue-600/25 blur-[120px]" />
        <div className="absolute -right-24 bottom-0 h-[420px] w-[420px] rounded-full bg-cyan-400/10 blur-[130px]" />

        <div className="page-container relative z-10 grid min-h-[720px] items-center gap-14 py-20 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-300 backdrop-blur-md">
              <Code2 className="h-4 w-4" />
              {copy.eyebrow}
            </div>

            <p className="mb-2 text-lg font-semibold text-white/55 md:text-xl">{copy.greeting}</p>
            <h1 className="max-w-4xl text-5xl font-black leading-[0.98] tracking-[-0.055em] md:text-7xl xl:text-[88px]">
              {copy.name}
            </h1>
            <h2 className="mt-6 max-w-3xl bg-gradient-to-r from-white via-blue-100 to-cyan-300 bg-clip-text text-2xl font-extrabold leading-tight text-transparent md:text-4xl">
              {copy.headline}
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 md:text-lg">
              {copy.intro}
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                to={PATH.PUBLIC.TOURS}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white !no-underline shadow-[0_16px_45px_rgba(37,99,235,0.35)] transition hover:-translate-y-0.5 hover:bg-blue-500"
              >
                {copy.explore}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#leadership"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.06] px-5 py-3 text-sm font-bold text-white !no-underline backdrop-blur-md transition hover:border-white/30 hover:bg-white/10"
              >
                {copy.discover}
                <ArrowDownRight className="h-4 w-4" />
              </a>
            </div>

            <div className="mt-10 flex items-center gap-3 text-sm text-slate-400">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400" />
              </span>
              {copy.status}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[440px]">
            <div className="absolute -inset-5 rotate-3 rounded-[2.5rem] border border-cyan-300/20 bg-gradient-to-br from-blue-500/20 to-cyan-300/5" />
            <div className="relative overflow-hidden rounded-[2.25rem] border border-white/15 bg-white/5 p-3 shadow-2xl backdrop-blur-xl">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] bg-slate-800">
                <img
                  src={minhNhutPhoto}
                  alt="Bùi Minh Nhựt"
                  className="h-full w-full scale-105 object-cover transition duration-700 hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#060914] via-transparent to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                    <BadgeCheck className="h-4 w-4" />
                    {copy.role}
                  </div>
                  <p className="text-3xl font-black">{copy.project}</p>
                  <p className="mt-1 text-sm text-white/60">{copy.roleCaption}</p>
                </div>
              </div>
            </div>
            <div className="absolute -left-8 top-20 hidden rounded-2xl border border-white/10 bg-[#111827]/90 p-4 shadow-xl backdrop-blur-xl sm:block">
              <Rocket className="h-6 w-6 text-cyan-300" />
            </div>
            <div className="absolute -right-8 bottom-24 hidden rounded-2xl border border-white/10 bg-[#111827]/90 p-4 shadow-xl backdrop-blur-xl sm:block">
              <Layers3 className="h-6 w-6 text-blue-400" />
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="page-container py-20 md:py-28">
        <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600">
              {copy.aboutEyebrow}
            </p>
            <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight text-[#081329] md:text-5xl">
              {copy.aboutTitle}
            </h2>
          </div>
          <div className="space-y-6">
            {copy.aboutParagraphs.map((paragraph) => (
              <p key={paragraph} className="text-base leading-8 text-slate-600 md:text-lg">
                {paragraph}
              </p>
            ))}
            <blockquote className="relative overflow-hidden rounded-3xl bg-[#081329] p-7 text-lg font-semibold leading-8 text-white shadow-xl md:p-9 md:text-xl">
              <Sparkles className="mb-5 h-7 w-7 text-cyan-300" />
              “{copy.quote}”
              <div className="absolute -bottom-16 -right-16 h-44 w-44 rounded-full bg-blue-500/20 blur-3xl" />
            </blockquote>
          </div>
        </div>
      </section>

      <section id="leadership" className="bg-[#081329] py-20 text-white md:py-28">
        <div className="page-container">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
                {copy.leadershipEyebrow}
              </p>
              <h2 className="mt-4 max-w-3xl text-3xl font-black tracking-tight md:text-5xl">
                {copy.leadershipTitle}
              </h2>
            </div>
            <p className="max-w-xl text-base leading-7 text-slate-300">
              {copy.leadershipDescription}
            </p>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {focusAreas.map(({ icon: Icon, key, number }) => {
              const item = copy.focus[key];
              return (
                <article
                  key={key}
                  className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.045] p-7 transition duration-300 hover:-translate-y-1 hover:border-cyan-300/30 hover:bg-white/[0.07]"
                >
                  <div className="mb-12 flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/25">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="font-mono text-sm text-white/30">{number}</span>
                  </div>
                  <h3 className="text-xl font-black">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-400">{item.description}</p>
                  <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-blue-500 to-cyan-300 transition-all duration-500 group-hover:w-full" />
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="page-container py-20 md:py-28">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600">
              {copy.stackEyebrow}
            </p>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-[#081329] md:text-5xl">
              {copy.stackTitle}
            </h2>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-600">
              {copy.stackDescription}
            </p>
            <div className="mt-7 flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full border border-blue-100 bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-700"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {stackCards.map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_18px_50px_rgba(37,99,235,0.12)]"
              >
                <div className="mb-8 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#081329] text-cyan-300">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                  {label}
                </p>
                <p className="mt-2 text-lg font-black text-[#081329]">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="page-container pb-20 md:pb-28">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-blue-600 via-blue-700 to-[#081329] px-7 py-12 text-white shadow-2xl md:px-14 md:py-16">
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full border-[50px] border-white/5" />
          <div className="relative z-10 grid gap-10 lg:grid-cols-[1fr_0.55fr] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">
                {copy.goalEyebrow}
              </p>
              <h2 className="mt-4 max-w-3xl text-3xl font-black tracking-tight md:text-5xl">
                {copy.goalTitle}
              </h2>
              <p className="mt-6 max-w-3xl text-base leading-8 text-blue-100">{copy.goal}</p>
            </div>
            <div className="rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur-md">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-blue-700">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-black">{copy.finalLabel}</p>
                  <p className="text-xs text-blue-100">{copy.finalRole}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 border-t border-white/15 pt-5 text-sm font-semibold text-cyan-200">
                <BookOpen className="h-4 w-4" />
                FPT University
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
