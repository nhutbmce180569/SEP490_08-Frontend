import { useMemo } from "react";
import { Calendar, LayoutDashboard, MapPin, QrCode, Ticket, Users } from "lucide-react";

import { PATH } from "../config/routes/route";
import { useTranslation } from "../contexts/LocaleContext";
import { DashboardShell } from "./shared/DashboardShell";
import type { AdminSidebarGroup } from "./Sidebar";

const iconClass = "h-[18px] w-[18px]";

export const StaffLayout = () => {
  const { t } = useTranslation();

  // Gộp các menu của Staff vào một hoặc nhiều group giống như Admin
  const groups = useMemo<AdminSidebarGroup[]>(
    () => [
      {
        title: t("dashboard.operations"),
        items: [
          {
            label: t("dashboard.staffDashboard"),
            to: PATH.STAFF.DASHBOARD,
            icon: <LayoutDashboard className={iconClass} />,
          },
          {
            label: t("staff.assignedSchedules"),
            to: PATH.STAFF.SCHEDULES,
            icon: <Calendar className={iconClass} />,
          },
          {
            label: t("staff.qrCheckIn"),
            to: PATH.STAFF.QR_CHECKIN,
            icon: <QrCode className={iconClass} />,
          },
          {
            label: t("staff.ticketList"),
            to: PATH.STAFF.TICKETS,
            icon: <Ticket className={iconClass} />,
          },
          {
            label: t("staff.trackLocations"),
            to: PATH.STAFF.LOCATIONS,
            icon: <MapPin className={iconClass} />,
          },
          {
            label: t("staff.tourCustomer"),
            to: PATH.STAFF.CUSTOMERS,
            icon: <Users className={iconClass} />,
          },
        ],
      },
    ],
    [t],
  );

  return (
    <DashboardShell
      role="staff"
      logoLink={PATH.STAFF.DASHBOARD}
      groups={groups}
      defaultTitle={t("staff.tourStaffDashboard", "Tour Staff Dashboard")}
      badge={
        <span className="rounded-full bg-brand-light px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand">
          {t("staff.tourStaff", "TOUR STAFF")}
        </span>
      }
    />
  );
};

export default StaffLayout;
