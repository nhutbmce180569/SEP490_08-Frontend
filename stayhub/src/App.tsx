import React, { useContext } from "react";
import { useState } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import ScrollToTop from "./components/ScrollToTop";
import { CustomBrandCursor } from "./components/ui/CustomBrandCursor";
import { PATH } from "./config/routes/route";
import { AuthProvider, AuthContext } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ToastProvider } from "./contexts/ToastContext";
import { AdminLayout } from "./layouts/AdminLayout";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { MainLayout } from "./layouts/MainLayout";
import { ProfileLayout } from "./layouts/ProfileLayout";
import { StaffLayout } from "./layouts/StaffLayout";
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
import { ChatPage } from './features/social/chat/pages/ChatPage';
import { ChatNotificationProvider } from "./features/social/chat/component/ChatNotificationContext";

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
import { TourismInformationList } from "./features/content/pages/TourismInformationList";
import { CreateTourismInformation } from "./features/content/pages/CreateTourismInformation";
import { UpdateTourismInformation } from "./features/content/pages/UpdateTourismInformation";
import { TourismInformationDetail } from "./features/content/pages/TourismInformationDetail";
import { CreateItinerary } from "./features/tour/pages/CreateItinerary";
import { UpdateItinerary } from "./features/tour/pages/UpdateItinerary";
import { DeleteItineraryConfirm } from "./features/tour/pages/DeleteItinerary";
import { TourScheduleList } from "./features/tour/pages/TourScheduleList";
import { TourScheduleDetail } from "./features/tour/pages/TourScheduleDetail";
import { AssignedSchedulesPage } from "./features/tour/pages/AssignedSchedulesPage";
import {CreateEditSchedule} from "./features/tour/pages/CreateEditSchedule";
import { CreateScheduleItinerary } from "./features/tour/pages/CreateScheduleItinerary";
import { UpdateScheduleItinerary } from "./features/tour/pages/UpdateScheduleItinerary";
import { DeleteScheduleItinerary } from "./features/tour/pages/DeleteScheduleItinerary";
import { CreateScheduleTicket } from "./features/tour/pages/CreateScheduleTicket";
import { UpdateScheduleTicket } from "./features/tour/pages/UpdateScheduleTicket";
import { DeleteScheduleTicket } from "./features/tour/pages/DeleteScheduleTicket";
import { ScheduleCustomersPage } from "./features/booking/pages/ScheduleCustomersPage";
import PublicTourDetail from "./pages/TourDetail";
import TourSearch from "./pages/TourSearch";
import { AiQuestionnairePage, AiPlannerModal } from "./features/ai/pages/AiQuestionnairePage";
import { AiRecommendationsPage } from "./features/ai/pages/AiRecommendationsPage";
import { AdminAiConsolePage } from "./features/ai/pages/AdminAiConsolePage";
import { AiPlannerProvider } from "./contexts/AiPlannerContext";
import { BookingPage } from "./features/booking/pages/BookingPage";
import { MyBookingsPage } from "./features/booking/pages/MyBookingsPage";
import { OrderDetailPage } from "./features/booking/pages/OrderDetailPage";
import { StaffTicketListPage } from "./features/booking/pages/StaffTicketListPage";
import { CreateCancellationRequestPage } from "./features/booking/pages/CreateCancellationRequestPage";
import { CancellationListPage } from "./features/booking/pages/CancellationListPage";
import { ProcessCancellationPage } from "./features/booking/pages/ProcessCancellationPage";
import { MyReviewsPage } from "./features/tour/pages/MyReviewsPage";
import { DashboardReviewManager } from "./features/tour/pages/DashboardReviewManager";
import { VoucherList } from "./features/voucher/pages/VoucherList";
import { CreateVoucher } from "./features/voucher/pages/CreateVoucher";
import { UpdateVoucher } from "./features/voucher/pages/UpdateVoucher";
import { VoucherDetail } from "./features/voucher/pages/VoucherDetail";
import { MyVouchersPage } from "./features/voucher/customer/pages/MyVouchersPage";
import { MyWishlistPage } from "./features/wishlist/customer/pages/MyWishlistPage";
import { PublicTrackingPage } from "./features/social/tracking/pages/PublicTrackingPage";
import { ScheduleTrackingPage } from "./features/social/tracking/pages/ScheduleTrackingPage";
import { LocationTrackingPage } from "./features/social/tracking/pages/LocationTrackingPage";
import { CustomerAnalyticsPage } from "./features/customer-analytics/pages/CustomerAnalyticsPage";
import { PlatformAnalyticsPage } from "./features/platform-analytics/pages/PlatformAnalyticsPage";
import { BookingStatisticsPage } from "./features/booking/pages/BookingStatisticsPage";
import { QRCheckinPage } from "./features/booking/pages/QRCheckinPage";
import TermsOfServicePage from "./pages/legal/TermsOfServicePage";
import PrivacyPolicyPage from "./pages/legal/PrivacyPolicyPage";
import AboutPage from "./pages/about/AboutPage";
import NhutPortfolioPage from "./pages/about/NhutPortfolioPage";
import PublicInfoPage from "./pages/info/PublicInfoPage";
import { useTranslation } from "./contexts/LocaleContext";
import { StaffTourScheduleDetail } from "./features/tour/pages/StaffTourScheduleDetail";
import { CurrencyProvider } from "./features/currency/CurrencyContext";
import { useGetEligibleSchedules } from "./features/social/moments/hooks/useEligibleSchedules";
const queryClient = new QueryClient();

const MockPage: React.FC<{ titleKey: string; descKey: string; sectionKey?: string }> = ({
  titleKey,
  descKey,
  sectionKey = "app.mockUi",
}) => {
  const { t } = useTranslation();
  const blocks = [
    { title: t("app.overview"), desc: t("app.mockBlockDesc") },
    { title: t("app.data"), desc: t("app.mockBlockDesc") },
    { title: t("app.actions"), desc: t("app.mockBlockDesc") },
  ];
  return (
    <div className="page-container py-10">
      <div className="glass-card p-6 md:p-8">
        <div className="mb-6 flex flex-col gap-2 border-b border-slate-100 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="travel-eyebrow">{t(sectionKey)}</p>
            <h1 className="mt-2 text-2xl font-black text-slate-900 md:text-3xl">{t(titleKey)}</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500">{t(descKey)}</p>
          </div>
          <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
            {t("app.routeReady")}
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {blocks.map((block, index) => (
            <div key={block.title} className="min-h-32 rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-light text-sm font-black text-brand shadow-sm">
                {index + 1}
              </div>
              <h2 className="text-sm font-bold text-slate-800">{block.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{block.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const mock = (titleKey: string, descKey: string, sectionKey?: string) => (
  <MockPage titleKey={titleKey} descKey={descKey} sectionKey={sectionKey} />
);

const childPath = (path: string) =>
  path
    .replace(`${PATH.MANAGER.DASHBOARD}/`, "")
    .replace(`${PATH.ADMIN.DASHBOARD}/`, "")
    .replace(`${PATH.STAFF.DASHBOARD}/`, "");

// Component bảo vệ các tuyến đường yêu cầu đăng nhập và phân quyền (RBAC)
const PasswordChangeEnforcer: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  if (
    user?.requirePasswordChange &&
    location.pathname !== PATH.PUBLIC.CHANGE_PASSWORD
  ) {
    return <Navigate to={PATH.PUBLIC.CHANGE_PASSWORD} replace />;
  }

  return children;
};

const AuthenticatedRoute: React.FC = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent"></div>
      </div>
    );
  }

  return user ? <Outlet /> : <Navigate to={PATH.PUBLIC.LOGIN} replace />;
};

const ProtectedRoute: React.FC<{ allowedRoles?: string[] }> = ({
  allowedRoles,
}) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={PATH.PUBLIC.LOGIN} replace />;
  }

  if (user.requirePasswordChange) {
    return <Navigate to={PATH.PUBLIC.CHANGE_PASSWORD} replace />;
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
// Wrapper để hứng ID từ URL và truyền vào MomentsFeed
const MomentsRouteWrapper = () => {
  const { t } = useTranslation();
  const [selectedSchedule, setSelectedSchedule] = useState<number | null>(null);
  
  // Gọi hook lấy danh sách Tour mà bạn đã fix thành công lúc trước
  const { data: schedules } = useGetEligibleSchedules();

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8">
      {/* KHU VỰC ĐIỀU HƯỚNG & LỌC */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-black text-slate-800">{t("app.momentsCommunityTitle")}</h2>
          <p className="text-sm text-slate-500 font-medium">{t("app.momentsCommunitySubtitle")}</p>
        </div>

  
        <div className="relative">
          <select 
            className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 font-semibold py-2.5 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand cursor-pointer"
            onChange={(e) => setSelectedSchedule(e.target.value ? Number(e.target.value) : null)}
            value={selectedSchedule || ""}
          >
            <option value="">🌍 {t("app.allTripsGlobal")}</option>
            {schedules?.map(s => (
              <option key={s.scheduleId} value={s.scheduleId}>
                📍 {s.tourName}
              </option>
            ))}
          </select>
          {/* Mũi tên trỏ xuống của Select */}
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
          </div>
        </div>
      </div>

    
      <MomentsFeed scheduleId={selectedSchedule as any} /> 
    </div>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <CurrencyProvider>
      <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <Router>
            <ChatNotificationProvider>
            <AiPlannerProvider>
            <CustomBrandCursor />
            <AiPlannerModal />
            <ScrollToTop />
            <PasswordChangeEnforcer>
              <Routes>
              <Route path={PATH.PUBLIC.LOGIN} element={<Login />} />
              <Route path={PATH.PUBLIC.REGISTER} element={<Register />} />
              <Route path="/track/:token" element={<PublicTrackingPage />} />
              <Route
                path={PATH.PUBLIC.FORGOT_PASSWORD}
                element={<ForgotPassword />}
              />
              <Route
                path={PATH.PUBLIC.RESET_PASSWORD}
                element={<ResetPassword />}
              />
              <Route element={<AuthenticatedRoute />}>
                <Route
                  path={PATH.PUBLIC.CHANGE_PASSWORD}
                  element={<ChangePassword />}
                />
              </Route>
              <Route
                path={PATH.PUBLIC.UNAUTHORIZED}
                element={<Unauthorized />}
              />

              <Route element={<MainLayout />}>
                <Route path={PATH.PUBLIC.HOME} element={<Home />} />
                <Route path={PATH.PUBLIC.TOURS} element={<TourSearch />} />
                <Route
                  path={PATH.PUBLIC.TOUR_SEARCH}
                  element={<TourSearch />}
                />
                <Route
                  path={PATH.PUBLIC.TOUR_DETAIL()}
                  element={<PublicTourDetail />}
                />
                <Route
                  path={PATH.PUBLIC.AI_ASSISTANT}
                  element={<AiQuestionnairePage />}
                />
                <Route
                  path={PATH.PUBLIC.AI_RECOMMENDATIONS}
                  element={<AiRecommendationsPage />}
                />
                <Route path={PATH.PUBLIC.TERMS} element={<TermsOfServicePage />} />
                <Route path={PATH.PUBLIC.PRIVACY} element={<PrivacyPolicyPage />} />
                <Route path={PATH.PUBLIC.ABOUT} element={<AboutPage />} />
                <Route
                  path={PATH.PUBLIC.NHUT_PORTFOLIO}
                  element={<NhutPortfolioPage />}
                />
                <Route path={PATH.PUBLIC.INFO()} element={<PublicInfoPage />} />
                <Route
                  path={PATH.CUSTOMER.CHECKOUT()}
                  element={<BookingPage />}
                />
                {/* <Route
                  path={PATH.CUSTOMER.SOCIAL_MOMENTS}
                  element={mock("Moments", "Social")}
                /> */}
                <Route path="/social/profile/:id" element={<SocialProfile />} />

                {/* Các trang yêu cầu đăng nhập dành cho khách hàng */}
                <Route element={<ProtectedRoute />}>
                  <Route
                    path="/chat"
                    element={<Navigate to={PATH.CUSTOMER.SOCIAL_CHAT} replace />}
                  />
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
                      path={PATH.CUSTOMER.REQUEST_CANCELLATION()}
                      element={<CreateCancellationRequestPage />}
                    />
                    <Route
                      path={PATH.CUSTOMER.WISHLIST}
                      element={<MyWishlistPage />}
                    />
                    <Route
                      path={PATH.CUSTOMER.VOUCHERS}
                      element={<MyVouchersPage />}
                    />
                    <Route
                      path={PATH.CUSTOMER.MY_REVIEWS}
                      element={<MyReviewsPage />}
                    />
                    <Route
                      path={PATH.CUSTOMER.SETTINGS}
                      element={mock("app.titles.settings", "app.mockSettings", "app.sectionCustomer")}
                    />
                    <Route
                      path={PATH.CUSTOMER.NOTIFICATIONS}
                      element={mock("app.titles.notifications", "app.mockNotifications", "app.sectionCustomer")}
                    />
                    
                    <Route path="/social/moments"
                     element={<MomentsRouteWrapper />} />

                    <Route
                      path={PATH.CUSTOMER.SOCIAL_FRIENDS}
                      element={<FriendsManagement />}
                    />
                    <Route
                      path={PATH.CUSTOMER.SOCIAL_CHAT}
                      element={<ChatPage />}
                    />
                  </Route>
                </Route>
              </Route>

              {/* Phân hệ dành cho Điều hành viên (Tour Operator / Manager) */}
              <Route
                element={<ProtectedRoute allowedRoles={["MANAGER"]} />}
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
                    element={<CreateEditSchedule />}
                  />
                  <Route
                    path={childPath(PATH.MANAGER.SCHEDULE_DETAIL())}
                    element={<TourScheduleDetail />}
                  />
                  <Route
                    path={childPath(PATH.MANAGER.EDIT_SCHEDULE())}
                    element={<CreateEditSchedule />}
                  />
                  <Route
                    path={childPath(PATH.MANAGER.DELETE_SCHEDULE())}
                    element={mock("app.titles.deleteSchedule", "app.mockDeleteSchedule", "app.sectionPartner")}
                  />
                  <Route
                    path={childPath(PATH.MANAGER.CREATE_SCHEDULE_ITINERARY())}
                    element={<CreateScheduleItinerary />}
                  />
                  <Route
                    path={childPath(PATH.MANAGER.EDIT_SCHEDULE_ITINERARY())}
                    element={<UpdateScheduleItinerary />}
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
                    element={mock("app.titles.scheduleOrders", "app.mockScheduleOrders", "app.sectionPartner")}
                  />
                  <Route
                    path={childPath(PATH.MANAGER.SCHEDULE_CHECKIN())}
                    element={mock("app.titles.scheduleCheckin", "app.mockScheduleCheckin", "app.sectionPartner")}
                  />
                  <Route
                    path={childPath(PATH.MANAGER.BOOKING_MANAGEMENT)}
                    element={mock("app.titles.bookingManagement", "app.mockBookingManagement", "app.sectionPartner")}
                  />
                  <Route
                    path={childPath(PATH.MANAGER.CHECK_IN)}
                    element={mock("app.titles.checkin", "app.mockCheckin", "app.sectionPartner")}
                  />
                  <Route
                    path={childPath(PATH.MANAGER.CANCELLATION_REQUESTS)}
                    element={<CancellationListPage />}
                  />
                  <Route
                    path={childPath(PATH.MANAGER.PROCESS_CANCELLATION())}
                    element={<ProcessCancellationPage />}
                  />
                  <Route path={childPath(PATH.MANAGER.VOUCHERS)}>
                    <Route index element={<VoucherList />} />
                    <Route path="create" element={<CreateVoucher />} />
                    <Route path=":id/edit" element={<UpdateVoucher />} />
                    <Route path=":id" element={<VoucherDetail />} />
                  </Route>
                  <Route
                    path={childPath(PATH.MANAGER.REVIEWS)}
                    element={<DashboardReviewManager />}
                  />
                  <Route
                    path={childPath(PATH.MANAGER.CUSTOMER_ANALYTICS)}
                    element={<CustomerAnalyticsPage />}
                  />
                  <Route
                    path={childPath(PATH.MANAGER.BOOKING_STATISTICS)}
                    element={<BookingStatisticsPage />}
                  />
                  <Route
                    path={childPath(PATH.MANAGER.PAYOUT)}
                    element={mock("app.titles.payout", "app.mockPayout", "app.sectionPartner")}
                  />
                </Route>
              </Route>

              <Route element={<ProtectedRoute allowedRoles={["STAFF"]} />}>
                <Route path={PATH.STAFF.DASHBOARD} element={<StaffLayout />}>
                  <Route index element={<AssignedSchedulesPage />} />
                  
                  {/* UC-49: Assigned Schedules */}
                  <Route path={childPath(PATH.STAFF.SCHEDULES)} element={<AssignedSchedulesPage />} />
                  <Route path={childPath(PATH.STAFF.SCHEDULE_DETAIL())} element={<StaffTourScheduleDetail />} />

                  {/* UC-50: QR Check-In */}
                  <Route path={childPath(PATH.STAFF.QR_CHECKIN)} element={<QRCheckinPage />} />
                  <Route path={childPath(PATH.STAFF.QR_CHECKIN_SCAN())} element={mock("app.titles.processCheckin", "app.mockProcessCheckin", "app.sectionStaff")} />

                  {/* UC-51: Tickets */}
                  <Route path={childPath(PATH.STAFF.TICKETS)} element={<StaffTicketListPage />} />
                  <Route path={childPath(PATH.STAFF.TICKET_DETAIL())} element={mock("app.titles.ticketDetails", "app.mockTicketDetails", "app.sectionStaff")} />

                  {/* UC-52: Track Locations */}
                  <Route path={childPath(PATH.STAFF.LOCATIONS)} element={<LocationTrackingPage />} />
                  <Route path={childPath(PATH.STAFF.TRACK_SCHEDULE_LOCATIONS())} element={<ScheduleTrackingPage />} />

                  {/* UC-53: Customers */}
                  <Route path={childPath(PATH.STAFF.CUSTOMERS)} element={<ScheduleCustomersPage />} />
                  <Route path={childPath(PATH.STAFF.SCHEDULE_CUSTOMERS())} element={<ScheduleCustomersPage />} />

                </Route>
              </Route>

              {/* Phân hệ Quản trị viên cấp cao (Admin) */}
              <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
                <Route path={PATH.ADMIN.DASHBOARD} element={<AdminLayout />}>
                  <Route index element={<Navigate to={PATH.ADMIN.PLATFORM_ANALYTICS} replace />} />
                  <Route
                    path={childPath(PATH.ADMIN.PLATFORM_ANALYTICS)}
                    element={<PlatformAnalyticsPage />}
                  />
                  <Route
                    path={childPath(PATH.ADMIN.CUSTOMER_ANALYTICS)}
                    element={<CustomerAnalyticsPage />}
                  />
                  <Route path={childPath(PATH.ADMIN.USER_MANAGEMENT)}>
                    <Route index element={<UserList />} />
                    <Route path="create" element={<CreateUser />} />
                    <Route path=":id/edit" element={<UpdateUser />} />
                    <Route path=":id/delete" element={<DeleteUserConfirm />} />
                  </Route>
                  <Route
                    path={childPath(PATH.ADMIN.PARTNER_APPROVAL)}
                    element={mock("app.titles.partnerApprovals", "app.mockPartnerApprovals", "app.sectionAdmin")}
                  />
                  <Route path={childPath(PATH.ADMIN.TOUR_MODERATION)}>
                    <Route index element={mock("app.titles.tours", "app.mockTours", "app.sectionAdmin")} />
                    <Route
                      path=":id"
                      element={mock("app.titles.adminTourDetail", "app.mockAdminTourDetail", "app.sectionAdmin")}
                    />
                  </Route>
                  <Route
                    path={childPath(PATH.ADMIN.REPORT_MODERATION)}
                    element={mock("app.titles.violationReports", "app.mockViolationReports", "app.sectionAdmin")}
                  />
                  <Route
                    path={childPath(PATH.ADMIN.WITHDRAWALS)}
                    element={mock("app.titles.withdrawals", "app.mockWithdrawals", "app.sectionAdmin")}
                  />
                  <Route path={childPath(PATH.ADMIN.SYSTEM_VOUCHERS)}>
                    <Route index element={mock("app.titles.systemVouchers", "app.mockSystemVouchers", "app.sectionAdmin")} />
                    <Route
                      path="create"
                      element={mock("app.titles.createVoucher", "app.mockCreateVoucher", "app.sectionAdmin")}
                    />
                    <Route
                      path=":id"
                      element={mock("app.titles.voucherDetail", "app.mockVoucherDetailAdmin", "app.sectionAdmin")}
                    />
                    <Route
                      path=":id/edit"
                      element={mock("app.titles.editVoucher", "app.mockEditVoucher", "app.sectionAdmin")}
                    />
                    <Route
                      path=":id/delete"
                      element={mock("app.titles.deleteVoucher", "app.mockDeleteVoucher", "app.sectionAdmin")}
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
                  <Route path={childPath(PATH.ADMIN.TOURISM_INFORMATION_MANAGEMENT)}>
                    <Route index element={<TourismInformationList />} />
                    <Route path="create" element={<CreateTourismInformation />} />
                    <Route path=":id/edit" element={<UpdateTourismInformation />} />
                    <Route path=":id" element={<TourismInformationDetail />} />
                  </Route>
                  <Route
                    path={childPath(PATH.ADMIN.SYSTEM_SETTINGS)}
                    element={mock("app.titles.systemSettings", "app.mockSystemSettings", "app.sectionAdmin")}
                  />
                  <Route
                    path={childPath(PATH.ADMIN.AI_CONSOLE)}
                    element={<AdminAiConsolePage />}
                  />
                </Route>
              </Route>

              <Route
                path="*"
                element={mock("app.titles.notFound", "app.mock404", "app.sectionSystem")}
              />
              </Routes>
            </PasswordChangeEnforcer>
          </AiPlannerProvider>
          </ChatNotificationProvider>
          </Router>
        </AuthProvider>
      </ToastProvider>
      </ThemeProvider>
      </CurrencyProvider>
    </QueryClientProvider>
  );
};

export default App;
