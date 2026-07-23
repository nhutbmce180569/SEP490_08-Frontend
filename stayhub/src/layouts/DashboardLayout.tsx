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
  PieChart,
  MessageCircle,
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
            label: t("dashboard.partnerDashboard"),
            to: PATH.MANAGER.DASHBOARD,
            icon: <LayoutDashboard className={iconClass} />,
          },
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
          {
            label: t("manager.revenueStatistics"),
            to: PATH.MANAGER.REVENUE_STATISTICS,
            icon: <PieChart className={iconClass} />,
          },
        ],
      },
      {
        title: t("manager.toursSchedules"),
        items: [
          {
            label: t("manager.toursObj"),
            headerTitle: t("manager.tourManagement"),
            to: PATH.MANAGER.MY_TOURS,
            icon: <BookOpen className={iconClass} />,
          },
          {
            label: t("manager.schedules"),
            headerTitle: t("manager.scheduleManagement"),
            to: PATH.MANAGER.SCHEDULE_MANAGEMENT,
            icon: <CalendarDays className={iconClass} />,
          },
          {
            label: t("manager.locationsObj"),
            headerTitle: t("manager.locationManagement"),
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
            headerTitle: t("manager.cancellationManagement"),
            to: PATH.MANAGER.CANCELLATION_REQUESTS,
            icon: <FileText className={iconClass} />,
          },
          {
            label: t("manager.vouchersObj"),
            headerTitle: t("manager.voucherManagement"),
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
            headerTitle: t("manager.reviewManagement"),
            to: PATH.MANAGER.REVIEWS,
            icon: <Star className={iconClass} />,
          },
          {
            label: t("manager.moderationObj"),
            headerTitle: t("manager.moderationManagement"),
            to: PATH.MANAGER.MODERATION,
            icon: <ShieldAlert className={iconClass} />,
          },
          {
            label: t("manager.trendPredictionObj"),
            headerTitle: t("manager.trendPredictionManagement"),
            to: PATH.MANAGER.TREND_PREDICTION,
            icon: <LayoutDashboard className={iconClass} />,
          },
        ],
      },
      {
        title: t("social.chat") || "Chat",
        items: [
          {
            label: t("social.chat") || "Chat",
            to: PATH.MANAGER.CHAT,
            icon: <MessageCircle className={iconClass} />,
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
      defaultTitle={t("manager.tourManagerDashboard") || "Tour Manager Dashboard"}
      badge={
        <span className="rounded-full bg-brand-light px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand">
          {t("manager.tourManager") ?? "TOUR MANAGER"}
        </span>
      }
    />
  );
};
