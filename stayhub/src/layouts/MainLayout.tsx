import { Outlet, useLocation } from "react-router-dom";

import Header from "./home/Header";
import Footer from "./home/Footer";
import { TourAssistantChatWidget } from "../features/ai/components/TourAssistantChatWidget";

/** Trang auth full-screen — không header/footer */
const AUTH_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"];

export const MainLayout = () => {
  const { pathname } = useLocation();
  const isAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p));
  const isTrackPage = pathname.startsWith("/track/");

  if (isAuthPage || isTrackPage) {
    return (
      <div className="public-shell public-shell--minimal min-h-screen">
        <Outlet />
        {!isAuthPage && <TourAssistantChatWidget />}
      </div>
    );
  }

  return (
    <div className="public-shell flex min-h-screen flex-col">
      <Header />

      <main className="public-main flex-1">
        <Outlet />
      </main>

      <Footer />
      <TourAssistantChatWidget />
    </div>
  );
};
