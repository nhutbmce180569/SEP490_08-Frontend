import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { X } from 'lucide-react';

import { PATH } from '../config/routes/route';
import logoBlue from '../assets/logo_blue.png';
import logoIcon from '../assets/stayhub_icon_transparent.png';

export type AdminSidebarItem = {
  label: string;
  to: string;
  icon: React.ReactNode;
};

export type AdminSidebarGroup = {
  title: string;
  items: AdminSidebarItem[];
};

const navItemBase =
  'flex items-center gap-3 rounded-lg py-2.5 text-[14px] font-semibold tracking-[0.3px] transition !no-underline hover:!no-underline outline-none border-none';

const navItemClassName = (isActive: boolean, collapsed: boolean) =>
  [
    navItemBase,
    collapsed ? 'justify-center px-0' : 'px-4',
    isActive
      ? 'bg-[#0068E0] text-white shadow-sm'
      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
  ].join(' ');

export function Sidebar({
  items,
  groups,
  open,
  collapsed = false,
  onClose,
  logoLink = PATH.MANAGER.DASHBOARD,
  badge,
}: {
  items?: AdminSidebarItem[];
  groups?: AdminSidebarGroup[];
  open: boolean;
  collapsed?: boolean;
  onClose: () => void;
  logoLink?: string;
  badge?: React.ReactNode;
}) {
  return (
    <aside
      className={[
        'fixed left-0 top-0 z-40 h-full border-r border-slate-200 bg-white transition-all duration-300',
        collapsed ? 'w-[80px]' : 'w-[280px]',
        open ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
      ].join(' ')}
    >
      <div className={`flex h-16 shrink-0 items-center ${collapsed ? 'justify-center' : 'justify-between px-6'}`}>
        <Link
          to={logoLink}
          className={`flex min-w-0 items-center !no-underline hover:!no-underline outline-none border-none ${collapsed ? 'justify-center' : 'gap-2'}`}
          aria-label="StayHub dashboard"
        >
          {collapsed ? (
            <img
              src={logoIcon}
              alt="StayHub"
              className="h-10 w-10 object-contain"
            />
          ) : (
            <>
              <img
                src={logoBlue}
                alt="StayHub"
                className="h-10 w-auto max-w-[150px] object-contain"
              />
              {badge}
            </>
          )}
        </Link>

        {!collapsed && (
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 md:hidden"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="h-[calc(100vh-64px)] overflow-y-auto overflow-x-hidden p-4">
        <div className="flex flex-col gap-6">
          {/* Render danh sách phẳng (cho Dashboard Layout) */}
          {items && items.length > 0 && (
            <div className="flex flex-col gap-1">
              {items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === logoLink}
                  className={({ isActive }) => navItemClassName(isActive, collapsed)}
                  onClick={onClose}
                  title={collapsed ? item.label : undefined}
                >
                  <span className="[&_*]:h-[20px] [&_*]:w-[20px] flex shrink-0 items-center justify-center">
                    {item.icon}
                  </span>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              ))}
            </div>
          )}

          {/* Render danh sách theo nhóm (cho Admin Layout) */}
          {groups && groups.map((group, index) => (
            <div key={index} className="flex flex-col gap-1">
              {!collapsed && group.title && (
                <div className="mb-1 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {group.title}
                </div>
              )}
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === logoLink}
                  className={({ isActive }) => navItemClassName(isActive, collapsed)}
                  onClick={onClose}
                  title={collapsed ? item.label : undefined}
                >
                  <span className="[&_*]:h-[20px] [&_*]:w-[20px] flex shrink-0 items-center justify-center">
                    {item.icon}
                  </span>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
