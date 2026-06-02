import {
  BarChart3,
  Building,
  Compass,
  CreditCard,
  Download,
  Image,
  Layers,
  Map,
  PieChart,
  Settings,
  ShieldAlert,
  Ticket,
  Users,
} from "lucide-react";

import { PATH } from "../config/routes/route";
import { DashboardShell } from "./shared/DashboardShell";
import type { AdminSidebarGroup } from "./Sidebar";

const iconClass = "h-[18px] w-[18px]";

const ADMIN_GROUPS: AdminSidebarGroup[] = [
  {
    title: "Analytics",
    items: [
      {
        label: "Platform analytics",
        to: PATH.ADMIN.PLATFORM_ANALYTICS,
        icon: <PieChart className={iconClass} />,
      },
      {
        label: "Customer analytics",
        to: PATH.ADMIN.CUSTOMER_ANALYTICS,
        icon: <BarChart3 className={iconClass} />,
      },
      {
        label: "System reports",
        to: "/admin/reports-export",
        icon: <Download className={iconClass} />,
      },
    ],
  },
  {
    title: "Users",
    items: [
      {
        label: "Users list",
        to: PATH.ADMIN.USER_MANAGEMENT,
        icon: <Users className={iconClass} />,
      },
      {
        label: "Partner approvals",
        to: PATH.ADMIN.PARTNER_APPROVAL,
        icon: <Building className={iconClass} />,
      },
    ],
  },
  {
    title: "Tour content",
    items: [
      {
        label: "Tour moderation",
        to: PATH.ADMIN.TOUR_MODERATION,
        icon: <Map className={iconClass} />,
      },
      {
        label: "Banners",
        to: PATH.ADMIN.BANNER_MANAGEMENT,
        icon: <Image className={iconClass} />,
      },
      {
        label: "Tour categories",
        to: PATH.ADMIN.CATEGORY_MANAGEMENT,
        icon: <Layers className={iconClass} />,
      },
      {
        label: "Tourism information",
        to: PATH.ADMIN.TOURISM_INFORMATION_MANAGEMENT,
        icon: <Compass className={iconClass} />,
      },
      {
        label: "Ticket types",
        to: PATH.ADMIN.TICKET_TYPE_MANAGEMENT,
        icon: <Ticket className={iconClass} />,
      },
    ],
  },
  {
    title: "Operations",
    items: [
      {
        label: "Violation reports",
        to: PATH.ADMIN.REPORT_MODERATION,
        icon: <ShieldAlert className={iconClass} />,
      },
      {
        label: "Withdrawal requests",
        to: PATH.ADMIN.WITHDRAWALS,
        icon: <CreditCard className={iconClass} />,
      },
      {
        label: "System vouchers",
        to: PATH.ADMIN.SYSTEM_VOUCHERS,
        icon: <Ticket className={iconClass} />,
      },
      {
        label: "Global settings",
        to: PATH.ADMIN.SYSTEM_SETTINGS,
        icon: <Settings className={iconClass} />,
      },
    ],
  },
];

export const AdminLayout = () => (
  <DashboardShell
    role="admin"
    logoLink={PATH.ADMIN.DASHBOARD}
    groups={ADMIN_GROUPS}
    defaultTitle="Admin dashboard"
    badge={
      <span className="rounded-full bg-brand-light px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand">
        Admin
      </span>
    }
  />
);
