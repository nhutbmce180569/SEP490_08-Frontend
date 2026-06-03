import React, { useMemo, useState, useContext } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  Menu, Bell, Search, MoreVertical, Home, 
  Calendar, QrCode, Ticket, MapPin, Users 
} from 'lucide-react';
import { Sidebar, type AdminSidebarItem } from './Sidebar';
import { PATH } from '../config/routes/route';
import { AuthContext } from '../contexts/AuthContext';
import { logout as logoutApi } from '../features/auth/services/auth.service';
import { ConfirmDialog } from '../components/dashboard/ConfirmDialog';
import { useToast } from '../contexts/ToastContext';
import { ActionButton } from '../components/dashboard/ActionButton';
import { LanguageSwitcher } from '../components/ui/LanguageSwitcher';
import { useTranslation } from '../contexts/LocaleContext';

export const StaffLayout: React.FC = () => {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const { user, logout: contextLogout } = useContext(AuthContext);
  const { success } = useToast();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const items = useMemo<AdminSidebarItem[]>(
    () => [
      {
        label: t('staff.assignedSchedules'),
        to: PATH.STAFF.SCHEDULES,
        icon: <Calendar className="h-4 w-4" />,
      },
      {
        label: t('staff.qrCheckIn'),
        to: PATH.STAFF.QR_CHECKIN,
        icon: <QrCode className="h-4 w-4" />,
      },
      {
        label: t('staff.ticketList'),
        to: PATH.STAFF.TICKETS,
        icon: <Ticket className="h-4 w-4" />,
      },
      {
        label: t('staff.trackLocations'),
        to: PATH.STAFF.LOCATIONS,
        icon: <MapPin className="h-4 w-4" />,
      },
      {
        label: t('staff.tourCustomer'),
        to: PATH.STAFF.CUSTOMERS,
        icon: <Users className="h-4 w-4" />,
      },
    ],
    [t],
  );

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
      success(t('staff.loggedOutSuccess'));
    }
  };

  const pageTitle = useMemo(() => {
    const match = items
      .slice()
      .sort((a, b) => b.to.length - a.to.length)
      .find((i) => location.pathname === i.to || location.pathname.startsWith(`${i.to}/`));
    return match?.label ?? t('staff.staffDashboard');
  }, [items, location.pathname, t]);

  const displayName = user?.fullName || user?.FullName || t('dashboard.staffUser');

  return (
    <div className="min-h-screen bg-slate-50">
      {sidebarOpen ? (
        <button
          type="button"
          aria-label={t('dashboard.closeSidebar')}
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <Sidebar
        items={items}
        open={sidebarOpen}
        collapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        logoLink={PATH.STAFF.DASHBOARD}
        badge={<span className="ml-1.5 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">STAFF</span>}
      />

      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'md:pl-[80px]' : 'md:pl-[280px]'}`}>
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
          <div className="flex h-16 items-center gap-3 px-4 md:px-6">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 md:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label={t('home.openMenu')}
            >
              <Menu className="h-5 w-5" />
            </button>

            <button
              type="button"
              className="hidden h-10 w-10 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 md:inline-flex"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              aria-label={t('dashboard.toggleMenu')}
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
                <span className="text-sm font-semibold">{t('dashboard.home')}</span>
              </ActionButton>

              <div className="hidden w-full max-w-[520px] items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 md:flex">
                <Search className="h-4 w-4 text-slate-500/70" />
                <input
                  className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                  placeholder={t('dashboard.searchStaff')}
                />
              </div>

              <div className="relative">
                <button
                  type="button"
                  className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-50"
                  aria-label={t('dashboard.notifications')}
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setShowProfileMenu(false);
                  }}
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute right-2 top-2 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-emerald-500 px-1 text-[11px] font-bold text-white">
                    1
                  </span>
                </button>

                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-slate-200 bg-white p-4 shadow-lg z-50">
                    <h3 className="mb-3 text-sm font-bold text-slate-800">{t('dashboard.notifications')}</h3>
                    <div className="flex flex-col gap-3">
                      <div className="text-sm text-slate-600">{t('staff.newScheduleAssigned')}</div>
                      <button className="mt-2 text-sm font-semibold text-emerald-600 hover:underline text-left">
                        {t('dashboard.viewAll')}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="hidden md:flex">
                <LanguageSwitcher variant="select" />
              </div>

              <div className="relative flex items-center gap-3">
                <div className="hidden text-right md:block">
                  <div className="text-sm font-bold text-slate-700">{displayName}</div>
                  <div className="text-xs font-semibold text-slate-500">{t('staff.staffMember')}</div>
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
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      displayName.charAt(0).toUpperCase()
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
                      {t('header.signOut')}
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
        title={t('header.signOutTitle')}
        message={t('header.signOutMessage')}
        confirmText={t('header.signOutConfirm')}
      />
    </div>
  );
};

export default StaffLayout;
