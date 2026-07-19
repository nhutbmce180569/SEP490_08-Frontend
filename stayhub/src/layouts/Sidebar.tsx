import React from "react";
import { NavLink } from "react-router-dom";
import { ChevronRight, X } from "lucide-react";

import { PATH } from "../config/routes/route";
import { StayHubLogo } from "../components/brand/StayHubLogo";
import type { DashboardRole } from "./shared/DashboardTopBar";
import { useTranslation } from "../contexts/LocaleContext";

export type AdminSidebarItem = {
  label: string;
  to: string;
  icon: React.ReactNode;
  headerTitle?: string;
};

export type AdminSidebarGroup = {
  title: string;
  items: AdminSidebarItem[];
};

const navItemBase =
  "group flex items-center gap-3 rounded-xl py-2.5 text-[13px] font-semibold transition-all duration-200 !no-underline outline-none";

const navItemClassName = (isActive: boolean, collapsed: boolean) =>
  [
    navItemBase,
    collapsed ? "justify-center px-2" : "px-3",
    isActive ? "nav-item-active" : "nav-item-inactive",
  ].join(" ");

function NavItems({
  items,
  collapsed,
  logoLink,
  onClose,
}: {
  items: AdminSidebarItem[];
  collapsed: boolean;
  logoLink: string;
  onClose: () => void;
}) {
  return (
    <>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === logoLink}
          className={({ isActive }) => navItemClassName(isActive, collapsed)}
          onClick={onClose}
          title={collapsed ? item.label : undefined}
        >
          {({ isActive }) => (
            <>
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors [&_*]:h-[18px] [&_*]:w-[18px] ${
                  isActive
                    ? "bg-white/20"
                    : collapsed
                      ? ""
                      : "bg-slate-100/80 group-hover:bg-brand-light/60"
                }`}
              >
                {item.icon}
              </span>
              {!collapsed && (
                <>
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  <ChevronRight
                    className={`h-3.5 w-3.5 shrink-0 transition-opacity ${
                      isActive ? "opacity-60" : "opacity-0 group-hover:opacity-40"
                    }`}
                  />
                </>
              )}
            </>
          )}
        </NavLink>
      ))}
    </>
  );
}

export function Sidebar({
  items,
  groups,
  open,
  collapsed = false,
  onClose,
  logoLink = PATH.MANAGER.DASHBOARD,
  badge,
  variant = "partner",
}: {
  items?: AdminSidebarItem[];
  groups?: AdminSidebarGroup[];
  open: boolean;
  collapsed?: boolean;
  onClose: () => void;
  logoLink?: string;
  badge?: React.ReactNode;
  variant?: DashboardRole;
}) {
  const { t } = useTranslation();
  return (
    <aside
      className={[
        "dashboard-sidebar glass-sidebar fixed left-0 top-0 z-40 flex h-full flex-col transition-all duration-300",
        "dashboard-sidebar--admin",
        collapsed ? "w-[76px]" : "w-[272px]",
        open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
      ].join(" ")}
    >
      <div
        className={`flex h-[72px] shrink-0 items-center border-b border-slate-200/60 ${
          collapsed ? "justify-center px-2" : "justify-between px-4"
        }`}
      >
        <div className={`flex min-w-0 items-center ${collapsed ? "justify-center" : "gap-2"}`}>
          <StayHubLogo
            variant={collapsed ? "compact" : "full"}
            linkTo={logoLink}
            className={collapsed ? "" : "origin-left scale-[0.92]"}
          />
          {!collapsed && badge}
        </div>

        {!collapsed && (
          <button type="button" className="icon-btn md:hidden" onClick={onClose} aria-label={t("dashboard.closeSidebar")}>
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="custom-scrollbar flex-1 overflow-x-hidden overflow-y-auto p-3">
        <nav className="flex flex-col gap-1">
          {items && items.length > 0 && (
            <NavItems
              items={items}
              collapsed={collapsed}
              logoLink={logoLink}
              onClose={onClose}
            />
          )}

          {groups?.map((group, index) => (
            <div key={index} className={index > 0 ? "mt-4" : ""}>
              {!collapsed && group.title && (
                <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  {group.title}
                </p>
              )}
              <div className="flex flex-col gap-0.5">
                <NavItems
                  items={group.items}
                  collapsed={collapsed}
                  logoLink={logoLink}
                  onClose={onClose}
                />
              </div>
            </div>
          ))}
        </nav>
      </div>

      {!collapsed && (
        <div className="shrink-0 border-t border-slate-200/60 p-4">
          <div
            className="rounded-2xl bg-brand-light/80 p-3.5 text-xs leading-relaxed text-brand"
          >
            <p className="font-bold">
              {variant === "admin"
                ? t("dashboard.stayhubAdmin", "StayHub Admin")
                : variant === "staff"
                ? t("dashboard.stayhubStaff", "StayHub Tour Staff")
                : t("dashboard.stayhubManager", "StayHub Tour Manager")}
            </p>
            <p className="mt-1 opacity-80">
              {variant === "admin"
                ? t("dashboard.adminSidebarDesc", "Quản trị vĩ mô hệ thống, nhân sự & AI.")
                : variant === "staff"
                ? t("dashboard.staffSidebarDesc", "Điều hành đoàn, soát vé QR & bản đồ GPS.")
                : t("dashboard.partnerSidebarDesc", "Quản lý tour, lịch trình, GPS & doanh số.")}
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}
