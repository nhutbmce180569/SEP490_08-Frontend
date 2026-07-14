import { useMemo } from "react";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  FileText,
  LayoutDashboard,
  Star,
  Ticket,
  TicketPercent,
  ShieldAlert,
  MapPin,
} from "lucide-react";

import { PATH } from "../config/routes/route";
import { useTranslation } from "../contexts/LocaleContext";
import { DashboardShell } from "./shared/DashboardShell";
import type { AdminSidebarGroup } from "./Sidebar";

const iconClass = "h-[18px] w-[18px]";

export const DashboardLayout = () => {
  const { t } = useTranslation();

  const groups = useMemo<AdminSidebarGroup[]>(
    () => [
      {
        title: t("manager.overview"),
        items: [
          {
            label: t("manager.customerAnalytics"),
            to: PATH.MANAGER.CUSTOMER_ANALYTICS,
            icon: <BarChart3 className={iconClass} />,
          },
          {
            label: t("manager.bookingStatistics"),
            to: PATH.MANAGER.BOOKING_STATISTICS,
            icon: <TicketPercent className={iconClass} />,
          },
        ],
      },
      {
        title: t("manager.toursSchedules"),
        items: [
          {
            label: t("manager.myTours"),
            to: PATH.MANAGER.MY_TOURS,
            icon: <BookOpen className={iconClass} />,
          },
          {
            label: t("manager.schedules"),
            to: PATH.MANAGER.SCHEDULE_MANAGEMENT,
            icon: <CalendarDays className={iconClass} />,
          },
          {
            label: t("manager.locations") || "Bản đồ định vị",
            to: PATH.MANAGER.LOCATIONS,
            icon: <MapPin className={iconClass} />,
          },
        ],
      },
      {
        title: t("manager.sales"),
        items: [
          {
            label: t("manager.cancellations"),
            to: PATH.MANAGER.CANCELLATION_REQUESTS,
            icon: <FileText className={iconClass} />,
          },
          {
            label: t("manager.vouchers"),
            to: PATH.MANAGER.VOUCHERS,
            icon: <Ticket className={iconClass} />,
          },
        ],
      },
      {
        title: t("manager.insights"),
        items: [
          {
            label: t("manager.reviews"),
            to: PATH.MANAGER.REVIEWS,
            icon: <Star className={iconClass} />,
          },
          {
            label: t("manager.moderation") || "Kiểm duyệt nội dung",
            to: PATH.MANAGER.MODERATION,
            icon: <ShieldAlert className={iconClass} />,
          },
        ],
      },
    ],
    [t],
  );

  return (
    <DashboardShell
      role="partner"
      logoLink={PATH.MANAGER.DASHBOARD}
      groups={groups}
      defaultTitle={t("manager.partnerDashboard")}
      badge={
        <span className="rounded-full bg-brand-light px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand">
          {t("manager.partner")}
        </span>
      }
    />
  );
};
