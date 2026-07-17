import { useTranslation } from "../contexts/LocaleContext";
import { HomeHero } from "../components/home/sections/HomeHero";
import { HomeExploreStrip } from "../components/home/sections/HomeExploreStrip";
import { HomeFeaturedTours } from "../components/home/sections/HomeFeaturedTours";
import { HomePopularTours } from "../components/home/sections/HomePopularTours";
import { HomeDestinations } from "../components/home/sections/HomeDestinations";
import { HomeWhyUs } from "../components/home/sections/HomeWhyUs";
import { HomeCTA } from "../components/home/sections/HomeCTA";
import { HomeRegions } from "../components/home/sections/HomeRegions";
import { useHomeSections } from "../hooks/useHomeSections";

export default function Home() {
  const { t } = useTranslation();
  const { sale, hot, upcoming } = useHomeSections();

  return (
    <div className="-mt-[68px]">
      <HomeHero />
      <div className="home-page">
        <HomeExploreStrip />
        
        <HomeFeaturedTours
          tours={hot.tours}
          isLoading={hot.isLoading}
          error={hot.error}
          eyebrow={t("home.topPicksEyebrow")}
          title={t("home.top5HotToursTitle")}
          subtitle={t("home.top5HotToursSubtitle")}
        />
        
        {sale.tours.length > 0 && (
          <HomePopularTours
            tours={sale.tours}
            isLoading={sale.isLoading}
            error={sale.error}
            eyebrow={t("home.specialOffersEyebrow")}
            title={t("home.toursOnSaleTitle")}
            subtitle={t("home.toursOnSaleSubtitle")}
          />
        )}

        {upcoming.tours.length > 0 && (
          <HomePopularTours
            tours={upcoming.tours}
            isLoading={upcoming.isLoading}
            error={upcoming.error}
            eyebrow={t("home.preparingToDepartEyebrow")}
            title={t("home.upcomingToursTitle")}
            subtitle={t("home.upcomingToursSubtitle")}
          />
        )}

        <HomeRegions />
        <HomeDestinations />
        <HomeWhyUs />
        <HomeCTA />
      </div>
    </div>
  );
}
