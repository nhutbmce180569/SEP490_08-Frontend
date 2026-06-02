import { useMemo } from "react";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  CircleDollarSign,
  FileText,
  LayoutDashboard,
  Star,
  Ticket,
  TicketPercent,
} from "lucide-react";

import { PATH } from "../config/routes/route";
import { DashboardShell } from "./shared/DashboardShell";
import type { AdminSidebarGroup } from "./Sidebar";

const iconClass = "h-[18px] w-[18px]";

export const DashboardLayout = () => {
  const groups = useMemo<AdminSidebarGroup[]>(
    () => [
      {
        title: "Overview",
        items: [
          {
            label: "Dashboard",
            to: PATH.MANAGER.DASHBOARD,
            icon: <LayoutDashboard className={iconClass} />,
          },
        ],
      },
      {
        title: "Tours & schedules",
        items: [
          {
            label: "My tours",
            to: PATH.MANAGER.MY_TOURS,
            icon: <BookOpen className={iconClass} />,
          },
          {
            label: "Schedules",
            to: PATH.MANAGER.SCHEDULE_MANAGEMENT,
            icon: <CalendarDays className={iconClass} />,
          },
        ],
      },
      {
        title: "Sales",
        items: [
          {
            label: "Bookings",
            to: PATH.MANAGER.BOOKING_MANAGEMENT,
            icon: <TicketPercent className={iconClass} />,
          },
          {
            label: "Cancellations",
            to: PATH.MANAGER.CANCELLATION_REQUESTS,
            icon: <FileText className={iconClass} />,
          },
          {
            label: "Vouchers",
            to: PATH.MANAGER.VOUCHERS,
            icon: <Ticket className={iconClass} />,
          },
        ],
      },
      {
        title: "Insights",
        items: [
          {
            label: "Reviews",
            to: PATH.MANAGER.REVIEWS,
            icon: <Star className={iconClass} />,
          },
          {
            label: "Customer analytics",
            to: PATH.MANAGER.CUSTOMER_ANALYTICS,
            icon: <BarChart3 className={iconClass} />,
          },
          {
            label: "Finance",
            to: PATH.MANAGER.PAYOUT,
            icon: <CircleDollarSign className={iconClass} />,
          },
        ],
      },
    ],
    [],
  );

  return (
    <DashboardShell
      role="partner"
      logoLink={PATH.MANAGER.DASHBOARD}
      groups={groups}
      defaultTitle="Partner dashboard"
      badge={
        <span className="rounded-full bg-brand-light px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand">
          Partner
        </span>
      }
    />
  );
};
