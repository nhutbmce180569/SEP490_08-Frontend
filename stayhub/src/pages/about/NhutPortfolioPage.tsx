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
import { useEffect, useRef, useState } from "react";
import { PATH } from "../../config/routes/route";
import { useTranslation } from "../../contexts/LocaleContext";
import minhNhutPhoto from "../../assets/team/minhnhut.png";

/* ─── data ───────────────────────────────────────────────────── */

const skills = [".NET", "ASP.NET Core", "Entity Framework Core", "SQL Server", "React", "TypeScript"];

const focusAreas = [
  { icon: MapPinned, key: "tour", number: "01" },
  { icon: CalendarDays, key: "itinerary", number: "02" },
  { icon: TicketCheck, key: "booking", number: "03" },
] as const;

const content = {
  en: {
    eyebrow: "Portfolio / Software Engineer",
    greeting: "Hi, I'm",
    name: "Bùi Minh Nhựt.",
    headline: "I build the systems behind seamless journeys.",
    intro: "An Information Technology student at FPT University, backend-focused software engineer, and Project Leader of StayHub.",
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
    quote: "Every project is a small journey: ideas become features, challenges become lessons, and each line of code moves me closer to the developer I want to become.",
    leadershipEyebrow: "Project leadership",
    leadershipTitle: "My ownership in StayHub",
    leadershipDescription: "As StayHub's Project Leader, I connect product requirements with technical execution and take direct ownership of three core domains.",
    focus: {
      tour: { title: "Tour Management", description: "Tour lifecycle, categories, ticket configuration, availability, permissions, and manager workflows." },
      itinerary: { title: "Itinerary", description: "Flexible tour and schedule itineraries, location data, daily activities, and operational planning." },
      booking: { title: "Booking", description: "Order creation, ticket inventory, pricing integrity, payment flow, and the customer booking experience." },
    },
    stackEyebrow: "Technical toolkit",
    stackTitle: "From database to interface.",
    stackDescription: "I work across the stack, with a strong focus on backend architecture, business logic, and dependable system integration.",
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
    goal: "My goal is to become a backend developer who can design scalable systems, write maintainable software, and create products that solve real problems. I am not chasing technology for its own sake. I am learning how to make technology useful.",
    finalLabel: "Bùi Minh Nhựt",
    finalRole: "Software Engineer / StayHub Project Leader",
  },
  vi: {
    eyebrow: "Portfolio / Kỹ sư phần mềm",
    greeting: "Xin chào, tôi là",
    name: "Bùi Minh Nhựt.",
    headline: "Tôi xây dựng hệ thống phía sau những hành trình liền mạch.",
    intro: "Sinh viên Công nghệ Thông tin tại Đại học FPT, định hướng Backend Developer và là Project Leader của StayHub.",
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
    quote: "Mỗi dự án là một hành trình nhỏ: ý tưởng trở thành tính năng, thử thách trở thành bài học, và từng dòng code đưa tôi gần hơn đến lập trình viên mà mình muốn trở thành.",
    leadershipEyebrow: "Vai trò lãnh đạo",
    leadershipTitle: "Phạm vi tôi đảm nhiệm tại StayHub",
    leadershipDescription: "Là Project Leader của StayHub, tôi kết nối yêu cầu sản phẩm với quá trình triển khai kỹ thuật và trực tiếp phụ trách ba mảng cốt lõi.",
    focus: {
      tour: { title: "Quản lý Tour", description: "Vòng đời tour, danh mục, cấu hình vé, số lượng, phân quyền và luồng vận hành của quản lý tour." },
      itinerary: { title: "Lịch trình", description: "Lịch trình tour và chuyến đi linh hoạt, dữ liệu địa điểm, hoạt động từng ngày và kế hoạch vận hành." },
      booking: { title: "Booking", description: "Tạo đơn, tồn kho vé, tính đúng giá, luồng thanh toán và toàn bộ trải nghiệm đặt tour của khách hàng." },
    },
    stackEyebrow: "Bộ công cụ kỹ thuật",
    stackTitle: "Từ cơ sở dữ liệu đến giao diện.",
    stackDescription: "Tôi làm việc xuyên suốt hệ thống, tập trung mạnh vào kiến trúc backend, nghiệp vụ và khả năng tích hợp ổn định.",
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
    goal: "Mục tiêu của tôi là trở thành một Backend Developer có thể thiết kế hệ thống mở rộng tốt, viết phần mềm dễ bảo trì và tạo ra sản phẩm giải quyết vấn đề thực tế. Tôi không chạy theo công nghệ chỉ vì nó mới; tôi học cách biến công nghệ thành giá trị.",
    finalLabel: "Bùi Minh Nhựt",
    finalRole: "Software Engineer / StayHub Project Leader",
  },
};

/* ─── Particle canvas ─────────────────────────────────────────── */
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let animId: number;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const N = 80;
    type P = { x: number; y: number; vx: number; vy: number; r: number; o: number };
    const pts: P[] = Array.from({ length: N }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5,
      o: Math.random() * 0.5 + 0.15,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pts.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99,179,237,${p.o})`;
        ctx.fill();
      });
      // connections
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(99,179,237,${0.12 * (1 - dist / 110)})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />;
}

/* ─── Animated counter ────────────────────────────────────────── */
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      let start = 0;
      const step = () => {
        start += Math.ceil(to / 40);
        if (start >= to) { setVal(to); return; }
        setVal(start);
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to]);
  return <span ref={ref}>{val}{suffix}</span>;
}

/* ─── Reveal on scroll ────────────────────────────────────────── */
function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(32px)",
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ─── Glitch text ─────────────────────────────────────────────── */
function GlitchText({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`nhut-glitch ${className}`} data-text={children as string}>
      {children}
    </span>
  );
}

/* ─── Main component ──────────────────────────────────────────── */
export default function NhutPortfolioPage() {
  const { locale } = useTranslation();
  const copy = locale === "vi" ? content.vi : content.en;

  const stackCards = [
    { icon: ServerCog, label: copy.backend, value: copy.backendValue, accent: "#3b82f6" },
    { icon: Database, label: copy.data, value: copy.dataValue, accent: "#06b6d4" },
    { icon: Braces, label: copy.frontend, value: copy.frontendValue, accent: "#8b5cf6" },
    { icon: Users, label: copy.teamwork, value: copy.teamworkValue, accent: "#10b981" },
  ];

  return (
    <>
      {/* ── Global keyframes ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap');

        .nhut-portfolio { font-family: 'Space Grotesk', sans-serif; }
        .nhut-mono { font-family: 'JetBrains Mono', monospace; }

        @keyframes nhut-float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-12px) rotate(1deg); }
          66% { transform: translateY(-6px) rotate(-1deg); }
        }
        @keyframes nhut-spin-slow {
          to { transform: rotate(360deg); }
        }
        @keyframes nhut-pulse-ring {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes nhut-scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes nhut-glitch-1 {
          0%,100% { clip-path: inset(0 0 98% 0); transform: translate(-2px,0); }
          20% { clip-path: inset(30% 0 50% 0); transform: translate(2px,0); }
          40% { clip-path: inset(60% 0 20% 0); transform: translate(-1px,0); }
          60% { clip-path: inset(80% 0 5% 0); transform: translate(3px,0); }
          80% { clip-path: inset(10% 0 75% 0); transform: translate(-2px,0); }
        }
        @keyframes nhut-glitch-2 {
          0%,100% { clip-path: inset(50% 0 30% 0); transform: translate(2px,0); }
          25% { clip-path: inset(5% 0 85% 0); transform: translate(-2px,0); }
          50% { clip-path: inset(75% 0 10% 0); transform: translate(1px,0); }
          75% { clip-path: inset(20% 0 65% 0); transform: translate(-3px,0); }
        }
        @keyframes nhut-border-dance {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes nhut-data-stream {
          0% { opacity: 0; transform: translateY(-10px); }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { opacity: 0; transform: translateY(10px); }
        }
        @keyframes nhut-glow-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(59,130,246,0.3), 0 0 60px rgba(59,130,246,0.1); }
          50% { box-shadow: 0 0 40px rgba(59,130,246,0.5), 0 0 100px rgba(59,130,246,0.2); }
        }
        @keyframes nhut-shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes nhut-typewriter {
          from { width: 0; }
          to { width: 100%; }
        }

        .nhut-glitch {
          position: relative;
          display: inline-block;
        }
        .nhut-glitch::before,
        .nhut-glitch::after {
          content: attr(data-text);
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
        }
        .nhut-glitch:hover::before {
          animation: nhut-glitch-1 0.4s steps(1) infinite;
          color: #06b6d4;
          z-index: 1;
        }
        .nhut-glitch:hover::after {
          animation: nhut-glitch-2 0.4s steps(1) infinite;
          color: #3b82f6;
          z-index: 2;
        }

        .nhut-card-glow:hover {
          animation: nhut-glow-pulse 2s ease-in-out infinite;
        }

        .nhut-gradient-border {
          position: relative;
          background: linear-gradient(135deg, #3b82f6, #06b6d4, #8b5cf6, #3b82f6);
          background-size: 300% 300%;
          animation: nhut-border-dance 4s ease infinite;
          padding: 1px;
          border-radius: 1rem;
        }
        .nhut-gradient-border > * {
          border-radius: calc(1rem - 1px);
        }

        .nhut-shimmer-text {
          background: linear-gradient(90deg, #fff 0%, #06b6d4 25%, #fff 50%, #3b82f6 75%, #fff 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: nhut-shimmer 4s linear infinite;
        }

        .nhut-float { animation: nhut-float 6s ease-in-out infinite; }
        .nhut-float-delay { animation: nhut-float 6s ease-in-out 2s infinite; }

        .nhut-skill-tag {
          position: relative;
          overflow: hidden;
        }
        .nhut-skill-tag::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(99,179,237,0.2), transparent);
          transform: translateX(-100%);
          transition: transform 0.4s;
        }
        .nhut-skill-tag:hover::before {
          transform: translateX(100%);
        }

        .nhut-scanline-container {
          position: relative;
          overflow: hidden;
        }
        .nhut-scanline-container::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(6,182,212,0.4), transparent);
          animation: nhut-scanline 3s linear infinite;
          pointer-events: none;
        }

        .nhut-hex-bg {
          background-image: url("data:image/svg+xml,%3Csvg width='60' height='52' viewBox='0 0 60 52' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 17.3v17.3L30 52 0 34.6V17.3z' fill='none' stroke='rgba(59,130,246,0.06)' stroke-width='1'/%3E%3C/svg%3E");
          background-size: 60px 52px;
        }

        @media (prefers-reduced-motion: reduce) {
          .nhut-float, .nhut-float-delay, .nhut-shimmer-text,
          .nhut-gradient-border, .nhut-scanline-container::after {
            animation: none !important;
          }
        }
      `}</style>

      <div className="nhut-portfolio overflow-hidden bg-[#03060f] text-slate-100">

        {/* ═══════════════ HERO ═══════════════ */}
        <section className="relative isolate min-h-screen overflow-hidden bg-[#03060f]">

          {/* Particle canvas */}
          <ParticleField />

          {/* Grid overlay */}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />

          {/* Ambient blobs */}
          <div className="pointer-events-none absolute -left-40 top-0 h-[600px] w-[600px] rounded-full bg-blue-600/20 blur-[140px]" />
          <div className="pointer-events-none absolute -right-40 bottom-0 h-[500px] w-[500px] rounded-full bg-cyan-400/15 blur-[150px]" />
          <div className="pointer-events-none absolute left-1/2 top-1/3 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-violet-600/10 blur-[120px]" />

          <div className="page-container relative z-10 grid min-h-screen items-center gap-14 py-24 lg:grid-cols-[1.15fr_0.85fr]">

            {/* Left col */}
            <div>
              {/* Eyebrow badge */}
              <Reveal>
                <div className="nhut-mono mb-8 inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-400 backdrop-blur-md">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
                  </span>
                  <Code2 className="h-3.5 w-3.5" />
                  {copy.eyebrow}
                </div>
              </Reveal>

              <Reveal delay={100}>
                <p className="nhut-mono mb-2 text-sm font-medium tracking-widest text-white/40">
                  {copy.greeting}
                </p>
              </Reveal>

              <Reveal delay={200}>
                <h1 className="max-w-4xl text-5xl font-black leading-[0.95] tracking-[-0.04em] text-white md:text-7xl xl:text-[84px]">
                  <GlitchText>{copy.name}</GlitchText>
                </h1>
              </Reveal>

              <Reveal delay={300}>
                <h2 className="nhut-shimmer-text mt-6 max-w-3xl text-xl font-bold leading-snug md:text-3xl">
                  {copy.headline}
                </h2>
              </Reveal>

              <Reveal delay={400}>
                <p className="mt-5 max-w-xl text-base leading-7 text-slate-400 md:text-lg">
                  {copy.intro}
                </p>
              </Reveal>

              <Reveal delay={500}>
                <div className="mt-9 flex flex-wrap gap-3">
                  <Link
                    to={PATH.PUBLIC.TOURS}
                    className="nhut-card-glow group inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white !no-underline shadow-[0_8px_32px_rgba(37,99,235,0.4)] transition-all duration-300 hover:-translate-y-1 hover:bg-blue-500 hover:shadow-[0_12px_48px_rgba(37,99,235,0.6)]"
                  >
                    {copy.explore}
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                  <a
                    href="#leadership"
                    className="group inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3.5 text-sm font-bold text-white !no-underline backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/40 hover:bg-white/[0.08]"
                  >
                    {copy.discover}
                    <ArrowDownRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:translate-y-0.5" />
                  </a>
                </div>
              </Reveal>

              <Reveal delay={600}>
                <div className="nhut-mono mt-10 flex items-center gap-3 text-xs text-slate-500">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  </span>
                  {copy.status}
                </div>
              </Reveal>
            </div>

            {/* Right col – Photo card */}
            <Reveal delay={200} className="relative mx-auto w-full max-w-[400px]">
              {/* Spinning ring */}
              <div className="pointer-events-none absolute -inset-4 rounded-[2.5rem] border border-blue-500/20"
                style={{ animation: "nhut-spin-slow 20s linear infinite" }} />
              <div className="pointer-events-none absolute -inset-8 rounded-[3rem] border border-cyan-400/10"
                style={{ animation: "nhut-spin-slow 30s linear infinite reverse" }} />

              {/* Glow halo */}
              <div className="pointer-events-none absolute inset-0 rounded-[2.5rem] bg-blue-600/20 blur-2xl" />

              {/* Card */}
              <div className="nhut-scanline-container relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] p-3 shadow-2xl backdrop-blur-xl">
                <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem] bg-slate-800">
                  <img
                    src={minhNhutPhoto}
                    alt="Bùi Minh Nhựt"
                    className="h-full w-full scale-105 object-cover transition duration-700 hover:scale-110"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#03060f] via-[#03060f]/30 to-transparent" />

                  {/* Scan lines texture */}
                  <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_3px,rgba(0,0,0,0.08)_3px,rgba(0,0,0,0.08)_4px)]" />

                  {/* Badge overlay */}
                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <div className="nhut-mono mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      {copy.role}
                    </div>
                    <p className="text-2xl font-black text-white">{copy.project}</p>
                    <p className="mt-1 text-xs text-white/50">{copy.roleCaption}</p>
                  </div>
                </div>
              </div>

              {/* Floating badges */}
              <div className="nhut-float absolute -left-10 top-16 hidden rounded-2xl border border-white/8 bg-[#080d1a]/90 p-3.5 shadow-xl backdrop-blur-xl sm:block">
                <Rocket className="h-5 w-5 text-cyan-400" />
              </div>
              <div className="nhut-float-delay absolute -right-10 bottom-20 hidden rounded-2xl border border-white/8 bg-[#080d1a]/90 p-3.5 shadow-xl backdrop-blur-xl sm:block">
                <Layers3 className="h-5 w-5 text-blue-400" />
              </div>
            </Reveal>
          </div>

          {/* Scroll hint */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
            <div className="nhut-mono text-[10px] uppercase tracking-widest text-slate-500">scroll</div>
            <div className="h-8 w-px bg-gradient-to-b from-slate-500 to-transparent" />
          </div>
        </section>

        {/* ═══════════════ STATS BAR ═══════════════ */}
        <section className="nhut-hex-bg border-y border-white/5 bg-[#05091a] py-10">
          <div className="page-container">
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {[
                { n: 3, s: "+", label: "Core domains" },
                { n: 6, s: "", label: "Tech skills" },
                { n: 1, s: "", label: "Project led" },
                { n: 100, s: "%", label: "Ownership" },
              ].map(({ n, s, label }, i) => (
                <Reveal key={label} delay={i * 80}>
                  <div className="text-center">
                    <p className="nhut-mono text-3xl font-black text-white md:text-4xl">
                      <Counter to={n} suffix={s} />
                    </p>
                    <p className="nhut-mono mt-1 text-xs uppercase tracking-widest text-slate-500">{label}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════ ABOUT ═══════════════ */}
        <section id="about" className="page-container py-24 md:py-32">
          <div className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
            <div>
              <Reveal>
                <p className="nhut-mono text-xs font-bold uppercase tracking-[0.22em] text-blue-500">
                  {copy.aboutEyebrow}
                </p>
                <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight text-white md:text-5xl">
                  {copy.aboutTitle}
                </h2>
              </Reveal>

              {/* Decorative vertical line */}
              <div className="mt-10 hidden w-px self-stretch bg-gradient-to-b from-blue-500/50 via-cyan-400/30 to-transparent lg:block" style={{ height: "80px" }} />
            </div>

            <div className="space-y-6">
              {copy.aboutParagraphs.map((p, i) => (
                <Reveal key={i} delay={i * 150}>
                  <p className="text-base leading-8 text-slate-400 md:text-lg">{p}</p>
                </Reveal>
              ))}

              <Reveal delay={300}>
                <div className="nhut-gradient-border mt-4">
                  <blockquote className="relative overflow-hidden bg-[#080d1a] p-7 md:p-9">
                    <Sparkles className="mb-4 h-6 w-6 text-cyan-400" />
                    <p className="text-base font-semibold leading-8 text-slate-200 md:text-lg">
                      "{copy.quote}"
                    </p>
                    {/* ambient glow */}
                    <div className="pointer-events-none absolute -bottom-16 -right-16 h-48 w-48 rounded-full bg-blue-500/15 blur-3xl" />
                  </blockquote>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ═══════════════ LEADERSHIP ═══════════════ */}
        <section id="leadership" className="relative overflow-hidden py-24 text-white md:py-32">
          {/* Background */}
          <div className="absolute inset-0 bg-[#050914]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.04)_1px,transparent_1px)] bg-[size:32px_32px]" />
          <div className="pointer-events-none absolute -left-32 top-1/2 h-[600px] w-[600px] -translate-y-1/2 rounded-full bg-blue-700/10 blur-[160px]" />

          <div className="page-container relative z-10">
            <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-end">
              <Reveal>
                <p className="nhut-mono text-xs font-bold uppercase tracking-[0.22em] text-cyan-400">
                  {copy.leadershipEyebrow}
                </p>
                <h2 className="mt-4 max-w-3xl text-3xl font-black tracking-tight md:text-5xl">
                  {copy.leadershipTitle}
                </h2>
              </Reveal>
              <Reveal delay={150}>
                <p className="max-w-xl text-base leading-7 text-slate-400">
                  {copy.leadershipDescription}
                </p>
              </Reveal>
            </div>

            <div className="mt-14 grid gap-5 lg:grid-cols-3">
              {focusAreas.map(({ icon: Icon, key, number }, idx) => {
                const item = copy.focus[key];
                return (
                  <Reveal key={key} delay={idx * 100}>
                    <article className="nhut-card-glow group relative overflow-hidden rounded-[1.75rem] border border-white/8 bg-white/[0.03] p-7 transition-all duration-500 hover:-translate-y-2 hover:border-cyan-500/30 hover:bg-white/[0.06]">
                      {/* Corner accent */}
                      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-blue-600/10 blur-2xl transition-all duration-500 group-hover:bg-blue-500/20" />

                      <div className="mb-12 flex items-start justify-between">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-700/30">
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="nhut-mono text-xs text-white/20">{number}</span>
                      </div>

                      <h3 className="text-lg font-black text-white">{item.title}</h3>
                      <p className="mt-3 text-sm leading-6 text-slate-500">{item.description}</p>

                      {/* Bottom progress bar */}
                      <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 transition-all duration-700 group-hover:w-full" />
                    </article>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* ═══════════════ STACK ═══════════════ */}
        <section className="page-container py-24 md:py-32">
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <Reveal>
              <p className="nhut-mono text-xs font-bold uppercase tracking-[0.22em] text-blue-500">
                {copy.stackEyebrow}
              </p>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-white md:text-5xl">
                {copy.stackTitle}
              </h2>
              <p className="mt-5 max-w-lg text-base leading-7 text-slate-400">
                {copy.stackDescription}
              </p>

              {/* Skill tags */}
              <div className="mt-7 flex flex-wrap gap-2">
                {skills.map((skill, i) => (
                  <span
                    key={skill}
                    className="nhut-mono nhut-skill-tag cursor-default rounded-full border border-blue-500/25 bg-blue-500/8 px-4 py-2 text-xs font-bold text-blue-300 transition-all duration-300 hover:border-cyan-400/50 hover:bg-cyan-400/10 hover:text-cyan-300"
                    style={{ transitionDelay: `${i * 30}ms` }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </Reveal>

            <div className="grid gap-4 sm:grid-cols-2">
              {stackCards.map(({ icon: Icon, label, value, accent }, i) => (
                <Reveal key={label} delay={i * 80}>
                  <div
                    className="group relative overflow-hidden rounded-2xl border border-white/8 bg-white/[0.03] p-6 transition-all duration-400 hover:-translate-y-1.5"
                    style={{ "--accent": accent } as React.CSSProperties}
                  >
                    {/* Accent glow on hover */}
                    <div
                      className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-400 group-hover:opacity-100"
                      style={{ background: `radial-gradient(circle at 30% 30%, ${accent}15, transparent 70%)` }}
                    />

                    <div
                      className="mb-8 flex h-11 w-11 items-center justify-center rounded-xl shadow-lg"
                      style={{ background: `${accent}22`, color: accent, boxShadow: `0 4px 20px ${accent}30` }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <p className="nhut-mono text-xs font-bold uppercase tracking-widest text-slate-500">
                      {label}
                    </p>
                    <p className="mt-2 text-base font-black text-white">{value}</p>

                    {/* Bottom accent line */}
                    <div
                      className="absolute bottom-0 left-0 h-[1px] w-0 transition-all duration-500 group-hover:w-full"
                      style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }}
                    />
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════ GOAL / CTA ═══════════════ */}
        <section className="page-container pb-24 md:pb-32">
          <Reveal>
            <div className="relative overflow-hidden rounded-[2.5rem] border border-blue-500/20 bg-gradient-to-br from-[#0a1628] via-[#07122b] to-[#03060f] px-7 py-14 shadow-2xl md:px-14 md:py-20">

              {/* Grid texture */}
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.04)_1px,transparent_1px)] bg-[size:24px_24px] rounded-[2.5rem]" />

              {/* Ambient glows */}
              <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-600/20 blur-[80px]" />
              <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-cyan-400/10 blur-[80px]" />

              {/* Decorative ring */}
              <div className="pointer-events-none absolute right-12 top-12 h-32 w-32 rounded-full border border-white/5" />
              <div className="pointer-events-none absolute right-6 top-6 h-44 w-44 rounded-full border border-white/[0.03]" />

              <div className="relative z-10 grid gap-10 lg:grid-cols-[1fr_0.5fr] lg:items-end">
                <div>
                  <p className="nhut-mono text-xs font-bold uppercase tracking-[0.22em] text-cyan-400">
                    {copy.goalEyebrow}
                  </p>
                  <h2 className="mt-4 max-w-3xl text-3xl font-black tracking-tight text-white md:text-5xl">
                    {copy.goalTitle}
                  </h2>
                  <p className="mt-6 max-w-3xl text-base leading-8 text-slate-400">{copy.goal}</p>
                </div>

                {/* Card */}
                <div className="nhut-gradient-border">
                  <div className="bg-[#060b1a] p-6">
                    <div className="mb-5 flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-blue-700 shadow-lg">
                        <GraduationCap className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-black text-white">{copy.finalLabel}</p>
                        <p className="nhut-mono text-xs text-slate-500">{copy.finalRole}</p>
                      </div>
                    </div>
                    <div className="nhut-mono flex items-center gap-2 border-t border-white/8 pt-4 text-xs font-semibold text-cyan-400">
                      <BookOpen className="h-3.5 w-3.5" />
                      FPT University
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

      </div>
    </>
  );
}