import { useMemo } from "react";
import {
  BarChart3,
  Bot,
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
import { useTranslation } from "../contexts/LocaleContext";
import { DashboardShell } from "./shared/DashboardShell";
import type { AdminSidebarGroup } from "./Sidebar";

const iconClass = "h-[18px] w-[18px]";

export const AdminLayout = () => {
  const { t } = useTranslation();

  const groups = useMemo<AdminSidebarGroup[]>(
    () => [
      {
        title: t("admin.analytics"),
        items: [
          {
            label: t("admin.platformAnalytics"),
            to: PATH.ADMIN.PLATFORM_ANALYTICS,
            icon: <PieChart className={iconClass} />,
          },
          {
            label: t("admin.customerAnalytics"),
            to: PATH.ADMIN.CUSTOMER_ANALYTICS,
            icon: <BarChart3 className={iconClass} />,
          },
        ],
      },
      {
        title: t("admin.users"),
        items: [
          {
            label: t("admin.usersList"),
            to: PATH.ADMIN.USER_MANAGEMENT,
            icon: <Users className={iconClass} />,
          },
        ],
      },
      {
        title: t("admin.tourContent"),
        items: [
          {
            label: t("admin.banners"),
            to: PATH.ADMIN.BANNER_MANAGEMENT,
            icon: <Image className={iconClass} />,
          },
          {
            label: t("admin.tourCategories"),
            to: PATH.ADMIN.CATEGORY_MANAGEMENT,
            icon: <Layers className={iconClass} />,
          },
          {
            label: t("admin.tourismInformation"),
            to: PATH.ADMIN.TOURISM_INFORMATION_MANAGEMENT,
            icon: <Compass className={iconClass} />,
          },
          {
            label: t("admin.ticketTypes"),
            to: PATH.ADMIN.TICKET_TYPE_MANAGEMENT,
            icon: <Ticket className={iconClass} />,
          },
        ],
      },
      {
        title: t("admin.aiSystems"),
        items: [
          {
            label: t("admin.aiConsole"),
            to: PATH.ADMIN.AI_CONSOLE,
            icon: <Bot className={iconClass} />,
          },
        ],
      },

    ],
    [t],
  );

  return (
    <DashboardShell
      role="admin"
      logoLink={PATH.ADMIN.DASHBOARD}
      groups={groups}
      defaultTitle={t("admin.adminDashboard")}
      badge={
        <span className="rounded-full bg-brand-light px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand">
          {t("admin.admin")}
        </span>
      }
    />
  );
};
