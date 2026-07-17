import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { Tour } from "../../../features/tour/types/tour";
import { PATH } from "../../../config/routes/route";
import { TourCard, type TourCardProps } from "../TourCard";
import { SectionHeader } from "./SectionHeader";
import { HomeSection } from "./HomeSection";
import { HOME_GLASS } from "./shared";
import { useTranslation } from "../../../contexts/LocaleContext";
import { getTourPriceInfo } from "../../../features/tour/utils/tourPrice";
import { getTourDurationDays } from "../../../features/tour/utils/tourDuration";

type HomeRegionalToursProps = {
  tours: Tour[];
  isLoading: boolean;
  error: string | null;
};

const REGIONS = {
  north: [
    "hà nội", "hanoi", "sapa", "lào cai", "hà giang", "quảng ninh", "hạ long",
    "ninh bình", "hải phòng", "cao bằng", "bắc kạn", "mộc châu", "sơn la"
  ],
  central: [
    "đà nẵng", "danang", "huế", "hue", "hội an", "hoian", "quảng nam",
    "nha trang", "khánh hòa", "phú yên", "bình định", "quy nhơn", "đà lạt",
    "dalat", "lâm đồng", "quảng bình", "phong nha"
  ],
  south: [
    "hồ chí minh", "ho chi minh", "hcm", "sài gòn", "saigon", "vũng tàu",
    "cần thơ", "phú quốc", "kiên giang", "cà mau", "tây ninh", "bến tre",
    "an giang", "đồng tháp"
  ],
};

const getRegion = (city: string | null | undefined): "north" | "central" | "south" | "other" => {
  if (!city) return "other";
  const normalized = city.toLowerCase().trim();
  if (REGIONS.north.some((c) => normalized.includes(c))) return "north";
  if (REGIONS.central.some((c) => normalized.includes(c))) return "central";
  if (REGIONS.south.some((c) => normalized.includes(c))) return "south";
  return "other";
};

export const HomeRegionalTours: React.FC<HomeRegionalToursProps> = ({
  tours,
  isLoading,
  error,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"north" | "central" | "south">("north");

  const regionalTours = useMemo(() => {
    return tours.filter((t) => getRegion(t.city) === activeTab).slice(0, 6);
  }, [tours, activeTab]);

  const toCard = (tour: Tour): TourCardProps => {
    const dayCount = getTourDurationDays(tour);
    return {
      id: tour.id,
      title: tour.name,
      location: [tour.city, tour.country].filter(Boolean).join(", ") || t("home.vietnam") || "Vietnam",
      rating: tour.averageStar || 0,
      reviews: tour.reviews?.length || 0,
      duration:
        dayCount > 0
          ? dayCount > 1
            ? t("home.durationDaysPlural", { count: dayCount }) || `${dayCount} days`
            : t("home.durationDays", { count: dayCount }) || `${dayCount} day`
          : t("home.flexibleDuration") || "Flexible",
      ...getTourPriceInfo(tour),
      imageUrl: tour.imageUrl || "",
    };
  };

  const tabs = [
    { id: "north", label: t("home.regionNorth") },
    { id: "central", label: t("home.regionCentral") },
    { id: "south", label: t("home.regionSouth") },
  ] as const;

  return (
    <HomeSection>
      <div className="mb-8 md:mb-12 flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
        <SectionHeader
          eyebrow={t("home.exploreVietnamEyebrow")}
          title={t("home.journey3RegionsTitle")}
          subtitle={t("home.journey3RegionsSubtitle")}
          showSeeAll={false}
        />
        <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full md:w-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-white text-brand shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
        </div>
      ) : error ? (
        <div className={`${HOME_GLASS} py-16 text-center text-rose-600`}>
          {error}
        </div>
      ) : regionalTours.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {regionalTours.map((tour) => (
            <TourCard key={tour.id} tour={toCard(tour)} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center text-slate-500 bg-slate-50 rounded-[2rem] border border-slate-100">
          {t("home.noToursInRegion")}
        </div>
      )}
    </HomeSection>
  );
};
