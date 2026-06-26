import { useState, useContext, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Heart,
  Lock,
  LogOut,
  User,
  LayoutDashboard,
  Map,
  Users,
  Search,
  ShoppingBag,
  Info,
} from "lucide-react";

import { ActionButton } from "../../components/home/ActionButton";
import dragonLogoVideo from "../../assets/làm_hiệu_ứng_cho_con_rồng_bay-Picsart-BackgroundRemover.mp4";
import { UserAvatar } from "../../components/ui/UserAvatar";
import { ConfirmDialog } from "../../components/dashboard/ConfirmDialog";
import { LoadingOverlay } from "../../components/home/LoadingOverlay";
import NotificationBell from "../../features/system/components/NotificationBell";
import { ThemeToggle } from "../../components/ui/ThemeToggle";
import { LanguageSwitcher } from "../../components/ui/LanguageSwitcher";
import { PATH } from "../../config/routes/route";
import { AuthContext } from "../../contexts/AuthContext";
import { useTranslation } from "../../contexts/LocaleContext";
import { useToast } from "../../contexts/ToastContext";
import { logout as logoutApi } from "../../features/auth/services/auth.service";
import { useGetPendingRequests } from "../../features/social/friends/hooks/useFriends";
import { CurrencyToggle } from "../../features/currency/CurrencyToggle";
import { WishlistHeaderButton } from "../../features/wishlist/customer/components/WishlistHeaderButton";


export default function Header() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { success } = useToast();
  const { t } = useTranslation();
  const { user, logout: contextLogout } = useContext(AuthContext);

  const { data: pendingRequests } = useGetPendingRequests(Boolean(user));
  const pendingCount = Array.isArray(pendingRequests) ? pendingRequests.length : 0;

  const userRoles = Array.isArray(user?.roles)
    ? user.roles
    : typeof user?.roles === "string"
      ? [user.roles]
      : [];
  const upperRoles = userRoles.map((r: string) => r.toUpperCase());


  const displayName = user?.fullName || user?.FullName || t("common.user");
  const avatarUrl = user?.avatarUrl || user?.AvatarUrl || null;
  const showDashboardButton = upperRoles.includes("ADMIN") || upperRoles.includes("STAFF");

  const handleGoToDashboard = () => {
    if (upperRoles.includes("ADMIN")) {
      navigate(PATH.ADMIN.DASHBOARD);
    } else  if(upperRoles.includes("MANAGER")){
      navigate(PATH.MANAGER.CUSTOMER_ANALYTICS);
    }else{
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

  const [query, setQuery] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showFriendMenu, setShowFriendMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const friendMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (friendMenuRef.current && !friendMenuRef.current.contains(e.target as Node)) {
        setShowFriendMenu(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);


  const handleSearch = () => {
    if (!query.trim()) return;
    navigate(
      `${PATH.PUBLIC.TOUR_SEARCH}?searchTerm=${encodeURIComponent(query.trim())}`,
    );
  };

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

          <div className="search-bar-glass hidden max-w-xl flex-1 lg:flex">
            <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder={t("header.searchPlaceholder")}
              className="w-full border-none bg-transparent text-sm text-navy outline-none placeholder:text-slate-400"
              aria-label={t("header.searchLabel")}
            />
          </div>
        </div>

        {/* Actions: discovery → social → preferences → account */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <button
            type="button"
            className="icon-btn lg:hidden"
            aria-label="Search"
            onClick={() => navigate(PATH.PUBLIC.TOUR_SEARCH)}
          >
            <Search className="h-5 w-5" />
          </button>

          <Link
            to={PATH.PUBLIC.ABOUT}
            className={`hidden items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition-colors md:inline-flex !no-underline ${
              pathname === PATH.PUBLIC.ABOUT
                ? "bg-brand-light text-brand"
                : "text-slate-600 hover:bg-brand-light/40 hover:text-brand"
            }`}
            title={t("header.aboutUsTitle")}
          >
            <Info className="h-4 w-4" />
            <span>{t("header.aboutUs")}</span>
          </Link>

          <button
            type="button"
            className="icon-btn hidden sm:inline-flex"
            aria-label="Browse tours"
            title={t("header.browseTours")}
            onClick={() => navigate(PATH.PUBLIC.TOURS)}
          >
            <ShoppingBag className="h-5 w-5" />
          </button>

          {user ? (
            <>
              {showDashboardButton && (
                <ActionButton
                  variant="ghost"
                  onClick={handleGoToDashboard}
                  className="hidden gap-1.5 md:inline-flex"
                  title={t("header.dashboard")}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="hidden lg:inline">{t("header.dashboard")}</span>
                </ActionButton>
              )}

              <button
                type="button"
                onClick={() => navigate("/social/moments")}
                className="icon-btn"
                title={t("header.moments")}
                aria-label={t("header.moments")}
              >
                <Map className="h-5 w-5" />
              </button>

              <div className="relative" ref={friendMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowFriendMenu((v) => !v)}
                  className="icon-btn relative"
                  title={t("header.friends")}
                  aria-label={t("header.friends")}
                >
                  <Users className="h-5 w-5" />
                  {pendingCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                      {pendingCount > 99 ? "99+" : pendingCount}
                    </span>
                  )}
                </button>

                {showFriendMenu && (
                  <div className="glass-dropdown absolute right-0 top-full z-50 mt-2 w-80 p-2">
                    <div className="mb-1 border-b border-slate-100/80 px-3 py-2">
                      <h3 className="text-sm font-bold text-navy">{t("header.friendRequests")}</h3>
                    </div>
                    <div className="custom-scrollbar max-h-64 overflow-y-auto">
                      {pendingCount === 0 ? (
                        <p className="p-4 text-center text-sm text-slate-500">
                          {t("header.noNewRequests")}
                        </p>
                      ) : (
                        (pendingRequests ?? [])
                          .slice(0, 5)
                          .map((req) => (
                            <button
                              key={req.id}
                              type="button"
                              className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-brand-light/50"
                              onClick={() => {
                                setShowFriendMenu(false);
                                navigate(`/social/profile/${req.senderId}`);
                              }}
                            >
                              <UserAvatar
                                name={req.senderName}
                                avatarUrl={req.senderAvatarUrl}
                                size="md"
                              />
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-navy">
                                  {req.senderName || t("common.user")}
                                </p>
                                <p className="text-xs text-slate-500">{t("header.sentYouRequest")}</p>
                              </div>
                            </button>
                          ))
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowFriendMenu(false);
                        navigate(PATH.CUSTOMER.SOCIAL_FRIENDS);
                      }}
                      className="mt-1 w-full rounded-lg py-2 text-center text-sm font-semibold text-brand hover:bg-brand-light/60"
                    >
                      {t("common.seeAll")}
                    </button>
                  </div>
                )}
              </div>

              <WishlistHeaderButton />

              <NotificationBell />

              <div className="relative ml-0.5" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowUserMenu((v) => !v)}
                  className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-brand-light/40 md:pr-3"
                  aria-expanded={showUserMenu}
                  aria-haspopup="menu"
                >
                  <UserAvatar name={displayName} avatarUrl={avatarUrl} size="md" />
                  <span className="hidden max-w-[140px] truncate text-sm font-semibold text-navy xl:inline">
                    {displayName}
                  </span>
                </button>

                {showUserMenu && (
                  <div
                    className="glass-dropdown absolute right-0 top-full z-50 mt-2 w-56 p-1.5"
                    role="menu"
                  >
                    <div className="border-b border-slate-100/80 px-3 py-2.5">
                      <p className="truncate text-sm font-bold text-navy">{displayName}</p>
                      <p className="truncate text-xs text-slate-500">{user?.email || user?.Email}</p>
                    </div>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        navigate(PATH.CUSTOMER.PROFILE);
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

                    {/* Settings Group */}
                    <div className="mt-1.5 border-t border-slate-100/80 bg-slate-50/50 -mx-1.5 -mb-1.5 p-3 rounded-b-xl flex flex-col gap-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500">Language</span>
                        <LanguageSwitcher />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500">Currency</span>
                        <CurrencyToggle className="inline-flex" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500">Theme</span>
                        <ThemeToggle variant="menu" className="flex-1 ml-4" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <CurrencyToggle />
              <LanguageSwitcher />
              <ThemeToggle />

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
