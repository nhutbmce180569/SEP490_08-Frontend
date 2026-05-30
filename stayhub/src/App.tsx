import React, { useContext } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  Outlet,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import ScrollToTop from "./components/ScrollToTop";
import { PATH } from "./config/routes/route";
import { AuthProvider, AuthContext } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import { AdminLayout } from "./layouts/AdminLayout";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { MainLayout } from "./layouts/MainLayout";
import { ProfileLayout } from "./layouts/ProfileLayout";
import Unauthorized from "./pages/Unauthorized";
import Home from "./pages/Home";

import Login from "./features/auth/pages/Login";
import Register from "./features/auth/pages/Register";
import ForgotPassword from "./features/auth/pages/ForgotPassword";
import ResetPassword from "./features/auth/pages/ResetPassword";
import ChangePassword from "./features/auth/pages/ChangePassword";
import { Profile } from "./features/auth/pages/Profile";
import { FriendsManagement } from "./features/social/friends/pages/FriendsManagement";
import { MomentsFeed } from "./features/social/moments/components/MomentsFeed";
import { SocialProfile } from "./features/social/profile/pages/SocialProfile";

// Components dành cho Quản lý User (Admin)
import UserList from "./features/auth/pages/UserList";
import CreateUser from "./features/auth/pages/CreateUser";
import UpdateUser from "./features/auth/pages/UpdateUser";
import DeleteUserConfirm from "./features/auth/pages/DeleteUser";
import { TourList } from "./features/tour/pages/TourList";
import { CreateTour } from "./features/tour/pages/CreateTour";
import { TourDetail } from "./features/tour/pages/TourDetail";
import { UpdateTour } from "./features/tour/pages/UpdateTour";
import { DeleteTourConfirm } from "./features/tour/pages/DeleteTour";
import PartnerDashboard from "./pages/PartnerDashboard";
// Components dành cho Quản lý nội dung (Admin)
import { CategoryList } from "./features/content/pages/CategoryList";
import { CreateCategory } from "./features/content/pages/CreateCategory";
import { UpdateCategory } from "./features/content/pages/UpdateCategory";
import { DeleteCategoryConfirm } from "./features/content/pages/DeleteCategory";
import { BannerList } from "./features/content/pages/BannerList";
import { CreateBanner } from "./features/content/pages/CreateBanner";
import { UpdateBanner } from "./features/content/pages/UpdateBanner";
import { DeleteBannerConfirm } from "./features/content/pages/DeleteBanner";
import { TicketTypeList } from "./features/content/pages/TicketTypeList";
import { CreateTicketType } from "./features/content/pages/CreateTicketType";
import { UpdateTicketType } from "./features/content/pages/UpdateTicketType";
import { CreateItinerary } from "./features/tour/pages/CreateItinerary";
import { UpdateItinerary } from "./features/tour/pages/UpdateItinerary";
import { DeleteItineraryConfirm } from "./features/tour/pages/DeleteItinerary";
import { TourScheduleList } from "./features/tour/pages/TourScheduleList";
import { TourScheduleDetail } from "./features/tour/pages/TourScheduleDetail";
import { CreateScheduleItinerary } from "./features/tour/pages/CreateScheduleItinerary";
import { UpdateScheduleItinerary } from "./features/tour/pages/UpdateScheduleItinerary";
import { DeleteScheduleItinerary } from "./features/tour/pages/DeleteScheduleItinerary";
import { CreateScheduleTicket } from "./features/tour/pages/CreateScheduleTicket";
import { UpdateScheduleTicket } from "./features/tour/pages/UpdateScheduleTicket";
import { DeleteScheduleTicket } from "./features/tour/pages/DeleteScheduleTicket";
import PublicTourDetail from "./pages/TourDetail";
import TourSearch from "./pages/TourSearch";
import { BookingPage } from "./features/booking/pages/BookingPage";
import { MyBookingsPage } from "./features/booking/pages/MyBookingsPage";
import { OrderDetailPage } from "./features/booking/pages/OrderDetailPage";
import { MyReviewsPage } from "./features/tour/pages/MyReviewsPage";
const queryClient = new QueryClient();

const pageCopy: Record<string, string> = {
  "Sign In": "Mock login screen for the new source setup.",
  Register: "Mock registration screen for the new source setup.",
  "Forgot Password": "Mock password recovery flow.",
  "Reset Password": "Mock password reset flow.",
  "Change Password": "Mock authenticated password change screen.",
  "Tour Search": "Mock tour catalog and search results.",
  "Tour Detail": "Mock public tour detail page.",
  Checkout: "Mock checkout flow.",
  Profile: "Mock customer profile page.",
  "My Bookings": "Mock booking history.",
  "Booking Detail": "Mock booking detail page.",
  Wishlist: "Mock wishlist page.",
  "Partner Profile": "Mock tour operator profile page.",
  Vouchers: "Mock customer vouchers page.",
  Reviews: "Mock reviews page.",
  Settings: "Mock account settings page.",
  Notifications: "Mock notification center.",
  Friends: "Mock social friends page.",
  Moments: "Mock travel moments feed.",
  "Social Profile": "Mock social profile page.",
  "Upgrade Partner": "Mock partner upgrade form.",
};

const MockPage: React.FC<{ title: string; section?: string }> = ({
  title,
  section = "Mock UI",
}) => (
  <div className="mx-auto w-full max-w-6xl px-4 py-10">
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-2 border-b border-slate-100 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#EB662B]">
            {section}
          </p>
          <h1 className="mt-2 text-2xl font-black text-slate-900 md:text-3xl">
            {title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500">
            {pageCopy[title] ??
              "Temporary placeholder screen. Route is kept so navigation can be wired back later."}
          </p>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
          route-ready
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {["Overview", "Data", "Actions"].map((label, index) => (
          <div
            key={label}
            className="min-h-32 rounded-xl border border-slate-100 bg-slate-50 p-4"
          >
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-white text-sm font-black text-[#EB662B] shadow-sm">
              {index + 1}
            </div>
            <h2 className="text-sm font-bold text-slate-800">{label}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Mock content block for layout testing while the real feature is
              being migrated.
            </p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const mock = (title: string, section?: string) => (
  <MockPage title={title} section={section} />
);

const childPath = (path: string) =>
  path
    .replace(`${PATH.MANAGER.DASHBOARD}/`, "")
    .replace(`${PATH.ADMIN.DASHBOARD}/`, "");

// Component bảo vệ các tuyến đường yêu cầu đăng nhập và phân quyền (RBAC)
const ProtectedRoute: React.FC<{ allowedRoles?: string[] }> = ({
  allowedRoles,
}) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#EB662B] border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={PATH.PUBLIC.LOGIN} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRoles = Array.isArray(user.roles)
      ? user.roles
      : typeof user.roles === "string"
        ? [user.roles]
        : [];
    const upperRoles = userRoles.map((r: string) => r.toUpperCase());
    const hasAccess = allowedRoles.some((role) =>
      upperRoles.includes(role.toUpperCase()),
    );

    if (!hasAccess) {
      return <Navigate to={PATH.PUBLIC.UNAUTHORIZED} replace />;
    }
  }

  return <Outlet />;
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <Router>
            <ScrollToTop />
            <Routes>
              <Route path={PATH.PUBLIC.LOGIN} element={<Login />} />
              <Route path={PATH.PUBLIC.REGISTER} element={<Register />} />
              <Route
                path={PATH.PUBLIC.FORGOT_PASSWORD}
                element={<ForgotPassword />}
              />
              <Route
                path={PATH.PUBLIC.RESET_PASSWORD}
                element={<ResetPassword />}
              />
              <Route
                path={PATH.PUBLIC.CHANGE_PASSWORD}
                element={<ChangePassword />}
              />
              <Route
                path={PATH.PUBLIC.UNAUTHORIZED}
                element={<Unauthorized />}
              />

              <Route element={<MainLayout />}>
                <Route path={PATH.PUBLIC.HOME} element={<Home />} />
                <Route
                  path={PATH.PUBLIC.TOURS}
                  element={<TourSearch />}
                />
                <Route
                  path={PATH.PUBLIC.TOUR_SEARCH}
                  element={<TourSearch />}
                />
                <Route
                  path={PATH.PUBLIC.TOUR_DETAIL()}
                  element={<PublicTourDetail />}
                />
                <Route
                  path={PATH.CUSTOMER.CHECKOUT()}
                  element={<BookingPage />}
                />
                {/* <Route
                  path={PATH.CUSTOMER.SOCIAL_MOMENTS}
                  element={mock("Moments", "Social")}
                /> */}
                <Route
                  path="/social/profile/:id"
                  element={<SocialProfile />}
                />

                {/* Các trang yêu cầu đăng nhập dành cho khách hàng */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<ProfileLayout />}>
                    <Route path={PATH.CUSTOMER.PROFILE} element={<Profile />} />
                    <Route
                      path={PATH.CUSTOMER.MY_BOOKINGS}
                      element={<MyBookingsPage />}
                    />
                    <Route
                      path={PATH.CUSTOMER.BOOKING_DETAIL()}
                      element={<OrderDetailPage />}
                    />
                    <Route
                      path={PATH.CUSTOMER.WISHLIST}
                      element={mock("Wishlist", "Customer")}
                    />
                    <Route
                      path={PATH.CUSTOMER.VOUCHERS}
                      element={mock("Vouchers", "Customer")}
                    />
                    <Route
                      path={PATH.CUSTOMER.MY_REVIEWS}
                      element={<MyReviewsPage />}
                    />
                    <Route
                      path={PATH.CUSTOMER.SETTINGS}
                      element={mock("Settings", "Customer")}
                    />
                    <Route
                      path={PATH.CUSTOMER.NOTIFICATIONS}
                      element={mock("Notifications", "Customer")}
                    />
                    <Route path="/social/moments" 
                    element={<MomentsFeed scheduleId={1} />} />
                    <Route
                      path={PATH.CUSTOMER.SOCIAL_FRIENDS}
                      element={<FriendsManagement />}
                    />
                  </Route>
                </Route>
              </Route>

              {/* Phân hệ dành cho Điều hành viên (Tour Operator / Manager) */}
              <Route
                element={<ProtectedRoute allowedRoles={["MANAGER", "STAFF"]} />}
              >
                <Route
                  path={PATH.MANAGER.DASHBOARD}
                  element={<DashboardLayout />}
                >
                  <Route index element={<PartnerDashboard />} />
                  <Route
                    path={childPath(PATH.MANAGER.MY_TOURS)}
                    element={<TourList />}
                  />
                  <Route
                    path={childPath(PATH.MANAGER.CREATE_TOUR)}
                    element={<CreateTour />}
                  />
                  <Route
                    path={childPath(PATH.MANAGER.TOUR_DETAIL())}
                    element={<TourDetail />}
                  />
                  <Route
                    path={childPath(PATH.MANAGER.EDIT_TOUR())}
                    element={<UpdateTour />}
                  />
                  <Route
                    path={childPath(PATH.MANAGER.DELETE_TOUR())}
                    element={<DeleteTourConfirm />}
                  />
                  <Route
                    path={childPath(PATH.MANAGER.CREATE_ITINERARY())}
                    element={<CreateItinerary />}
                  />
                  <Route
                    path={childPath(PATH.MANAGER.EDIT_ITINERARY())}
                    element={<UpdateItinerary />}
                  />
                  <Route
                    path={childPath(PATH.MANAGER.DELETE_ITINERARY())}
                    element={<DeleteItineraryConfirm />}
                  />
                  <Route
                    path={childPath(PATH.MANAGER.SCHEDULE_MANAGEMENT)}
                    element={<TourScheduleList />}
                  />
                  <Route
                    path={childPath(PATH.MANAGER.CREATE_SCHEDULE())}
                    element={mock("Create Schedule", "Partner")}
                  />
                  <Route
                    path={childPath(PATH.MANAGER.SCHEDULE_DETAIL())}
                    element={<TourScheduleDetail />}
                  />
                  <Route
                    path={childPath(PATH.MANAGER.EDIT_SCHEDULE())}
                    element={mock("Edit Schedule", "Partner")}
                  />
                  <Route
                    path={childPath(PATH.MANAGER.DELETE_SCHEDULE())}
                    element={mock("Delete Schedule", "Partner")}
                  />
                  <Route
                    path={childPath(PATH.MANAGER.CREATE_SCHEDULE_ITINERARY())}
                    element={<CreateScheduleItinerary />}
                  />
                  <Route
                    path={childPath(PATH.MANAGER.EDIT_SCHEDULE_ITINERARY())}
                    element={<UpdateScheduleItinerary/>}
                  />
                  <Route
                    path={childPath(PATH.MANAGER.DELETE_SCHEDULE_ITINERARY())}
                    element={<DeleteScheduleItinerary />}
                  />
                  <Route
                    path={childPath(PATH.MANAGER.CREATE_SCHEDULE_TICKET())}
                    element={<CreateScheduleTicket />}
                  />
                  <Route
                    path={childPath(PATH.MANAGER.EDIT_SCHEDULE_TICKET())}
                    element={<UpdateScheduleTicket />}
                  />
                  <Route
                    path={childPath(PATH.MANAGER.DELETE_SCHEDULE_TICKET())}
                    element={<DeleteScheduleTicket />}
                  />
                  <Route
                    path={childPath(PATH.MANAGER.SCHEDULE_ORDERS())}
                    element={mock("Schedule Orders", "Partner")}
                  />
                  <Route
                    path={childPath(PATH.MANAGER.SCHEDULE_CHECKIN())}
                    element={mock("Schedule Check-in", "Partner")}
                  />
                  <Route
                    path={childPath(PATH.MANAGER.BOOKING_MANAGEMENT)}
                    element={mock("Booking Management", "Partner")}
                  />
                  <Route
                    path={childPath(PATH.MANAGER.CHECK_IN)}
                    element={mock("Check-in", "Partner")}
                  />
                  <Route path={childPath(PATH.MANAGER.VOUCHERS)}>
                    <Route
                      index
                      element={mock("MANAGER Vouchers", "Partner")}
                    />
                    <Route
                      path="create"
                      element={mock("Create Voucher", "Partner")}
                    />
                    <Route
                      path=":id"
                      element={mock("Voucher Detail", "Partner")}
                    />
                    <Route
                      path=":id/edit"
                      element={mock("Edit Voucher", "Partner")}
                    />
                    <Route
                      path=":id/delete"
                      element={mock("Delete Voucher", "Partner")}
                    />
                  </Route>
                  <Route
                    path={childPath(PATH.MANAGER.REVIEWS)}
                    element={mock("Reviews", "Partner")}
                  />
                  <Route
                    path={childPath(PATH.MANAGER.PAYOUT)}
                    element={mock("Payout", "Partner")}
                  />
                </Route>
              </Route>

              {/* Phân hệ Quản trị viên cấp cao (Admin) */}
              <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
                <Route path={PATH.ADMIN.DASHBOARD} element={<AdminLayout />}>
                  <Route index element={mock("Admin Dashboard", "Admin")} />
                  <Route path={childPath(PATH.ADMIN.USER_MANAGEMENT)}>
                    <Route index element={<UserList />} />
                    <Route path="create" element={<CreateUser />} />
                    <Route path=":id/edit" element={<UpdateUser />} />
                    <Route path=":id/delete" element={<DeleteUserConfirm />} />
                  </Route>
                  <Route
                    path={childPath(PATH.ADMIN.PARTNER_APPROVAL)}
                    element={mock("Partner Approvals", "Admin")}
                  />
                  <Route path={childPath(PATH.ADMIN.TOUR_MODERATION)}>
                    <Route index element={mock("Tours", "Admin")} />
                    <Route
                      path=":id"
                      element={mock("Admin Tour Detail", "Admin")}
                    />
                  </Route>
                  <Route
                    path={childPath(PATH.ADMIN.REPORT_MODERATION)}
                    element={mock("Violation Reports", "Admin")}
                  />
                  <Route
                    path={childPath(PATH.ADMIN.WITHDRAWALS)}
                    element={mock("Withdrawals", "Admin")}
                  />
                  <Route path={childPath(PATH.ADMIN.SYSTEM_VOUCHERS)}>
                    <Route index element={mock("System Vouchers", "Admin")} />
                    <Route
                      path="create"
                      element={mock("Create Voucher", "Admin")}
                    />
                    <Route
                      path=":id"
                      element={mock("Voucher Detail", "Admin")}
                    />
                    <Route
                      path=":id/edit"
                      element={mock("Edit Voucher", "Admin")}
                    />
                    <Route
                      path=":id/delete"
                      element={mock("Delete Voucher", "Admin")}
                    />
                  </Route>
                  <Route path={childPath(PATH.ADMIN.BANNER_MANAGEMENT)}>
                    <Route index element={<BannerList />} />
                    <Route path="create" element={<CreateBanner />} />
                    <Route path=":id/edit" element={<UpdateBanner />} />
                    <Route
                      path=":id/delete"
                      element={<DeleteBannerConfirm />}
                    />
                  </Route>
                  <Route path={childPath(PATH.ADMIN.TICKET_TYPE_MANAGEMENT)}>
                    <Route index element={<TicketTypeList />} />
                    <Route path="create" element={<CreateTicketType />} />
                    <Route path=":id/edit" element={<UpdateTicketType />} />
                  </Route>
                  <Route path={childPath(PATH.ADMIN.CATEGORY_MANAGEMENT)}>
                    <Route index element={<CategoryList />} />
                    <Route path="create" element={<CreateCategory />} />
                    <Route path=":id/edit" element={<UpdateCategory />} />
                    <Route
                      path=":id/delete"
                      element={<DeleteCategoryConfirm />}
                    />
                  </Route>
                  <Route
                    path={childPath(PATH.ADMIN.SYSTEM_SETTINGS)}
                    element={mock("System Settings", "Admin")}
                  />
                </Route>
              </Route>

              <Route
                path="*"
                element={mock("404 - Page Not Found", "System")}
              />
            </Routes>
          </Router>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
};

export default App;
