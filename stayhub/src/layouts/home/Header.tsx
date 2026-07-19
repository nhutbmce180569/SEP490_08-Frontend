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
  Sparkles,
  MessageCircle,
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
import { getDashboardPath } from "../../utils/jwt";
import { AuthContext } from "../../contexts/AuthContext";

import { useTranslation } from "../../contexts/LocaleContext";
import { useToast } from "../../contexts/ToastContext";
import { logout as logoutApi } from "../../features/auth/services/auth.service";
import { useGetPendingRequests } from "../../features/social/friends/hooks/useFriends";
import { CurrencyToggle } from "../../features/currency/CurrencyToggle";
import { WishlistHeaderButton } from "../../features/wishlist/customer/components/WishlistHeaderButton";
import { getSearchSuggestions } from "../../hooks/useSearchTours";
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
  const showDashboardButton =
    upperRoles.includes("ADMIN") ||
    upperRoles.includes("MANAGER") ||
    upperRoles.includes("OPERATOR") ||
    upperRoles.includes("STAFF");

  const handleGoToDashboard = () => {
    navigate(getDashboardPath(userRoles));
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
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showFriendMenu, setShowFriendMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const friendMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      // Thêm: Đóng gợi ý khi click ra ngoài
      if (searchBarRef.current && !searchBarRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
      if (friendMenuRef.current && !friendMenuRef.current.contains(e.target as Node)) {
        setShowFriendMenu(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Thêm: Debounce và gọi API gợi ý
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setIsSuggestionsLoading(true);
        const results = await getSearchSuggestions(query, controller.signal);
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
    }, 300); // Debounce 300ms

    return () => {
      clearTimeout(timer);
      controller.abort(); // Hủy request cũ
    };
  }, [query]);

  const handleSearch = () => {
    if (!query.trim()) return;
    navigate(
      `${PATH.PUBLIC.TOUR_SEARCH}?searchTerm=${encodeURIComponent(query.trim())}`,
    );
    setShowSuggestions(false);
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

          {pathname !== PATH.PUBLIC.HOME && (
            <div ref={searchBarRef} className="search-bar-glass hidden relative max-w-md flex-1 lg:flex items-center">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                onFocus={() => query.trim() && setShowSuggestions(true)}
                placeholder={t("header.searchPlaceholder")}
                className="w-full border-none bg-transparent text-sm text-navy outline-none placeholder:text-slate-400 pr-2"
                aria-label={t("header.searchLabel")}
              />
              <button
                type="button"
                onClick={handleSearch}
                className="p-1 rounded-full hover:bg-slate-200/60 transition-colors"
                aria-label={t("common.search")}
              >
                <Search className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
              </button>
              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">
                  {isSuggestionsLoading ? (
                    <div className="p-4 text-center text-sm text-slate-500">{t("common.loading")}</div>
                  ) : suggestions.length > 0 ? (
                    <ul className="py-1">
                      {suggestions.map((suggestion, index) => (
                        <li key={index}>
                          <Link
                            to={`${PATH.PUBLIC.TOUR_SEARCH}?searchTerm=${encodeURIComponent(suggestion)}`}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-brand-light/50 !no-underline"
                            onClick={() => {
                              setQuery(suggestion);
                              setShowSuggestions(false);
                            }}
                          >
                            <Search className="h-4 w-4 text-slate-400" />
                            <span
                              dangerouslySetInnerHTML={{
                                __html: suggestion.replace(
                                  new RegExp(`(${query})`, 'gi'),
                                  '<strong class="font-bold text-brand">$1</strong>'
                                ),
                              }}
                            />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-4 text-center text-sm text-slate-500">{t("tour.noToursFound")}</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Main Navigation Links */}
          <nav className="hidden xl:flex items-center gap-6 ml-6 shrink-0">
            <Link
              to={PATH.PUBLIC.TOURS}
              className={`text-sm font-semibold transition-colors !no-underline ${
                pathname === PATH.PUBLIC.TOURS
                  ? "text-brand"
                  : "text-slate-600 hover:text-brand dark:text-slate-300 dark:hover:text-brand"
              }`}
            >
              {t("header.browseTours")}
            </Link>
            
            <button
              type="button"
              onClick={() => openAiPlanner(pathname)}
              className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-brand dark:text-slate-300 dark:hover:text-brand transition-colors"
            >
              <Sparkles size={14} className="text-brand animate-pulse" />
              <span>{t("header.aiGuide")}</span>
            </button>

            {user && (
              <>
                <Link
                  to="/social/moments"
                  className={`text-sm font-semibold transition-colors !no-underline ${
                    pathname === "/social/moments"
                      ? "text-brand"
                      : "text-slate-600 hover:text-brand dark:text-slate-300 dark:hover:text-brand"
                  }`}
                >
                  {t("header.moments")}
                </Link>
                <Link
                  to={PATH.CUSTOMER.SOCIAL_FRIENDS}
                  className={`text-sm font-semibold transition-colors !no-underline ${
                    pathname === PATH.CUSTOMER.SOCIAL_FRIENDS
                      ? "text-brand"
                      : "text-slate-600 hover:text-brand dark:text-slate-300 dark:hover:text-brand"
                  }`}
                >
                  {t("header.friends")}
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
                className="icon-btn xl:hidden"
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
            </>
          ) : null}

          {/* Grouped Language & Currency Switcher (Traveloka style) */}
          <div className="hidden md:flex items-center gap-1.5 border border-slate-200/80 bg-white/70 dark:border-slate-800 dark:bg-slate-900/60 rounded-full px-2.5 py-1 backdrop-blur-sm shadow-sm select-none">
            <LanguageSwitcher variant="icon" className="!p-0 !h-auto !w-auto text-xs font-bold text-slate-600 hover:text-brand dark:text-slate-300 dark:hover:text-brand bg-transparent border-none shadow-none" />
            <span className="text-slate-300 dark:text-slate-700 text-sm">|</span>
            <CurrencyToggle className="!border-none !bg-transparent !p-0 !shadow-none !m-0" />
          </div>

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
                className={`icon-btn relative hover:bg-brand-light/40 ${isPopoverOpen ? 'text-brand bg-brand-light/20' : 'text-slate-600 dark:text-slate-300'}`}
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

              <div className="relative ml-0.5" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowUserMenu((v) => !v)}
                  className="flex items-center justify-center rounded-full p-0.5 transition-colors hover:bg-brand-light/40 ring-2 ring-transparent hover:ring-brand-light"
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
