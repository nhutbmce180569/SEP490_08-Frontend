import React, { useMemo, useState, useContext } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import {
  Bell,
  BookOpen,
  CalendarDays,
  CircleDollarSign,
  LayoutDashboard,
  Menu,
  Search,
  Star,
  Ticket,
  TicketPercent,
  MoreVertical,
  Home,
} from 'lucide-react';

import { PATH } from '../config/routes/route';
import { Sidebar, type AdminSidebarItem } from './Sidebar';
import { AuthContext } from '../contexts/AuthContext';
import { logout as logoutApi } from '../features/auth/services/auth.service';
import { ConfirmDialog } from '../components/dashboard/ConfirmDialog';
import { useToast } from '../contexts/ToastContext';
import { ActionButton } from '../components/dashboard/ActionButton';
import { useNavigate } from 'react-router-dom';

export const DashboardLayout: React.FC = () => {
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

  const items = useMemo<AdminSidebarItem[]>(
    () => [
      {
        label: 'Dashboard',
        to: PATH.MANAGER.DASHBOARD,
        icon: <LayoutDashboard className="h-4 w-4" />,
      },
      {
        label: 'My Tours',
        to: PATH.MANAGER.MY_TOURS,
        icon: <BookOpen className="h-4 w-4" />,
      },
      {
        label: 'Schedules',
        to: PATH.MANAGER.SCHEDULE_MANAGEMENT,
        icon: <CalendarDays className="h-4 w-4" />,
      },
      {
        label: 'Bookings',
        to: PATH.MANAGER.BOOKING_MANAGEMENT,
        icon: <TicketPercent className="h-4 w-4" />,
      },
      {
        label: 'Vouchers',
        to: PATH.MANAGER.VOUCHERS,
        icon: <Ticket className="h-4 w-4" />,
      },
      {
        label: 'Reviews',
        to: PATH.MANAGER.REVIEWS,
        icon: <Star className="h-4 w-4" />,
      },
      {
        label: 'Finance',
        to: PATH.MANAGER.PAYOUT,
        icon: <CircleDollarSign className="h-4 w-4" />,
      },
    ],
    [],
  );

  const pageTitle = useMemo(() => {
    const match = items
      .slice()
      .sort((a, b) => b.to.length - a.to.length)
      .find((i) => location.pathname === i.to || location.pathname.startsWith(`${i.to}/`));
    return match?.label ?? 'Partner';
  }, [items, location.pathname]);

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

      {/* Sidebar */}
      <Sidebar 
        items={items} 
        open={sidebarOpen} 
        collapsed={sidebarCollapsed} 
        onClose={() => setSidebarOpen(false)} 
        logoLink={PATH.MANAGER.DASHBOARD}
        badge={<span className="ml-1.5 rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold text-sky-600">PARTNER</span>}
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
                    6
                  </span>
                </button>

                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-slate-200 bg-white p-4 shadow-lg z-50">
                    <h3 className="mb-3 text-sm font-bold text-slate-800">Notifications</h3>
                    <div className="flex flex-col gap-3">
                      <div className="text-sm text-slate-600">You have new bookings to review.</div>
                      <div className="text-sm text-slate-600">A customer left a 5-star review!</div>
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
                {/* <ChevronDown className="h-4 w-4 text-slate-400" /> */}
              </div>

              {/* Profile */}
              <div className="relative flex items-center gap-3">
                <div className="hidden text-right md:block">
                  <div className="text-sm font-bold text-slate-700">{user?.fullName || user?.FullName || 'Partner User'}</div>
                  <div className="text-xs font-semibold text-slate-500">Partner</div>
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
                      (user?.fullName || user?.FullName || 'P').charAt(0).toUpperCase()
                    )}
                  </div>
                  <MoreVertical className="hidden h-5 w-5 text-slate-600 md:block" />
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-2 shadow-lg z-50">
                    <button className="block w-full px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50">
                      My Profile
                    </button>
                    <button className="block w-full px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50">
                      Account Settings
                    </button>
                    <div className="my-1 h-px bg-slate-200"></div>
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
