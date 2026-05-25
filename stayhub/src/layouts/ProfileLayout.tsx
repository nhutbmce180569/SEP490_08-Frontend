import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { User, Ticket, Heart, Settings, Star, TicketPercent, Bell, Users } from 'lucide-react';
import { PATH } from '../config/routes/route';

export const ProfileLayout: React.FC = () => {
  const navItems = [
    { name: 'My Profile', path: PATH.CUSTOMER.PROFILE, icon: User },
    { name: 'Friends', path: PATH.CUSTOMER.SOCIAL_FRIENDS, icon: Users },
    { name: 'My Bookings', path: PATH.CUSTOMER.MY_BOOKINGS, icon: Ticket },
    { name: 'Wishlist', path: PATH.CUSTOMER.WISHLIST, icon: Heart },
    { name: 'Reviews', path: PATH.CUSTOMER.MY_REVIEWS, icon: Star },
    { name: 'Vouchers', path: PATH.CUSTOMER.VOUCHERS, icon: TicketPercent },
    { name: 'Notifications', path: PATH.CUSTOMER.NOTIFICATIONS, icon: Bell },
    { name: 'Settings', path: PATH.CUSTOMER.SETTINGS, icon: Settings },
  ];

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full shrink-0 md:w-64">
            <div className="sticky top-24 rounded-3xl border border-slate-200/60 bg-white/80 p-3 shadow-sm backdrop-blur-xl">
              <div className="mb-4 px-4 pt-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Account Menu</h3>
              </div>
              <nav className="flex flex-col gap-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `group flex items-center gap-3.5 rounded-2xl px-4 py-3.5 text-sm font-bold transition-all duration-300 !no-underline ${
                        isActive
                          ? 'bg-[#EB662B] text-white shadow-md shadow-[#EB662B]/20'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon 
                          size={20} 
                          strokeWidth={isActive ? 2.5 : 2}
                          className={`transition-all duration-300 ${
                            isActive ? 'scale-110 text-white' : 'text-slate-400 group-hover:scale-110 group-hover:text-[#EB662B]'
                          }`}
                        />
                        <span>{item.name}</span>
                        {isActive && (
                          <div className="ml-auto h-1.5 w-1.5 rounded-full bg-white shadow-sm" />
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};