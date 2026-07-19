import { useMemo } from "react";
import {
  BarChart3,
  Bot,
  Compass,
  Gift,
  Image,
  Layers,
  Map,
  PieChart,
  Ticket,
  Users,
  BadgePercent,
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
          {
            label: t("admin.revenueStatistics"),
            to: PATH.ADMIN.REVENUE_STATISTICS,
            icon: <PieChart className={iconClass} />,
          },
        ],
      },
      {
        title: t("admin.users"),
        items: [
          {
            label: t("admin.users"),
            headerTitle: t("admin.userManagement"),
            to: PATH.ADMIN.USER_MANAGEMENT,
            icon: <Users className={iconClass} />,
          },
        ],
      },
      {
        title: t("admin.tourContent"),
        items: [
          {
            label: t("admin.toursObj"),
            headerTitle: t("admin.tourManagement"),
            to: PATH.ADMIN.TOUR_MODERATION,
            icon: <Map className={iconClass} />,
          },
          {
            label: t("admin.banners"),
            headerTitle: t("admin.bannerManagement"),
            to: PATH.ADMIN.BANNER_MANAGEMENT,
            icon: <Image className={iconClass} />,
          },
          {
            label: t("admin.categoriesObj"),
            headerTitle: t("admin.categoryManagement"),
            to: PATH.ADMIN.CATEGORY_MANAGEMENT,
            icon: <Layers className={iconClass} />,
          },
          {
            label: t("admin.tourismInformation"),
            headerTitle: t("admin.tourismInformationManagement"),
            to: PATH.ADMIN.TOURISM_INFORMATION_MANAGEMENT,
            icon: <Compass className={iconClass} />,
          },
          {
            label: t("admin.ticketTypes"),
            headerTitle: t("admin.ticketTypeManagement"),
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
      {
        title: t("admin.marketing"),
        items: [
          {
            label: t("admin.vouchersObj"),
            headerTitle: t("admin.voucherManagement"),
            to: PATH.ADMIN.SYSTEM_VOUCHERS,
            icon: <Gift className={iconClass} />,
          },
          {
            label: t("admin.promotionsObj"),
            headerTitle: t("admin.promotionManagement"),
            to: PATH.ADMIN.SYSTEM_PROMOTIONS,
            icon: <BadgePercent className={iconClass} />,
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
