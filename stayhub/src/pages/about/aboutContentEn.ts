import type { AboutContent } from "./types";

export const aboutContentEn: AboutContent = {
  hero: {
    eyebrow: "About StayHub",
    title: "Smart tour booking ecosystem",
    subtitle:
      "An integrated travel platform for tours, payments, social features, and AI — built on microservices.",
    exploreTours: "Explore tours",
    stats: [
      { value: "10+", label: "Microservices" },
      { value: "5", label: "Developers" },
      { value: "1", label: "Mentor" },
    ],
  },
  system: {
    summary:
      "StayHub is a graduation project delivering end-to-end tour booking — combining web, mobile, and domain-split backend for customers, admins, staff, and partners.",
  },
  features: {
    title: "Key features",
    items: [
      { title: "Booking & payments", description: "Book, apply vouchers, pay, and manage orders." },
      { title: "AI assistant", description: "Tour suggestions, weather, and trip planning." },
      { title: "Travel social", description: "Moments, chat, and live itinerary tracking." },
      { title: "Multi-role admin", description: "Dashboards for admin, staff, and partners." },
      { title: "Microservices", description: ".NET backend split by domain via Gateway." },
      { title: "Mobile app", description: "Flutter app synced with the web platform." },
    ],
  },
  people: {
    mentorSection: {
      eyebrow: "Mentor",
      title: "Project mentor",
      subtitle: "Faculty guidance on architecture, code quality, and development process.",
      badge: "Mentor",
      member: {
        id: "mentor",
        name: "Mr. Vo Hoang Tu",
        role: "Instructor & mentor",
        summary:
          "Guides architecture, reviews code, and advises on business logic — helping the team build a rigorous product beyond a demo.",
        highlights: ["System architecture", "Code review", "Teamwork"],
      },
    },
    teamSection: {
      eyebrow: "Team",
      title: "Development team",
      subtitle: "Five full-stack developers responsible for StayHub's backend and frontend.",
      members: [
      {
        id: "bui-minh-nhut",
        name: "Bui Minh Nhut",
        role: "Project Leader / Full-stack Developer",
        summary:
          "Leads StayHub's technical execution and directly owns tour management, itinerary, and booking domains.",
        highlights: ["Project Leader", "Tour", "Itinerary", "Booking"],
      },
      {
        id: "ly-thi-kieu-thy",
        name: "Ly Thi Kieu Thy",
        role: "Full-stack Developer",
        summary: "User interfaces, API integration, and responsive layout.",
        highlights: ["UI/UX", "Frontend"],
      },
      {
        id: "pham-thanh-tu",
        name: "Pham Thanh Tu",
        role: "Full-stack Developer",
        summary: "Tour, schedule, booking modules and cross-service debugging.",
        highlights: ["Microservices", "Database"],
      },
      {
        id: "pham-vu-thanh-nguyen",
        name: "Pham Vu Thanh Nguyen",
        role: "Full-stack Developer",
        summary: "Authentication, real-time (chat, notifications), and state management.",
        highlights: ["Auth", "SignalR"],
      },
      {
        id: "mai-phuong-tuong",
        name: "Mai Phuong Tuong",
        role: "Full-stack Developer",
        summary: "Content, vouchers, complex forms, and business flow testing.",
        highlights: ["Content", "QA"],
      },
      ],
    },
  },
  tech: {
    title: "Tech stack",
    groups: [
      { label: "Frontend", items: ["React", "TypeScript", "Vite", "TailwindCSS"] },
      { label: "Backend", items: [".NET", "Microservices", "SignalR", "EF Core"] },
      { label: "Mobile", items: ["Flutter", "Dart"] },
      { label: "More", items: ["AI Assistant", "Docker", "REST API"] },
    ],
  },
  cta: {
    title: "Ready to explore?",
    browseTours: "Browse tours",
    aiAssistant: "AI Assistant",
  },
  card: {
    addPhoto: "Add photo",
    viewPortfolio: "View portfolio",
  },
};
