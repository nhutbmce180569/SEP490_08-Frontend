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
  Ticket,
  UserCog,
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
import { getSearchSuggestions } from "../../hooks/useSearchTours";
import { useSystemSettings } from "../../features/system/hooks/useSystemSettings";
import { getImg } from "../../config/api/api";

export default function Header() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { success } = useToast();
  const { getSetting } = useSystemSettings();
  const webVideoLogo = getSetting("WebVideoLogo");
  const videoSource = webVideoLogo ? getImg(webVideoLogo) : dragonLogoVideo;
  const { t } = useTranslation();
  const { user, logout: contextLogout } = useContext(AuthContext);
  const { open: openAiPlanner } = useAiPlanner();
  const { toggle: toggleTourAssistantChat } = useTourAssistantChatState();

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
  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (searchInputRef.current && !searchInputRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (!searchText.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setIsSuggestionsLoading(true);
        const results = await getSearchSuggestions(searchText, controller.signal);
        setSuggestions(results);
        setShowSuggestions(true);
      } catch (error: any) {
        if (error.name !== 'CanceledError') {
          console.error("Failed to fetch search suggestions:", error);
          setSuggestions([]);
        }
      } finally {
        setIsSuggestionsLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchText]);


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
              src={videoSource}
              className="absolute left-1/2 top-1/2 h-28 w-28 max-w-none -translate-x-1/2 -translate-y-1/2 object-contain md:h-32 md:w-32"
              autoPlay
              loop
              muted
              playsInline
              aria-hidden
            />
          </Link>


          {/* Header Quick Search Input */}
          <div className="relative hidden md:flex items-center ml-2" ref={searchInputRef}>
            <div className="relative flex items-center z-[110]">
              <Search size={15} className="absolute left-3 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder={t("header.searchPlaceholder", { defaultValue: "Tìm điểm đến, tour..." })}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onFocus={() => searchText.trim() && setShowSuggestions(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.currentTarget.value.trim()) {
                    setShowSuggestions(false);
                    navigate(`${PATH.PUBLIC.TOUR_SEARCH}?searchTerm=${encodeURIComponent(e.currentTarget.value.trim())}`);
                  }
                }}
                className={`h-9 w-44 lg:w-56 pl-9 pr-3 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 outline-none transition-all duration-300 placeholder:text-slate-400 ${
                  showSuggestions && searchText.trim() ? "w-64 ring-2 ring-brand/30 border-brand" : "focus:w-64 focus:ring-2 focus:ring-brand/30 focus:border-brand"
                }`}
              />
            </div>
            
            {showSuggestions && (
              <div className="absolute top-[calc(100%+8px)] left-0 w-64 lg:w-[320px] z-[100] bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden text-slate-800">
                {isSuggestionsLoading ? (
                  <div className="p-4 text-center text-sm text-slate-500">{t("common.loading", { defaultValue: "Loading..." })}</div>
                ) : suggestions.length > 0 ? (
                  <ul className="py-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {suggestions.map((suggestion, index) => (
                      <li key={index}>
                        <button
                          type="button"
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-brand-light/50 outline-none text-left transition-colors"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setSearchText(suggestion);
                            setShowSuggestions(false);
                            navigate(`${PATH.PUBLIC.TOUR_SEARCH}?searchTerm=${encodeURIComponent(suggestion)}`);
                          }}
                        >
                          <Search className="h-4 w-4 text-slate-400 shrink-0" />
                          <span
                            className="truncate"
                            dangerouslySetInnerHTML={{
                              __html: suggestion.replace(
                                new RegExp(`(${searchText})`, 'gi'),
                                '<strong class="font-bold text-brand">$1</strong>'
                              ),
                            }}
                          />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-4 text-center text-sm text-slate-500">{t("tour.noToursFound", { defaultValue: "No matches found" })}</div>
                )}
              </div>
            )}
          </div>

          {/* Main Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1 ml-4 shrink-0">
            <Link
              id="tour-browse"
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
              id="tour-ai-guide"
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
                  id="tour-moments"
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
                  id="tour-friends"
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

          {user ? (
            <>
              <NotificationBell />

              <WishlistHeaderButton />

              <LanguageCurrencySelector className="hidden md:block" />

              <div className="relative ml-0.5" ref={userMenuRef}>
                  <button
                    id="tour-profile"
                    type="button"
                    onClick={() => setShowUserMenu((v) => !v)}
                    className={`flex items-center justify-center rounded-full p-0.5 transition-all hover:scale-105 ${
                      showUserMenu ? 'ring-2 ring-brand ring-offset-2 dark:ring-offset-slate-900 shadow-sm' : 'hover:ring-2 hover:ring-brand/40'
                    }`}
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
                          navigate(PATH.CUSTOMER.MY_BOOKINGS);
                          setShowUserMenu(false);
                        }}
                        className="menu-item"
                      >
                        <UserCog className="h-4 w-4" />
                        {t("header.accountManagement")}
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
                      <p className="mb-1 text-[10px] font-bold text-slate-400">
                        {t("common.theme")}
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
              <LanguageCurrencySelector className="hidden md:block" />
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
