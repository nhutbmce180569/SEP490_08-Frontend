import React, { useMemo, useState, useContext } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  PieChart, Download, Users, Building, Map, 
  ShieldAlert, CreditCard, Ticket, Image, 
  Layers, Settings, Menu, Bell, Search, MoreVertical, Home 
} from 'lucide-react';
import { Sidebar, type AdminSidebarItem } from './Sidebar';
import { PATH } from '../config/routes/route';
import { AuthContext } from '../contexts/AuthContext';
import { logout as logoutApi } from '../features/auth/services/auth.service';
import { ConfirmDialog } from '../components/dashboard/ConfirmDialog';
import { useToast } from '../contexts/ToastContext';
import { ActionButton } from '../components/dashboard/ActionButton';

// Danh sách phẳng các chức năng Admin
const ADMIN_SIDEBAR_ITEMS: AdminSidebarItem[] = [
  { label: 'Overview', to: PATH.ADMIN.DASHBOARD, icon: <PieChart /> },
  { label: 'System Reports', to: '/admin/reports-export', icon: <Download /> },
  { label: 'Users List', to: PATH.ADMIN.USER_MANAGEMENT, icon: <Users /> },
  { label: 'Operator Approvals', to: PATH.ADMIN.PARTNER_APPROVAL, icon: <Building /> },
  { label: 'Tours List', to: PATH.ADMIN.TOUR_MODERATION, icon: <Map /> },
  { label: 'Violation Reports', to: PATH.ADMIN.REPORT_MODERATION, icon: <ShieldAlert /> },
  { label: 'Withdrawal Requests', to: PATH.ADMIN.WITHDRAWALS, icon: <CreditCard /> },
  { label: 'System Vouchers', to: PATH.ADMIN.SYSTEM_VOUCHERS, icon: <Ticket /> },
  { label: 'Ticket Types', to: PATH.ADMIN.TICKET_TYPE_MANAGEMENT, icon: <Ticket /> },
  { label: 'Banners', to: PATH.ADMIN.BANNER_MANAGEMENT, icon: <Image /> },
  { label: 'Tour Categories', to: PATH.ADMIN.CATEGORY_MANAGEMENT, icon: <Layers /> },
  { label: 'Global Settings', to: PATH.ADMIN.SYSTEM_SETTINGS, icon: <Settings /> },
];

export const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [language, setLanguage] = useState('English');

  const { user, logout: contextLogout } = useContext(AuthContext);
  const { success } = useToast();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await logoutApi({ refreshToken });
      }
    } catch (error) {
      console.error('Failed to logout on server', error);
    } finally {
      setShowLogoutConfirm(false);
      contextLogout();
      success('Logged out successfully.');
    }
  };

  const pageTitle = useMemo(() => {
    const match = ADMIN_SIDEBAR_ITEMS
      .slice()
      .sort((a, b) => b.to.length - a.to.length)
      .find((i) => location.pathname === i.to || location.pathname.startsWith(`${i.to}/`));
    return match?.label ?? 'Admin Dashboard';
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile overlay */}
      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      {/* Sidebar Component */}
      <Sidebar
        items={ADMIN_SIDEBAR_ITEMS}
        open={sidebarOpen}
        collapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        logoLink={PATH.ADMIN.DASHBOARD}
        badge={<span className="ml-1.5 rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-600">ADMIN</span>}
      />

      {/* Main */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'md:pl-[80px]' : 'md:pl-[280px]'}`}>
        {/* Header */}
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
          <div className="flex h-16 items-center gap-3 px-4 md:px-6">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 md:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Desktop toggle sidebar button */}
            <button
              type="button"
              className="hidden h-10 w-10 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 md:inline-flex"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              aria-label="Toggle menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-slate-900">
                {pageTitle}
              </div>
            </div>

            <div className="ml-auto flex flex-1 items-center justify-end gap-3">
              <ActionButton 
                variant="secondary" 
                onClick={() => navigate(PATH.PUBLIC.HOME)}
                className="hidden md:flex items-center gap-2 h-10 px-3"
              >
                <Home className="h-4 w-4" />
                <span className="text-sm font-semibold">Home</span>
              </ActionButton>

              {/* Center-ish search (Figma style) */}
              <div className="hidden w-full max-w-[520px] items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 md:flex">
                <Search className="h-4 w-4 text-slate-500/70" />
                <input
                  className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                  placeholder="Search"
                />
              </div>

              {/* Notifications with badge */}
              <div className="relative">
                <button
                  type="button"
                  className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-50"
                  aria-label="Notifications"
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setShowProfileMenu(false);
                  }}
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute right-2 top-2 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white">
                    3
                  </span>
                </button>

                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-slate-200 bg-white p-4 shadow-lg z-50">
                    <h3 className="mb-3 text-sm font-bold text-slate-800">Notifications</h3>
                    <div className="flex flex-col gap-3">
                      <div className="text-sm text-slate-600">New partner approval request.</div>
                      <div className="text-sm text-slate-600">A user submitted a violation report.</div>
                      <button className="mt-2 text-sm font-semibold text-[#4880ff] hover:underline text-left">
                        View all
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Language selector */}
              <div className="hidden items-center gap-2 md:flex">
                <span
                  aria-hidden="true"
                  className="grid h-7 w-10 place-items-center overflow-hidden rounded-md border border-slate-200 bg-white text-[14px]"
                >
                  UK
                </span>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="cursor-pointer bg-transparent text-sm font-semibold text-slate-600 outline-none"
                  aria-label="Language"
                >
                  {['English', 'Vietnamese'].map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>

              {/* Profile */}
              <div className="relative flex items-center gap-3">
                <div className="hidden text-right md:block">
              <div className="text-sm font-bold text-slate-700">{user?.fullName || user?.FullName || 'Admin User'}</div>
                  <div className="text-xs font-semibold text-slate-500">Super Admin</div>
                </div>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full outline-none"
                  onClick={() => {
                    setShowProfileMenu(!showProfileMenu);
                    setShowNotifications(false);
                  }}
                >
              <div className="h-10 w-10 overflow-hidden rounded-full border border-slate-200 bg-slate-100 flex items-center justify-center font-bold text-slate-600" aria-label="Avatar">
                {user?.avatarUrl || user?.AvatarUrl ? (
                  <img
                    src={user.avatarUrl || user.AvatarUrl}
                    alt="User Avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  (user?.fullName || user?.FullName || 'A').charAt(0).toUpperCase()
                )}
              </div>
                  <MoreVertical className="hidden h-5 w-5 text-slate-600 md:block" />
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-2 shadow-lg z-50">
                <button 
                  onClick={() => {
                    setShowLogoutConfirm(true);
                    setShowProfileMenu(false);
                  }}
                  className="block w-full px-4 py-2.5 text-left text-sm font-bold text-rose-600 hover:bg-rose-50"
                >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 md:px-6">
          <Outlet />
        </main>
      </div>

      <ConfirmDialog
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Log Out"
        message="Are you sure you want to log out of your account?"
        confirmText="Log Out"
      />
    </div>
  );
};
