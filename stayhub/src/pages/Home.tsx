import { useTranslation } from "../contexts/LocaleContext";
import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { HomeHero } from "../components/home/sections/HomeHero";
import { HomeFeaturedTours } from "../components/home/sections/HomeFeaturedTours";
import { HomePopularTours } from "../components/home/sections/HomePopularTours";
import { HomeDestinations } from "../components/home/sections/HomeDestinations";
import { HomeWhyUs } from "../components/home/sections/HomeWhyUs";
import { HomeCTA } from "../components/home/sections/HomeCTA";
import { HomeRegions } from "../components/home/sections/HomeRegions";
import { useHomeSections } from "../hooks/useHomeSections";
import { useNavigate } from "react-router-dom";
import { PATH } from "../config/routes/route";

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { sale, hot, upcoming } = useHomeSections();
  const { user } = useContext(AuthContext);

  return (
    <div className="-mt-[68px]">
      <HomeHero />
      <div className="home-page">
        <HomeDestinations />
        
        <div id="home-hot-tours">
          <HomeFeaturedTours
            tours={hot.tours}
            isLoading={hot.isLoading}
            error={hot.error}
            eyebrow={t("home.topPicksEyebrow")}
            title={t("home.topHotToursTitle")}
            subtitle={t("home.top5HotToursSubtitle")}
            onViewAll={() => navigate(PATH.PUBLIC.HOT_TOURS)}
          />
        </div>
        
        {sale.tours.length > 0 && (
          <div id="home-sale-tours">
            <HomePopularTours
              tours={sale.tours}
              isLoading={sale.isLoading}
              error={sale.error}
              eyebrow={t("home.specialOffersEyebrow")}
              title={t("home.toursOnSaleTitle")}
              subtitle={t("home.toursOnSaleSubtitle")}
              onViewAll={() => navigate(PATH.PUBLIC.SALE_TOURS)}
            />
          </div>
        )}

        {upcoming.tours.length > 0 && (
          <div id="home-upcoming-tours">
            <HomePopularTours
              tours={upcoming.tours}
              isLoading={upcoming.isLoading}
              error={upcoming.error}
              eyebrow={t("home.preparingToDepartEyebrow")}
              title={t("home.upcomingToursTitle")}
              subtitle={t("home.upcomingToursSubtitle")}
              onViewAll={() => navigate(PATH.PUBLIC.UPCOMING_TOURS)}
            />
          </div>
        )}

        <HomeRegions />
        <HomeWhyUs />
        {!user && <HomeCTA />}
      </div>
    </div>
  );
}
