import { HomeHero } from "../components/home/sections/HomeHero";
import { HomeExploreStrip } from "../components/home/sections/HomeExploreStrip";
import { HomeFeaturedTours } from "../components/home/sections/HomeFeaturedTours";
import { HomeDestinations } from "../components/home/sections/HomeDestinations";
import { HomeWhyUs } from "../components/home/sections/HomeWhyUs";
import { HomeCTA } from "../components/home/sections/HomeCTA";
import { usePublicTours } from "../hooks/usePublicTours";

export default function Home() {
  const publicTours = usePublicTours(1, 6);

  return (
    <div className="-mt-[68px]">
      <HomeHero />
      <div className="home-page">
        <HomeExploreStrip />
        <HomeFeaturedTours
          tours={publicTours.tours.slice(0, 5)}
          isLoading={publicTours.isLoading}
          error={publicTours.error}
        />
        {/* <HomePopularTours
          tours={publicTours.tours}
          isLoading={publicTours.isLoading}
          error={publicTours.error}
        /> */}
        <HomeDestinations />
        <HomeWhyUs />
        <HomeCTA />
      </div>
    </div>
  );
}
