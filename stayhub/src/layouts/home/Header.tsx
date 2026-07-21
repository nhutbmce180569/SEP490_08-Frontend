import { useState, useContext, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Heart,
  Lock,
  LogOut,
  User,
  LayoutDashboard,
  Map,
  Search,
  ShoppingBag,
  Sparkles,
  MessageCircle,
  Compass,
  Camera,
  Users,
} from "lucide-react";

import { ActionButton } from "../../components/home/ActionButton";
import dragonLogoVideo from "../../assets/làm_hiệu_ứng_cho_con_rồng_bay-Picsart-BackgroundRemover.mp4";
import { UserAvatar } from "../../components/ui/UserAvatar";
import { ConfirmDialog } from "../../components/dashboard/ConfirmDialog";
import { LoadingOverlay } from "../../components/home/LoadingOverlay";
import NotificationBell from "../../features/system/components/NotificationBell";
import { ThemeToggle } from "../../components/ui/ThemeToggle";
import { LanguageCurrencySelector } from "../../components/ui/LanguageCurrencySelector";
import { PATH } from "../../config/routes/route";
import { getDashboardPath } from "../../utils/jwt";
import { AuthContext } from "../../contexts/AuthContext";

import { useTranslation } from "../../contexts/LocaleContext";
import { useToast } from "../../contexts/ToastContext";
import { logout as logoutApi } from "../../features/auth/services/auth.service";
import { WishlistHeaderButton } from "../../features/wishlist/customer/components/WishlistHeaderButton";
import { useAiPlanner } from "../../contexts/AiPlannerContext";
import { useTourAssistantChatState } from "../../contexts/TourAssistantChatContext";
import { useQuery } from "@tanstack/react-query";
import { chatService } from "../../features/social/chat/services/chatService";
import { useChatNotification } from "../../features/social/chat/component/ChatNotificationContext";


export default function Header() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { success } = useToast();
  const { t } = useTranslation();
  const { user, logout: contextLogout } = useContext(AuthContext);
  const { open: openAiPlanner } = useAiPlanner();
  const { toggle: toggleTourAssistantChat } = useTourAssistantChatState();
  const { isPopoverOpen, setIsPopoverOpen } = useChatNotification();
  const { data: chatRooms = [] } = useQuery({
    queryKey: ['chatRooms'],
    queryFn: chatService.getChatRooms,
    enabled: !!user,
  });
  const unreadChatCount = chatRooms.reduce((acc: number, r: any) => acc + (r.unreadCount || 0), 0);

  const userRoles = Array.isArray(user?.roles)
    ? user.roles
    : typeof user?.roles === "string"
      ? [user.roles]
      : [];
  const upperRoles = userRoles.map((r: string) => r.toUpperCase());

  const displayName = user?.fullName || user?.FullName || t("common.user");
  const avatarUrl = user?.avatarUrl || user?.AvatarUrl || null;
  const showDashboardButton =
    upperRoles.includes("ADMIN") ||
    upperRoles.includes("MANAGER") ||
    upperRoles.includes("OPERATOR") ||
    upperRoles.includes("STAFF");

  const handleGoToDashboard = () => {
    if (upperRoles.includes("ADMIN")) {
      navigate(PATH.ADMIN.DASHBOARD);
    } else if (upperRoles.includes("MANAGER")) {
      navigate(PATH.MANAGER.CUSTOMER_ANALYTICS);
    } else {
      navigate(PATH.STAFF.DASHBOARD);
    }
  };

  const isSocialLogin =
    user?.provider === "Google" ||
    user?.provider === "Facebook" ||
    user?.authProvider === "Google" ||
    user?.authProvider === "Facebook" ||
    user?.isSocial === true ||
    user?.rawClaims?.idp === "Google" ||
    user?.rawClaims?.idp === "Facebook";

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);


  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setShowLogoutConfirm(false);
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) await logoutApi({ refreshToken });
    } catch (error) {
      console.error("Failed to logout on server", error);
    } finally {
      contextLogout();
      success(t("header.signedOutSuccess"));
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="site-header">
      <div className="page-container flex h-16 items-center gap-3 md:h-[68px] md:gap-4">
        {/* Logo + search */}
        <div className="flex min-w-0 flex-1 items-center gap-3 md:gap-4">
          <Link
            to={PATH.PUBLIC.HOME}
            className="relative inline-flex h-16 w-20 shrink-0 items-center !no-underline outline-none"
            aria-label="StayHub home"
          >
            <video
              src={dragonLogoVideo}
              className="absolute left-1/2 top-1/2 h-28 w-28 max-w-none -translate-x-1/2 -translate-y-1/2 object-contain md:h-32 md:w-32"
              autoPlay
              loop
              muted
              playsInline
              aria-hidden
            />
          </Link>


          {/* Main Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1 ml-6 shrink-0">
            <Link
              to={PATH.PUBLIC.TOURS}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-all !no-underline ${
                pathname === PATH.PUBLIC.TOURS
                  ? "bg-brand-light/40 text-brand"
                  : "text-slate-600 hover:bg-brand-light/30 hover:text-brand dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              <Compass size={15} className="shrink-0" />
              <span>{t("header.browseTours")}</span>
            </Link>
            
            <button
              type="button"
              onClick={() => openAiPlanner(pathname)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold text-slate-600 hover:bg-brand-light/30 hover:text-brand dark:text-slate-300 dark:hover:bg-slate-800 transition-all"
            >
              <Sparkles size={15} className="shrink-0" />
              <span>{t("header.aiGuide")}</span>
            </button>

            {user && (
              <>
                <Link
                  to="/social/moments"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-all !no-underline ${
                    pathname === "/social/moments"
                      ? "bg-brand-light/40 text-brand"
                      : "text-slate-600 hover:bg-brand-light/30 hover:text-brand dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  <Camera size={15} className="shrink-0" />
                  <span>{t("header.moments")}</span>
                </Link>
                <Link
                  to={PATH.CUSTOMER.SOCIAL_FRIENDS}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-all !no-underline ${
                    pathname === PATH.CUSTOMER.SOCIAL_FRIENDS
                      ? "bg-brand-light/40 text-brand"
                      : "text-slate-600 hover:bg-brand-light/30 hover:text-brand dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  <Users size={15} className="shrink-0" />
                  <span>{t("header.friends")}</span>
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Actions: discovery → social → preferences → account */}
        <div className="flex items-center gap-2 sm:gap-3">
          {pathname !== PATH.PUBLIC.HOME && (
            <button
              type="button"
              className="icon-btn lg:hidden"
              aria-label="Search"
              onClick={() => navigate(PATH.PUBLIC.TOUR_SEARCH)}
            >
              <Search className="h-5 w-5" />
            </button>
          )}

          <button
            type="button"
            className="icon-btn xl:hidden hidden sm:inline-flex"
            aria-label="Browse tours"
            title={t("header.browseTours")}
            onClick={() => navigate(PATH.PUBLIC.TOURS)}
          >
            <ShoppingBag className="h-5 w-5" />
          </button>

          {user ? (
            <>
              {showDashboardButton && (
                <button
                  type="button"
                  onClick={handleGoToDashboard}
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold text-slate-600 hover:bg-brand-light/30 hover:text-brand dark:text-slate-300 dark:hover:bg-slate-800 transition-all border-0 shadow-none"
                  title={t("header.dashboard")}
                >
                  <LayoutDashboard className="h-4 w-4 shrink-0" />
                  <span className="hidden lg:inline">{t("header.dashboard")}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => navigate("/social/moments")}
                className="icon-btn xl:hidden"
                title={t("header.moments")}
                aria-label={t("header.moments")}
              >
                <Map className="h-5 w-5" />
              </button>
            </>
          ) : null}

          {/* Language & Currency Selector (Vietravel style) */}
          <LanguageCurrencySelector className="hidden md:block" />

          {/* AI Planner Icon Button (Mobile/Tablet) */}
          <button
            type="button"
            onClick={() => openAiPlanner(pathname)}
            className="lg:hidden icon-btn text-brand hover:bg-brand-light/40 relative"
            title={t("header.aiGuideTitle")}
            aria-label={t("header.aiGuideTitle")}
          >
            <Sparkles className="h-5 w-5" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand"></span>
            </span>
          </button>

          {user ? (
            <>
              <button
                type="button"
                onClick={() => setIsPopoverOpen(!isPopoverOpen)}
                className={`icon-btn relative transition-all border-0 shadow-none ${isPopoverOpen ? '!bg-brand-light/40 !text-brand' : 'text-slate-600 dark:text-slate-300 hover:bg-brand-light/30 hover:text-brand'}`}
                title={t("nav.messages") || "Tin nhắn"}
              >
                <MessageCircle className="h-5 w-5" />
                {unreadChatCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white animate-pulse">
                    {unreadChatCount}
                  </span>
                )}
              </button>

              <NotificationBell />

              <WishlistHeaderButton />

              <div className="relative ml-0.5" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowUserMenu((v) => !v)}
                  className={`flex items-center justify-center rounded-full p-0.5 transition-all hover:bg-brand-light/30 ${showUserMenu ? 'ring-2 ring-brand' : ''}`}
                  aria-expanded={showUserMenu}
                  aria-haspopup="menu"
                >
                  <UserAvatar name={displayName} avatarUrl={avatarUrl} size="md" />
                </button>

                {showUserMenu && (
                  <div
                    className="glass-dropdown absolute right-0 top-full z-50 mt-2 w-64 p-2"
                    role="menu"
                  >
                    <div className="border-b border-slate-100/80 px-3 py-2.5">
                      <p className="truncate text-sm font-bold text-navy">{displayName}</p>
                      <p className="truncate text-xs text-slate-500">{user?.email || user?.Email}</p>
                    </div>

                    <div className="py-1">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          const currentUserId = user ? (user.id || user.Id || (user as any).Id || (user as any).id) : null;
                          navigate(currentUserId ? `/social/profile/${currentUserId}` : PATH.CUSTOMER.PROFILE);
                          setShowUserMenu(false);
                        }}
                        className="menu-item"
                      >
                        <User className="h-4 w-4" />
                        {t("header.myProfile")}
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          navigate(PATH.CUSTOMER.WISHLIST);
                          setShowUserMenu(false);
                        }}
                        className="menu-item"
                      >
                        <Heart className="h-4 w-4" />
                        {t("header.wishlist")}
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setShowUserMenu(false);
                          toggleTourAssistantChat();
                        }}
                        className="menu-item"
                      >
                        <MessageCircle className="h-4 w-4" />
                        {t("ai.openAssistant")}
                      </button>
                      {!isSocialLogin && (
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            navigate(PATH.PUBLIC.CHANGE_PASSWORD);
                            setShowUserMenu(false);
                          }}
                          className="menu-item"
                        >
                          <Lock className="h-4 w-4" />
                          {t("header.changePassword")}
                        </button>
                      )}
                    </div>

                    <div className="border-t border-slate-100/80 px-3 py-2">
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {t("common.theme") || "Theme Mode"}
                      </p>
                      <ThemeToggle variant="menu" className="w-full" />
                    </div>

                    <div className="border-t border-slate-100/80 pt-1.5">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setShowLogoutConfirm(true);
                          setShowUserMenu(false);
                        }}
                        className="menu-item menu-item-danger"
                      >
                        <LogOut className="h-4 w-4" />
                        {t("header.signOut")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <ActionButton
                variant="ghost"
                onClick={() => navigate(PATH.PUBLIC.REGISTER)}
                className="hidden sm:inline-flex"
              >
                {t("header.signUp")}
              </ActionButton>
              <ActionButton variant="primary" onClick={() => navigate(PATH.PUBLIC.LOGIN)}>
                {t("header.logIn")}
              </ActionButton>
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title={t("header.signOutTitle")}
        message={t("header.signOutMessage")}
        confirmText={t("header.signOutConfirm")}
        cancelText={t("common.cancel")}
      />
      <LoadingOverlay isOpen={isLoggingOut} message={t("header.signingOut")} />
    </header>
  );
}
