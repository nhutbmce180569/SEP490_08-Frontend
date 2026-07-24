import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  Home,
  KeyRound,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  User,
} from "lucide-react";

import { ActionButton } from "../../components/dashboard/ActionButton";
import { ThemeToggle } from "../../components/ui/ThemeToggle";
import { LanguageCurrencySelector } from "../../components/ui/LanguageCurrencySelector";
import { UserAvatar } from "../../components/ui/UserAvatar";
import { PATH } from "../../config/routes/route";
import { AuthContext } from "../../contexts/AuthContext";
import { useTranslation } from "../../contexts/LocaleContext";

export type DashboardRole = "partner" | "admin" | "staff";

type DashboardTopBarProps = {
  role: DashboardRole;
  pageTitle: string;
  breadcrumb?: string;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onOpenMobileSidebar: () => void;
  onLogout: () => void;
};

export function DashboardTopBar({
  role,
  pageTitle,
  breadcrumb,
  sidebarCollapsed,
  onToggleSidebar,
  onOpenMobileSidebar,
  onLogout,
}: DashboardTopBarProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const displayName = user?.fullName || user?.FullName || t("common.user");
  const avatarUrl = user?.avatarUrl || user?.AvatarUrl || null;

  const { meta, profilePath } = useMemo(() => {
    let basePath = '';
    let metaData;
    switch (role) {
      case "partner":
        basePath = PATH.MANAGER.DASHBOARD;
        metaData = {
          label: t("dashboard.tourManagerLabel", "TOUR MANAGER"),
          badgeClass: "bg-brand-light text-brand font-bold",
          subtitle: t("dashboard.tourManagerSubtitle", "Tour Operations Manager"),
        };
        break;
      case "admin":
        basePath = PATH.ADMIN.DASHBOARD;
        metaData = {
          label: t("dashboard.adminLabel", "ADMIN"),
          badgeClass: "bg-brand-light text-brand font-bold",
          subtitle: t("dashboard.adminSubtitle", "Administrator"),
        };
        break;
      case "staff":
        basePath = PATH.STAFF.DASHBOARD;
        metaData = {
          label: t("dashboard.tourStaffLabel", "TOUR STAFF"),
          badgeClass: "bg-brand-light text-brand font-bold",
          subtitle: t("dashboard.tourStaffSubtitle", "Tour Guide & Field Staff"),
        };
        break;
      default:
        metaData = {
          label: role,
          badgeClass: "bg-slate-100 text-slate-700",
          subtitle: "User",
        };
    }
    return { meta: metaData, profilePath: basePath };
  }, [role, t]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <header className="dashboard-topbar">
      <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-3">
        <button
          type="button"
          className="icon-btn md:hidden"
          onClick={onOpenMobileSidebar}
          aria-label={t("home.openMenu")}
        >
          <Menu className="h-5 w-5" />
        </button>

        <button
          type="button"
          className="icon-btn hidden md:inline-flex"
          onClick={onToggleSidebar}
          aria-label={sidebarCollapsed ? t("home.expandSidebar") : t("home.collapseSidebar")}
        >
          {sidebarCollapsed ? (
            <PanelLeftOpen className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </button>

        <div className="min-w-0">
          <div className="mb-0.5 flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
            <span className={`rounded-md px-1.5 py-0.5 ${meta.badgeClass}`}>
              {meta.label}
            </span>
            {breadcrumb && (
              <>
                <ChevronRight className="h-3 w-3 shrink-0" aria-hidden />
                <span className="truncate">{breadcrumb}</span>
              </>
            )}
          </div>
          <h1 className="travel-heading truncate text-base md:text-lg">{pageTitle}</h1>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">

        <ActionButton
          variant="secondary"
          onClick={() => navigate(PATH.PUBLIC.HOME)}
          className="hidden h-9 gap-1.5 px-3 md:inline-flex"
        >
          <Home className="h-4 w-4" />
          <span className="text-xs font-semibold">{t("dashboard.home")}</span>
        </ActionButton>

        <ThemeToggle className="hidden sm:flex h-9 w-9 border border-slate-200/50 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800 rounded-full" />

        <LanguageCurrencySelector className="hidden md:block" />

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => {
              setShowProfileMenu((v) => !v);
            }}
            className="flex items-center gap-2 rounded-full border border-transparent py-1 pl-1 pr-2 transition-colors hover:border-slate-200/80 hover:bg-white/60 md:pr-3"
          >
            <UserAvatar name={displayName} avatarUrl={avatarUrl} size="md" />
            <div className="hidden text-left md:block">
              <p className="max-w-[120px] truncate text-xs font-bold text-navy lg:max-w-[160px]">
                {displayName}
              </p>
              <p className="text-[10px] font-medium text-slate-500">{meta.subtitle}</p>
            </div>
          </button>

          {showProfileMenu && (
            <div className="glass-dropdown absolute right-0 top-full z-50 mt-2 w-52 p-1.5">
              <div className="border-b border-slate-100/80 px-3 py-2.5">
                <p className="truncate text-sm font-bold text-navy">{displayName}</p>
                <p className="truncate text-xs text-slate-500">{user?.email || user?.Email}</p>
              </div>
              <button
                type="button"
                className="menu-item mt-1"
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate(profilePath ? `${profilePath}/profile` : PATH.CUSTOMER.PROFILE);
                }}
              >
                <User className="h-4 w-4" />
                {t("header.myProfile")}
              </button>
              <button
                type="button"
                className="menu-item"
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate(`/change-password`);
                }}
              >
                <KeyRound className="h-4 w-4" />
                {t("header.changePassword")}
              </button>
              
              <div className="px-3 py-2 border-t border-slate-100/80 mt-1">
                <ThemeToggle variant="menu" className="w-full" />
              </div>

              <button
                type="button"
                className="menu-item menu-item-danger mt-1"
                onClick={() => {
                  setShowProfileMenu(false);
                  onLogout();
                }}
              >
                <LogOut className="h-4 w-4" />
                {t("header.signOut")}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
