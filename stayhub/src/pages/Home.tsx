import { HomeHero } from "../components/home/sections/HomeHero";
import { HomeExploreStrip } from "../components/home/sections/HomeExploreStrip";
import { HomeFeaturedTours } from "../components/home/sections/HomeFeaturedTours";
import { HomePopularTours } from "../components/home/sections/HomePopularTours";
import { HomeDestinations } from "../components/home/sections/HomeDestinations";
import { HomeWhyUs } from "../components/home/sections/HomeWhyUs";
import { HomeCTA } from "../components/home/sections/HomeCTA";

export default function Home() {
  return (
    <div className="-mt-[76px]">
      <HomeHero />
      <div className="home-page">
        <HomeExploreStrip />
        <HomeFeaturedTours />
        <HomePopularTours />
        <HomeDestinations />
        <HomeWhyUs />
        <HomeCTA />
      </div>
    </div>
  );
}
