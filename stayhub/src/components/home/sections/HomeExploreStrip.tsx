import React from "react";
import { useNavigate } from "react-router-dom";
import { PATH } from "../../../config/routes/route";
import { getFreeApiImage, HOME_GLASS_MEDIA } from "./shared";
import { SectionHeader } from "./SectionHeader";
import { HomeSection } from "./HomeSection";

const TRIP_TYPES = [
  { label: "Beach & islands", term: "beach", image: getFreeApiImage("category-beach-vn", 300, 200) },
  { label: "Mountains", term: "mountain", image: getFreeApiImage("category-mountain-vn", 300, 200) },
  { label: "Culture & heritage", term: "culture", image: getFreeApiImage("category-culture-vn", 300, 200) },
  { label: "Day trips", term: "day tour", image: getFreeApiImage("category-daytrip-vn", 300, 200) },
  { label: "Food & local life", term: "food tour", image: getFreeApiImage("category-food-vn", 300, 200) },
  { label: "Adventure", term: "adventure", image: getFreeApiImage("category-adventure-vn", 300, 200) },
];

export const HomeExploreStrip: React.FC = () => {
  const navigate = useNavigate();

  return (
    <HomeSection tightTop>
      <SectionHeader
        eyebrow="Trip types"
        title="Explore by trip type"
        subtitle="Pick a style — we'll show tours that match."
        compact
      />

      <div className="flex gap-3 overflow-x-auto pb-1 custom-scrollbar md:grid md:grid-cols-6 md:justify-items-center md:gap-4 md:overflow-visible">
        {TRIP_TYPES.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() =>
              navigate(
                `${PATH.PUBLIC.TOUR_SEARCH}?searchTerm=${encodeURIComponent(item.term)}`,
              )
            }
            className="home-explore-tile group flex w-[116px] shrink-0 flex-col gap-2 md:w-full md:max-w-[156px]"
          >
            <span
              className={`${HOME_GLASS_MEDIA} block w-full rounded-xl aspect-[3/2]`}
            >
              <img
                src={item.image}
                alt=""
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />
            </span>
            <span className="block text-left text-xs font-semibold leading-snug text-navy transition-colors group-hover:text-brand md:text-[13px]">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </HomeSection>
  );
};
