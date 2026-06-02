import { useContext, useMemo, useState, type ReactNode } from "react";
import { Outlet, useLocation } from "react-router-dom";

import { ConfirmDialog } from "../../components/dashboard/ConfirmDialog";
import { Sidebar, type AdminSidebarGroup, type AdminSidebarItem } from "../Sidebar";
import { DashboardTopBar, type DashboardRole } from "./DashboardTopBar";
import { AuthContext } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { logout as logoutApi } from "../../features/auth/services/auth.service";

type DashboardShellProps = {
  role: DashboardRole;
  logoLink: string;
  items?: AdminSidebarItem[];
  groups?: AdminSidebarGroup[];
  defaultTitle?: string;
  badge?: ReactNode;
};

function resolvePageTitle(
  pathname: string,
  items: AdminSidebarItem[],
  groups: AdminSidebarGroup[],
  defaultTitle: string,
) {
  const flat = [...items, ...groups.flatMap((g) => g.items)];
  const match = flat
    .slice()
    .sort((a, b) => b.to.length - a.to.length)
    .find((i) => pathname === i.to || pathname.startsWith(`${i.to}/`));
  return match?.label ?? defaultTitle;
}

export function DashboardShell({
  role,
  logoLink,
  items = [],
  groups = [],
  defaultTitle,
  badge,
}: DashboardShellProps) {
  const location = useLocation();
  const { logout: contextLogout } = useContext(AuthContext);
  const { success } = useToast();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const pageTitle = useMemo(
    () =>
      resolvePageTitle(
        location.pathname,
        items,
        groups,
        defaultTitle ?? (role === "admin" ? "Admin dashboard" : "Partner dashboard"),
      ),
    [location.pathname, items, groups, defaultTitle, role],
  );

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) await logoutApi({ refreshToken });
    } catch (error) {
      console.error("Failed to logout on server", error);
    } finally {
      setShowLogoutConfirm(false);
      contextLogout();
      success("Signed out successfully.");
    }
  };

  return (
    <div
      className={`dashboard-shell dashboard-shell--${role} ${sidebarCollapsed ? "is-sidebar-collapsed" : ""}`}
    >
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="glass-overlay fixed inset-0 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        variant={role}
        items={items}
        groups={groups}
        open={sidebarOpen}
        collapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        logoLink={logoLink}
        badge={badge}
      />

      <div
        className={`dashboard-main flex min-h-screen flex-col transition-[padding-left] duration-300 ease-out ${
          sidebarCollapsed ? "md:pl-[76px]" : "md:pl-[272px]"
        }`}
      >
        <DashboardTopBar
          role={role}
          pageTitle={pageTitle}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((c) => !c)}
          onOpenMobileSidebar={() => setSidebarOpen(true)}
          onLogout={() => setShowLogoutConfirm(true)}
        />

        <main className="dashboard-content flex-1">
          <div className="dashboard-content-inner">
            <Outlet />
          </div>
        </main>
      </div>

      <ConfirmDialog
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Sign out"
        message="Are you sure you want to sign out of your account?"
        confirmText="Sign out"
        cancelText="Cancel"
      />
    </div>
  );
}
