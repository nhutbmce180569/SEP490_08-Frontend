import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { TourCard } from "../components/home/TourCard";
import { useTranslation } from "../contexts/LocaleContext";
import { apiClient } from "../utils/axiosClient";
import { TOURS_API } from "../config/api/tours.api";
import type { Tour } from "../features/tour/types/tour";
import { getTourPriceInfo } from "../features/tour/utils/tourPrice";
import { getTourDurationDays } from "../features/tour/utils/tourDuration";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";

type Region = "north" | "central" | "south";

const REGIONS: { id: Region; labelVi: string; labelEn: string }[] = [
  { id: "north", labelVi: "Miền Bắc", labelEn: "North Vietnam" },
  { id: "central", labelVi: "Miền Trung", labelEn: "Central Vietnam" },
  { id: "south", labelVi: "Miền Nam", labelEn: "South Vietnam" },
];

export default function RegionTours() {
  const { t, locale } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const initialRegion = (searchParams.get("region") as Region) || "north";
  const [activeRegion, setActiveRegion] = useState<Region>(
    ["north", "central", "south"].includes(initialRegion) ? initialRegion : "north"
  );
  
  const [tours, setTours] = useState<Tour[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 12;

  useEffect(() => {
    // Sync URL when region changes
    setSearchParams({ region: activeRegion }, { replace: true });
    
    const fetchRegionTours = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const res = await apiClient.get<any>(TOURS_API.GET_TOURS_BY_REGION(activeRegion), {
          params: { page, pageSize }
        });
        
        let items: Tour[] = [];
        let total = 0;
        
        if (res?.data && Array.isArray(res.data)) {
          items = res.data;
          total = res.total || res.data.length;
        } else if (res?.items) {
          items = res.items;
          total = res.totalCount || res.total || res.items.length;
        } else if (res?.data?.items) {
          items = res.data.items;
          total = res.data.totalCount || res.data.total || res.data.items.length;
        } else if (Array.isArray(res)) {
          items = res;
          total = res.length;
        }
        
        setTours(items);
        setTotalCount(total);
      } catch (err: any) {
        setError(err.message || "Failed to fetch regional tours");
      } finally {
        setIsLoading(false);
      }
    };
    fetchRegionTours();
  }, [activeRegion, page]);

  // Reset page when region changes
  const handleRegionChange = (region: Region) => {
    setActiveRegion(region);
    setPage(1);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="mx-auto max-w-7xl pb-24 sm:px-6 lg:px-8 mt-4 lg:mt-8">
      <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end justify-between">
        <div className="flex flex-col gap-2 max-w-2xl">
          <div className="flex items-center gap-2 text-sm font-semibold text-brand uppercase tracking-widest">
            <span className="w-8 h-[2px] bg-brand rounded-full" />
            {t("home.exploreVietnamEyebrow") || "Explore Vietnam"}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            {t("home.journey3RegionsTitle") || "Journey Across 3 Regions"}
          </h1>
          <p className="text-slate-600">
            {t("home.journey3RegionsSubtitle") || "Unique destinations featuring distinctive regional cultures"}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl overflow-x-auto [scrollbar-width:none]">
          {REGIONS.map((r) => (
            <button
              key={r.id}
              onClick={() => handleRegionChange(r.id)}
              className={`whitespace-nowrap px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                activeRegion === r.id
                  ? "bg-white text-brand shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
              }`}
            >
              <MapPin size={16} className={activeRegion === r.id ? "animate-bounce" : ""} />
              {locale === "vi" ? r.labelVi : r.labelEn}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-red-600 mb-8">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: pageSize }).map((_, i) => (
            <div key={i} className="h-[400px] animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {tours.map((tour) => {
              const days = getTourDurationDays(tour);
              const loc =
                [tour.city, tour.country].filter(Boolean).join(", ") ||
                t("tour.variousLocations");
              return (
                <TourCard
                  key={tour.id}
                  tour={{
                    id: tour.id,
                    title: tour.name,
                    location: loc,
                    rating: tour.averageStar || 0,
                    reviews: tour.reviews?.length || 0,
                    duration:
                      days > 0
                        ? `${days} ${days > 1 ? t("tour.daysLabel") : t("tour.day")}`
                        : t("tour.flexible"),
                    ...getTourPriceInfo(tour),
                    imageUrl: tour.imageUrl || "",
                  }}
                />
              );
            })}
          </div>
          
          {tours.length === 0 && !error && (
            <div className="py-12 text-center text-slate-500 bg-slate-50 rounded-2xl font-medium">
              {t("home.noToursInRegion") || "No tours available in this region yet."}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-14 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="w-10 h-10 flex items-center justify-center rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ border: "1px solid rgba(5,7,60,0.1)", background: "#fff" }}
              >
                <ChevronLeft size={18} className="text-slate-600" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => Math.abs(p - page) <= 2)
                .map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl text-sm font-bold transition-all"
                    style={{
                      background: page === p ? "var(--color-brand)" : "#fff",
                      color: page === p ? "#fff" : "#64748b",
                      border: page === p
                        ? "1px solid var(--color-brand)"
                        : "1px solid rgba(5,7,60,0.1)",
                      boxShadow: page === p ? "0 4px 12px rgba(0,104,224,0.2)" : "none",
                    }}
                  >
                    {p}
                  </button>
                ))}

              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="w-10 h-10 flex items-center justify-center rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ border: "1px solid rgba(5,7,60,0.1)", background: "#fff" }}
              >
                <ChevronRight size={18} className="text-slate-600" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
