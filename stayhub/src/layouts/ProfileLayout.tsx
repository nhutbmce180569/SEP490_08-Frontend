import { useContext } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import {
  User,
  Ticket,
  Heart,
  Settings,
  Star,
  TicketPercent,
  Bell,
  Users,
  MessageCircle,
  Sparkles,
  Compass,
  Globe,
} from "lucide-react";

import { PATH } from "../config/routes/route";
import { AuthContext } from "../contexts/AuthContext";
import { useTranslation } from "../contexts/LocaleContext";
import { useAiPlanner } from "../contexts/AiPlannerContext";
import { UserAvatar } from "../components/ui/UserAvatar";


const navItems = [
  { labelKey: "nav.profile", path: PATH.CUSTOMER.PROFILE, icon: User },
  { labelKey: "nav.friends", path: PATH.CUSTOMER.SOCIAL_FRIENDS, icon: Users },
  { labelKey: "nav.messages", path: PATH.CUSTOMER.SOCIAL_CHAT, icon: MessageCircle },
  { labelKey: "nav.myBookings", path: PATH.CUSTOMER.MY_BOOKINGS, icon: Ticket },
  { labelKey: "nav.wishlist", path: PATH.CUSTOMER.WISHLIST, icon: Heart },
  { labelKey: "nav.reviews", path: PATH.CUSTOMER.MY_REVIEWS, icon: Star },
  { labelKey: "nav.vouchers", path: PATH.CUSTOMER.VOUCHERS, icon: TicketPercent },
  { labelKey: "nav.aiRecommendations", path: PATH.PUBLIC.AI_ASSISTANT, icon: Sparkles, openPlanner: true },
];

export const ProfileLayout = () => {
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();
  const location = useLocation();
  const { open: openAiPlanner } = useAiPlanner();
  const openPlanner = () => openAiPlanner(location.pathname);

  const currentUserId = user?.id || user?.Id || user?.nameid || user?.sub || 0;

  const navItems = [
    { labelKey: "nav.profile", path: PATH.CUSTOMER.PROFILE, icon: User },
    { labelKey: "nav.socialProfile", path: `/social/profile/${currentUserId}`, icon: Globe },
    { labelKey: "nav.friends", path: PATH.CUSTOMER.SOCIAL_FRIENDS, icon: Users },
    { labelKey: "nav.messages", path: PATH.CUSTOMER.SOCIAL_CHAT, icon: MessageCircle },
    { labelKey: "nav.myBookings", path: PATH.CUSTOMER.MY_BOOKINGS, icon: Ticket },
    { labelKey: "nav.wishlist", path: PATH.CUSTOMER.WISHLIST, icon: Heart },
    { labelKey: "nav.reviews", path: PATH.CUSTOMER.MY_REVIEWS, icon: Star },
    { labelKey: "nav.vouchers", path: PATH.CUSTOMER.VOUCHERS, icon: TicketPercent },
    { labelKey: "nav.aiRecommendations", path: PATH.PUBLIC.AI_ASSISTANT, icon: Sparkles, openPlanner: true },
    { labelKey: "nav.settings", path: PATH.CUSTOMER.SETTINGS, icon: Settings },
  ];

  const displayName = user?.fullName || user?.FullName || t("common.user");
  const avatarUrl = user?.avatarUrl || user?.AvatarUrl || null;
  const activeItem = navItems.find(
    (i) =>
      location.pathname === i.path ||
      location.pathname.startsWith(`${i.path}/`),
  );

  return (
    <div className="account-shell">
      <div className="page-container account-shell-inner">

        <nav
          className="account-mobile-nav custom-scrollbar mb-6 flex gap-2 overflow-x-auto pb-1 md:hidden"
          aria-label="Account menu"
        >
          {navItems.map((item) =>
            item.openPlanner ? (
              <button
                key={item.path}
                type="button"
                onClick={openPlanner}
                className="flex shrink-0 items-center gap-2 rounded-full bg-white/80 px-4 py-2.5 text-sm font-bold text-slate-600 ring-1 ring-slate-200/80 transition-all hover:text-brand"
              >
                <item.icon size={16} />
                {t(item.labelKey)}
              </button>
            ) : (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold !no-underline transition-all ${isActive
                    ? "bg-brand text-white shadow-md shadow-brand/25"
                    : "bg-white/80 text-slate-600 ring-1 ring-slate-200/80"
                  }`
                }
              >
                <item.icon size={16} />
                {t(item.labelKey)}
              </NavLink>
            ),
          )}
        </nav>

        <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
          <aside className="hidden w-full shrink-0 lg:block lg:w-64">
            <div className="account-sidebar glass-panel sticky top-[88px] rounded-3xl p-3">
              <div className="mb-3 px-3 pt-2">
                <p className="travel-eyebrow">Menu</p>
                <h2 className="travel-heading mt-1 text-sm text-navy">Account</h2>
              </div>
              <nav className="flex flex-col gap-0.5">
                {navItems.map((item) =>
                  item.openPlanner ? (
                    <button
                      key={item.path}
                      type="button"
                      onClick={openPlanner}
                      className="group flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-bold transition-all nav-item-inactive"
                    >
                      <item.icon
                        size={18}
                        className="text-slate-400 group-hover:text-brand"
                      />
                      <span>{t(item.labelKey)}</span>
                    </button>
                  ) : (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        `group flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-bold transition-all !no-underline ${isActive ? "nav-item-active" : "nav-item-inactive"
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon
                            size={18}
                            strokeWidth={isActive ? 2.5 : 2}
                            className={
                              isActive
                                ? "text-white"
                                : "text-slate-400 group-hover:text-brand"
                            }
                          />
                          <span>{t(item.labelKey)}</span>
                        </>
                      )}
                    </NavLink>
                  ),
                )}
              </nav>
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            <div className="account-content glass-card min-h-[min(70vh,560px)] p-5 md:p-8">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
