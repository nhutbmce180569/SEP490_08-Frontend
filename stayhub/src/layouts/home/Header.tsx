import { useMemo, useState, useContext } from "react";
import { ActionButton } from "../../components/home/ActionButton";
import { PATH } from "../../config/routes/route";
import { useNavigate, Link } from "react-router-dom";
import { ConfirmDialog } from "../../components/dashboard/ConfirmDialog";
import { useToast } from "../../contexts/ToastContext";

// IMPORT THÊM CONTEXT VÀ SERVICE
import { AuthContext } from "../../contexts/AuthContext";
import { logout as logoutApi } from "../../features/auth/services/auth.service";
import { Heart, Lock, LogOut, User, LayoutDashboard, Map, Users, UserCheck, UserX } from "lucide-react";
import { useGetPendingRequests } from "../../features/social/friends/hooks/useFriends";
// TÌM ĐÚNG ĐƯỜNG DẪN IMPORT CỦA BẠN VÀ ĐẶT VÀO ĐÂY
import  NotificationBell  from "../../features/system/components/NotificationBell";
import { LoadingOverlay } from "../../components/home/LoadingOverlay";
import logoBlue from "../../assets/logo_blue.png";

type DropdownOption = { label: string; value: string };

function HeaderDropdown({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: DropdownOption[];
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <label
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        height: 42,
        padding: "0 14px 0 18px",
        borderRadius: 12,
        border: "1px solid rgba(5,7,60,0.08)",
        background: "#fff",
        cursor: "pointer",
      }}
    >
      <span style={{ fontSize: 14.5, color: "#05073C", fontWeight: 500 }}>
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          border: "none",
          outline: "none",
          background: "transparent",
          fontSize: 14,
          color: "#05073C",
          cursor: "pointer",
          paddingRight: 4,
        }}
        aria-label={label}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function Header() {
  const navigate = useNavigate();
  const { success } = useToast();
  
  const { user, logout: contextLogout } = useContext(AuthContext);
  
  const { data: pendingRequests } = useGetPendingRequests(Boolean(user));
  const pendingCount = Array.isArray(pendingRequests) ? pendingRequests.length : 0;

  const userRoles = Array.isArray(user?.roles)
    ? user?.roles
    : typeof user?.roles === "string"
    ? [user?.roles]
    : [];
  const upperRoles = userRoles.map((r: string) => r.toUpperCase());
  const showDashboardButton = upperRoles.includes("ADMIN") || upperRoles.includes("OPERATOR") || upperRoles.includes("STAFF");

  const handleGoToDashboard = () => {
    if (upperRoles.includes("ADMIN")) {
      navigate(PATH.ADMIN.DASHBOARD);
    } else {
      navigate(PATH.MANAGER.DASHBOARD);
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
  const [destination, setDestination] = useState("all");
  const [activity, setActivity] = useState("all");
  const [currency, setCurrency] = useState("usd");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showFriendMenu, setShowFriendMenu] = useState(false);
const [isLoggingOut, setIsLoggingOut] = useState(false);

  const destinationOptions = useMemo<DropdownOption[]>(
    () => [
      { label: "All", value: "all" },
      { label: "Paris", value: "paris" },
      { label: "Tokyo", value: "tokyo" },
      { label: "Bangkok", value: "bangkok" },
      { label: "Bali", value: "bali" },
    ],
    []
  );

  const activityOptions = useMemo<DropdownOption[]>(
    () => [
      { label: "All", value: "all" },
      { label: "City tours", value: "city" },
      { label: "Nature", value: "nature" },
      { label: "Food", value: "food" },
      { label: "Adventure", value: "adventure" },
    ],
    []
  );

  const currencyOptions = useMemo<DropdownOption[]>(
    () => [
      { label: "USD", value: "usd" },
      { label: "VND", value: "vnd" },
      { label: "EUR", value: "eur" },
      { label: "SGD", value: "sgd" },
    ],
    []
  );

 const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setShowLogoutConfirm(false); // Ẩn dialog lập tức khi bắt đầu xử lý
    
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        await logoutApi({ refreshToken });
      }
    } catch (error) {
      console.error("Failed to logout on server", error);
    } finally {
      contextLogout(); 
      success("Logged out successfully.");
      setIsLoggingOut(false);
    }
  };

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        height: 88,
        background: "#fff",
        borderBottom: "1px solid rgba(5,7,60,0.08)",
      }}
    >
      <div
        style={{
          maxWidth: 1320,
          height: "100%",
          margin: "0 auto",
          padding: "0 15px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 18,
          fontFamily:
            "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            flex: 1,
            paddingRight: 20,
          }}
        >
        <Link
          to={PATH.PUBLIC.HOME}
          style={{
            display: "flex",
            alignItems: "center",
            textDecoration: "none",
            flexShrink: 0,
          }}
          aria-label="StayHub home"
        >
          <img
            src={logoBlue}
            alt="StayHub"
            style={{
              display: "block",
              height: 90,
              width: "auto",
              objectFit: "contain",
            }}
          />
        </Link>

          <div
            style={{
              flex: 1,
              height: 44,
              borderRadius: 12,
              border: "1px solid rgba(5,7,60,0.12)",
              display: "flex",
              alignItems: "center",
              padding: "0 16px",
              gap: 10,
              minWidth: 150,
            }}
          >
            <span style={{ color: "#05073C", fontSize: 16 }} aria-hidden>
              ⌕
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && query.trim()) {
                  navigate(`${PATH.PUBLIC.TOUR_SEARCH}?searchTerm=${encodeURIComponent(query.trim())}`);
                }
              }}
              placeholder="Search destinations or activities"
              style={{
                width: "100%",
                border: "none",
                outline: "none",
                fontSize: 14.5,
                color: "#05073C",
              }}
            />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          {/* <HeaderDropdown
            label="Destinations"
            options={destinationOptions}
            value={destination}
            onChange={setDestination}
          />
          <HeaderDropdown
            label="Activities"
            options={activityOptions}
            value={activity}
            onChange={setActivity}
          />
          <HeaderDropdown
            label="Currency"
            options={currencyOptions}
            value={currency}
            onChange={setCurrency}
          /> */}

          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginLeft: "10px" }}>
              {showDashboardButton && (
                <ActionButton 
                  variant="outline" 
                  onClick={handleGoToDashboard} 
                  title="Go to Dashboard" 
                  className="hidden md:flex !w-auto px-4 gap-2"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </ActionButton>
              )}
              
              
              <button
                onClick={() => navigate("/social/moments")}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-[#0068E0]/10 hover:text-[#0068E0]"
                title="Moments"
                aria-label="Moments"
              >
                <Map className="h-5 w-5" />
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowFriendMenu(!showFriendMenu)}
                  className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-[#0068E0]/10 hover:text-[#0068E0]"
                  title="Friends"
                  aria-label="Friends"
                >
                  <Users className="h-5 w-5" />
                  {pendingCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white border-2 border-white shadow-sm">
                      {pendingCount > 99 ? '99+' : pendingCount}
                    </span>
                  )}
                </button>
                
                {showFriendMenu && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-100 p-2 z-50 flex flex-col">
                    <div className="px-3 py-2 border-b border-slate-100 mb-1">
                      <h3 className="text-sm font-bold text-slate-900">Friend Requests</h3>
                    </div>
                    <div className="flex flex-col max-h-64 overflow-y-auto custom-scrollbar">
                      {pendingCount === 0 ? (
                        <div className="p-4 text-sm text-slate-500 text-center">No new requests</div>
                      ) : (
                        (pendingRequests as any[]).slice(0, 5).map((req: any) => {
                          const avatar = req?.senderAvatarUrl;
                          return (
                            <div 
                              key={req.id} 
                              className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer group"
                              onClick={() => { setShowFriendMenu(false); navigate(`/social/profile/${req.senderId}`); }}
                            >
                              <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center font-bold text-slate-500 shrink-0 border border-slate-200">
                                {avatar ? (
                                  <img src={avatar} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  (req?.senderName || 'U').charAt(0).toUpperCase()
                                )}
                              </div>
                              <div className="flex flex-col overflow-hidden">
                                <span className="text-sm font-semibold text-slate-900 truncate group-hover:underline">{req?.senderName || 'Unknown'}</span>
                                <span className="text-xs text-slate-500">Sent you a friend request</span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                    <button
                      onClick={() => { setShowFriendMenu(false); navigate("/social/friends"); }}
                      className="w-full mt-2 py-2 text-center text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer border-t border-slate-50"
                    >
                      See all
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => navigate(PATH.CUSTOMER.WISHLIST)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-[#0068E0]/10 hover:text-[#0068E0]"
                title="My wishlist"
                aria-label="My wishlist"
              >
                <Heart className="h-5 w-5" />
              </button>
              {/* CÁI CHUÔNG ĐƯỢC GẮN Ở ĐÂY, NGAY BÊN TRÁI AVATAR */}
              <NotificationBell />

              <div className="relative">
                <div
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-3 cursor-pointer rounded-full hover:bg-slate-50 py-1 pl-1 pr-3 transition-colors"
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: "#0068E0",
                      color: "#fff",
                      display: "grid",
                      placeItems: "center",
                      fontWeight: 700,
                      fontSize: 15,
                  overflow: "hidden",
                    }}
                  >
                {user?.avatarUrl || user?.AvatarUrl ? (
                  <img
                    src={user.avatarUrl || user.AvatarUrl}
                    alt="User Avatar"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  (user.fullName || user.FullName || "U").charAt(0).toUpperCase()
                )}
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 600, color: "#05073C", whiteSpace: "nowrap" }}>
                    {user.fullName || user.FullName}
                  </span>
                </div>

                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 p-2 z-50 flex flex-col gap-1">
                    <button
                      onClick={() => { navigate(PATH.CUSTOMER.PROFILE); setShowUserMenu(false); }}
                      className="w-full flex items-center gap-2.5 text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-[#0068E0] rounded-lg transition-colors outline-none whitespace-nowrap"
                    >
                      <User className="h-4 w-4" />
                      My Profile
                    </button>
                    {!isSocialLogin && (
                      <button
                        onClick={() => { navigate(PATH.PUBLIC.CHANGE_PASSWORD); setShowUserMenu(false); }}
                        className="w-full flex items-center gap-2.5 text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-[#0068E0] rounded-lg transition-colors outline-none whitespace-nowrap"
                      >
                        <Lock className="h-4 w-4" />
                        Change Password
                      </button>
                    )}
                    <button
                      onClick={() => { setShowLogoutConfirm(true); setShowUserMenu(false); }}
                      className="w-full flex items-center gap-2.5 text-left px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors outline-none whitespace-nowrap"
                    >
                      <LogOut className="h-4 w-4" />
                      Log out
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <ActionButton variant="secondary" onClick={() => navigate(PATH.PUBLIC.REGISTER)}>
                Sign up
              </ActionButton>

              <ActionButton variant="primary" onClick={() => navigate(PATH.PUBLIC.LOGIN)}>
                Log in
              </ActionButton>
            </>
          )}

          <ActionButton
            variant="outline"
            aria-label="Cart"
            className="text-[18px]"
          >
            ⧉
          </ActionButton>
        </div>
      </div>

      <ConfirmDialog
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Log Out"
        message="Are you sure you want to log out of your account?"
        confirmText="Log Out"
      />
      <LoadingOverlay isOpen={isLoggingOut} message="Logging out..." />
    </header>
  );
}
