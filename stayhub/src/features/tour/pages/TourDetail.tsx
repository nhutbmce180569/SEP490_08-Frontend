import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Image as ImageIcon,
  Clock,
  Star,
  Pencil,
  Plus,
  Map,
  Trash2,
  Tag,
  ChevronDown,
  ChevronUp,
  User,
  ExternalLink,
  Loader2,
  CalendarDays,
  MessageSquare,
  Globe,
  Info,
  Hash,
  Bus,
  Plane,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useTour } from "../hooks/useTour";
import { useGroupedItineraries } from "../hooks/useGroupedItineraries";
import { useReview } from "../hooks/useReview";
import { PATH } from "../../../config/routes/route";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { ConfirmDialog } from "../../../components/dashboard/ConfirmDialog";
import { deleteItinerary } from "../services/itinerary.service";
import { getApiErrorMessage } from "../../content/utils/apiError";
import { useToast } from "../../../contexts/ToastContext";
import { tourismInformationService } from "../../content/services/tourismInformation.service";
import type { TourismInformation } from "../../content/types/tourismInformation";
import { useTranslation } from "../../../contexts/LocaleContext";

type TabKey = "itinerary" | "reviews";

const ExpandableText = ({
  text,
  maxLength = 200,
  showMoreLabel,
  showLessLabel,
  className = "text-slate-600 leading-relaxed whitespace-pre-line"
}: {
  text: string;
  maxLength?: number;
  showMoreLabel: string;
  showLessLabel: string;
  className?: string;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const needsExpand = text.length > maxLength;
  const displayText = !needsExpand || isExpanded ? text : `${text.substring(0, maxLength)}...`;

  return (
    <div>
      <p className={className}>{displayText}</p>
      {needsExpand && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-brand/5 px-3 py-1.5 text-xs font-bold text-brand transition-colors hover:bg-brand/10 hover:text-brand-hover"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" />
              {showLessLabel}
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" />
              {showMoreLabel}
            </>
          )}
        </button>
      )}
    </div>
  );
};

export const TourDetail: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tourismInformationById, setTourismInformationById] = useState<Record<number, TourismInformation>>({});
  const [activeTab, setActiveTab] = useState<TabKey>("itinerary");
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [deletingItineraryId, setDeletingItineraryId] = useState<number | string | null>(null);
  const [isDeletingItinerary, setIsDeletingItinerary] = useState(false);
  const [previewImageIndex, setPreviewImageIndex] = useState<number | null>(null);
  const { success: showSuccess, error: showError } = useToast();

  const { tour, categoryName, isLoading, error, refetch: fetchTour } = useTour(id);

  const handleDeleteItinerary = async () => {
    if (!deletingItineraryId || !tour?.id) return;
    try {
      setIsDeletingItinerary(true);
      await deleteItinerary(deletingItineraryId);
      showSuccess(t("tour.deleteItinerarySuccess") || "Itinerary deleted successfully!");
      await fetchTour();
      setDeletingItineraryId(null);
    } catch (err: unknown) {
      showError(getApiErrorMessage(err, t("tour.failedDeleteItinerary") || "Failed to delete itinerary."));
    } finally {
      setIsDeletingItinerary(false);
    }
  };

  // ==========================================
  // REVIEW FILTER & INFINITE SCROLL
  // ==========================================
  const [reviewPage, setReviewPage] = useState(1);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [dateSortOrder, setDateSortOrder] = useState<"newest" | "oldest">("newest");
  const [localReviews, setLocalReviews] = useState<any[]>([]);
  const observerTarget = useRef<HTMLDivElement>(null);

  const {
    reviews: fetchedReviews,
    totalCount,
    isLoading: isReviewsLoading,
    fetchReviewsByTour,
  } = useReview();

  useEffect(() => {
    if (id) {
      fetchReviewsByTour(Number(id), {
        page: reviewPage,
        pageSize: 5,
        rating: ratingFilter,
        sortOrder: dateSortOrder,
      });
    }
  }, [id, reviewPage, ratingFilter, dateSortOrder, fetchReviewsByTour]);

  useEffect(() => {
    if (reviewPage === 1) {
      setLocalReviews(fetchedReviews || []);
    } else {
      setLocalReviews((prev) => {
        const existingIds = new Set(prev.map((r: any) => r.id));
        const newItems = (fetchedReviews || []).filter((r: any) => !existingIds.has(r.id));
        return [...prev, ...newItems];
      });
    }
  }, [fetchedReviews, reviewPage]);

  const handleRatingChange = (val: string) => {
    setRatingFilter(val === "" ? null : Number(val));
    setReviewPage(1);
    setLocalReviews([]);
  };

  const handleSortChange = (val: "newest" | "oldest") => {
    setDateSortOrder(val);
    setReviewPage(1);
    setLocalReviews([]);
  };

  const getStatusLabel = (status?: string) => {
    const map: Record<string, string> = {
      active: t("common.active"),
      inactive: t("common.inactive"),
      draft: t("tour.draft"),
      full: t("tour.full"),
      banned: t("tour.banned"),
    };
    return map[status?.toLowerCase() || "draft"] ?? status ?? t("tour.draft");
  };

  const getStatusStyle = (status?: string) => {
    const s = status?.toLowerCase();
    if (s === "active") return "bg-emerald-500/90 text-white";
    if (s === "banned") return "bg-rose-500/90 text-white";
    if (s === "full") return "bg-amber-500/90 text-white";
    return "bg-slate-700/80 text-white";
  };

  const { expandedItiIds, toggleIti, groupedItineraries } = useGroupedItineraries(tour?.tourItineraries);

  useEffect(() => {
    const tourismInfoIds = Array.from(
      new Set(
        (tour?.tourItineraries ?? [])
          .map((item) => item.tourismInfoId)
          .filter((tid): tid is number => typeof tid === "number" && Number.isFinite(tid))
      )
    );
    if (tourismInfoIds.length === 0) { setTourismInformationById({}); return; }
    let isMounted = true;
    Promise.all(
      tourismInfoIds.map(async (tid) => {
        const info = await tourismInformationService.getById(tid);
        return info ? ([tid, info] as const) : null;
      })
    ).then((entries) => {
      if (!isMounted) return;
      setTourismInformationById(
        Object.fromEntries(entries.filter((e): e is readonly [number, TourismInformation] => e !== null))
      );
    });
    return () => { isMounted = false; };
  }, [tour?.tourItineraries]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
        {t("tour.loadingTourDetailsMgr")}
      </div>
    );
  }

  if (error || !tour) {
    return (
      <div className="flex h-64 items-center justify-center text-rose-500">
        {error || t("tour.tourNotFound")}
      </div>
    );
  }

  const itineraryCount = tour.tourItineraries?.length || 0;
  const durationText =
    itineraryCount > 0
      ? itineraryCount === 1
        ? t("tour.daysCount", { count: itineraryCount })
        : t("tour.daysCountPlural", { count: itineraryCount })
      : t("tour.noItinerary");

  const itineraryDayNumbers = tour.tourItineraries?.map((i) => Number(i.dayNumber)).sort((a, b) => a - b) ?? [];
  const missingItineraryDays: number[] = [];
  for (let i = 1; i <= (itineraryDayNumbers.length ? Math.max(...itineraryDayNumbers) : 0); i++) {
    if (!itineraryDayNumbers.includes(i)) missingItineraryDays.push(i);
  }
  const rating = tour.averageStar || 0;
  const visibleReviews = localReviews.filter((r) => !r.isHidden);

  const tabs: { key: TabKey; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: "itinerary", label: t("tour.itineraries"), icon: <CalendarDays className="h-4 w-4" />, count: itineraryCount },
    { key: "reviews", label: t("tour.reviews"), icon: <MessageSquare className="h-4 w-4" />, count: totalCount || 0 },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">

      {/* ── HERO CARD ── */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

        {/* Hero Image */}
        <div className="relative h-64 w-full sm:h-80 lg:h-[22rem] bg-slate-100">
          {tour.imageUrl ? (
            <img src={tour.imageUrl} alt={tour.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-slate-400">
              <ImageIcon className="mb-2 h-12 w-12 opacity-40" />
              <span className="text-sm font-medium">{t("tour.noImageAvailable")}</span>
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

          {/* Back button */}
          <div className="absolute left-4 top-4">
            <button
              onClick={() => navigate(PATH.MANAGER.MY_TOURS)}
              className="flex items-center gap-2 rounded-full bg-white/90 px-4 py-1.5 text-sm font-semibold text-slate-700 shadow backdrop-blur-md transition-all hover:bg-white hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("tour.backToTourListMgr")}
            </button>
          </div>

          {/* Status badge */}
          <div className="absolute right-4 top-4">
            <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold shadow backdrop-blur-md ${getStatusStyle(tour.status || "")}`}>
              {getStatusLabel(tour.status || "")}
            </span>
          </div>

          {/* Tour name & location overlaid on image bottom */}
          <div className="absolute bottom-0 left-0 right-0 px-6 pb-5 text-white">
            <h1 className="text-2xl font-extrabold leading-tight drop-shadow sm:text-3xl">{tour.name}</h1>
            {(tour.city || tour.country) && (
              <div className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-white/80">
                <MapPin className="h-3.5 w-3.5" />
                <span>{[tour.city, tour.country].filter(Boolean).join(", ")}</span>
              </div>
            )}
          </div>
        </div>

        {/* Info strip */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-slate-100 bg-slate-50 px-6 py-4 text-sm font-medium text-slate-600">
          <div className="flex items-center gap-1.5">
            <Hash className="h-4 w-4 text-slate-400" />
            <span>ID: {tour.id}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Tag className="h-4 w-4 text-slate-400" />
            <span>{categoryName || `ID ${tour.categoryId}`}</span>
          </div>
          {tour.transportationType && (
            <div className="flex items-center gap-1.5">
              {tour.transportationType.toLowerCase() === 'flight' ? (
                <Plane className="h-4 w-4 text-indigo-400" />
              ) : (
                <Bus className="h-4 w-4 text-indigo-400" />
              )}
              <span>{t(`tour.transportation_${tour.transportationType.toLowerCase()}`, { defaultValue: tour.transportationType })}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-blue-400" />
            <span>{durationText}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="text-amber-600 font-bold">
              {rating > 0 ? `${rating.toFixed(1)} / 5` : t("tour.noRatings")}
            </span>
          </div>
          {tour.address && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-emerald-500" />
              <span>{tour.address}</span>
            </div>
          )}
          {(tour.createdByName || tour.createdAt) && (
            <div className="flex items-center gap-1.5">
              <User className="h-4 w-4 text-slate-400" />
              <span>
                {t("tour.createdBy")}
                {tour.createdByName && ` ${tour.createdByName}`}
                {tour.createdAt && ` · ${new Date(tour.createdAt).toLocaleDateString("vi-VN")}`}
              </span>
            </div>
          )}
          {(tour.updatedByName || tour.updatedAt) && (
            <div className="flex items-center gap-1.5">
              <Pencil className="h-4 w-4 text-slate-400" />
              <span>
                {t("tour.lastUpdated")}
                {tour.updatedByName && ` ${tour.updatedByName}`}
                {tour.updatedAt && ` · ${new Date(tour.updatedAt).toLocaleDateString("vi-VN")}`}
              </span>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="px-6 py-5">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-400">{t("common.description")}</h2>
          {tour.description ? (
            <div
              className="prose prose-sm max-w-none leading-relaxed text-slate-700 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
              dangerouslySetInnerHTML={{ __html: tour.description.replace(/&nbsp;/g, " ") }}
            />
          ) : (
            <p className="text-sm italic text-slate-400">{t("tour.noDescriptionProvided")}</p>
          )}
        </div>

        {/* Gallery */}
        {tour.tourImages && tour.tourImages.length > 0 && (
          <div className="px-6 pb-6">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-400">{t("tour.tourImages", { defaultValue: "Tour Images" })}</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
              {tour.tourImages.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setPreviewImageIndex(idx)}
                  className="shrink-0 transition-transform hover:scale-105"
                >
                  <img src={img.imageUrl} alt="Tour img" className="h-24 w-24 rounded-lg object-cover bg-slate-100 border border-slate-200" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── TABS CARD ── */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

        {/* Tab bar */}
        <div className="flex border-b border-slate-100 bg-slate-50/60 px-6 pt-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative mr-1 flex items-center gap-2 rounded-t-xl px-5 py-2.5 text-sm font-semibold transition-all ${activeTab === tab.key
                ? "bg-white text-brand border border-b-white border-slate-200 -mb-px z-10"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                }`}
            >
              {tab.icon}
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${activeTab === tab.key ? "bg-brand/10 text-brand" : "bg-slate-200 text-slate-500"
                  }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-6">

          {/* -- ITINERARY TAB -- */}
          {activeTab === "itinerary" && (
            <div className="space-y-4">
              {/* Top bar: day pills + add button */}
              <div className="flex flex-wrap items-center gap-2">
                {tour.tourItineraries && tour.tourItineraries.length > 0 && (
                  <>
                    {Object.entries(groupedItineraries)
                      .map(([dayStr]) => Number(dayStr))
                      .sort((a, b) => a - b)
                      .map((dayNumber) => {
                        const isMissing = missingItineraryDays.includes(dayNumber);
                        const isSelected = (selectedDay ?? Object.entries(groupedItineraries).map(([d]) => Number(d)).sort((a, b) => a - b)[0]) === dayNumber;
                        return (
                          <button
                            key={dayNumber}
                            onClick={() => setSelectedDay(dayNumber)}
                            className={`relative flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${isSelected
                              ? "bg-brand text-white shadow-sm"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              }`}
                          >
                            <span className="capitalize">{t("tour.day")}</span> {dayNumber}
                            {isMissing && (
                              <span className="flex h-1.5 w-1.5 rounded-full bg-amber-400" />
                            )}
                          </button>
                        );
                      })}
                  </>
                )}
                <div className="ml-auto flex items-center gap-3">
                  {tour.status?.toLowerCase() !== "inactive" && tour.canEdit && (
                    <span className="text-sm font-medium text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                      {t("tour.mustBeInactiveToEditItinerary")}
                    </span>
                  )}
                  {tour.status?.toLowerCase() === "inactive" && tour.canEdit && (
                    <ActionButton
                      variant="primary"
                      onClick={() => navigate(PATH.MANAGER.CREATE_ITINERARY(tour.id))}
                      className="gap-2 px-4 py-2 text-sm"
                    >
                      <Plus className="h-4 w-4" />
                      {t("tour.createItinerary")}
                    </ActionButton>
                  )}
                </div>
              </div>

              {missingItineraryDays.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
                  <span className="font-semibold">{t("tour.missingItineraryDaysTitle")}</span>
                  {" "}
                  {t("tour.missingItineraryDaysTourMsg", { days: missingItineraryDays.join(`, ${t("tour.day")} `) })}
                </div>
              )}

              {tour.tourItineraries && tour.tourItineraries.length > 0 ? (() => {
                const sortedDays = Object.entries(groupedItineraries).map(([d]) => Number(d)).sort((a, b) => a - b);
                const activeDayNumber = selectedDay ?? sortedDays[0];
                const items = groupedItineraries[activeDayNumber] ?? [];
                return (
                  <div className="relative ml-5 border-l-2 border-slate-100 pl-6 space-y-3">
                    {items.map((iti, idx) => {
                      const isExpanded = expandedItiIds.includes(iti.id);
                      const timeStr = iti.startDuration && iti.endDuration
                        ? `${iti.startDuration.substring(0, 5)} - ${iti.endDuration.substring(0, 5)}`
                        : iti.startDuration ? iti.startDuration.substring(0, 5) : t("tour.anyTime");
                      const tourismInfo = iti.tourismInfoId ? tourismInformationById[iti.tourismInfoId] : null;

                      return (
                        <div key={iti.id} className="relative">
                          {/* Dot */}
                          <div className="absolute -left-[33px] top-[18px] flex h-4 w-4 items-center justify-center rounded-full border-2 border-brand bg-white">
                            <div className="h-1.5 w-1.5 rounded-full bg-brand" />
                          </div>

                          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all">
                            <div
                              className="flex cursor-pointer items-center justify-between px-4 py-3.5 transition-colors hover:bg-slate-50"
                              onClick={() => toggleIti(iti.id)}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">
                                  {idx + 1}
                                </span>
                                <div className="flex flex-col min-w-0">
                                  <h4 className="truncate font-bold text-slate-800">{iti.title}</h4>
                                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                    <span className="flex items-center gap-0.5">
                                      <Clock className="h-3 w-3" />
                                      {timeStr}
                                    </span>
                                    <span className="text-slate-300">•</span>
                                    <span className="flex items-center gap-0.5">
                                      <MapPin className="h-3 w-3 text-emerald-500" />
                                      {iti.locationName || t("common.na")}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex shrink-0 items-center gap-2 pl-4">
                                {tour.status?.toLowerCase() === "inactive" && tour.canEdit && (
                                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                    <ActionButton
                                      variant="secondary"
                                      onClick={() => navigate(PATH.MANAGER.EDIT_ITINERARY(tour.id, iti.id))}
                                      className="h-7 w-7 text-brand hover:bg-brand-light"
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </ActionButton>
                                    <ActionButton
                                      variant="warning"
                                      onClick={() => setDeletingItineraryId(iti.id)}
                                      className="h-7 w-7"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </ActionButton>
                                  </div>
                                )}
                                <span className={`text-slate-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>
                                  <ChevronDown className="h-4 w-4" />
                                </span>
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="border-t border-slate-100 bg-slate-50/50 px-4 pb-4 pt-3 space-y-4">
                                {iti.description && (
                                  <div
                                    className="prose prose-sm max-w-none leading-relaxed text-slate-600 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
                                    dangerouslySetInnerHTML={{ __html: iti.description.replace(/&nbsp;/g, " ") }}
                                  />
                                )}
                                {iti.tourismInfoId && (
                                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white text-sm">
                                    {tourismInfo ? (
                                      <div className="grid sm:grid-cols-[130px_1fr]">
                                        <div className="flex min-h-28 items-center justify-center bg-slate-100">
                                          {tourismInfo.imageUrl ? (
                                            <img src={tourismInfo.imageUrl} alt={tourismInfo.name} className="h-full min-h-28 w-full object-cover" />
                                          ) : (
                                            <div className="flex flex-col items-center gap-1 text-slate-400">
                                              <ImageIcon className="h-6 w-6" />
                                              <span className="text-[11px]">{t("tour.noImage")}</span>
                                            </div>
                                          )}
                                        </div>
                                        <div className="space-y-1.5 p-3">
                                          <div className="flex flex-wrap items-center gap-1.5">
                                            <h5 className="font-bold text-slate-800">{tourismInfo.name}</h5>
                                            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-500">{tourismInfo.type}</span>
                                          </div>
                                          {tourismInfo.description && (
                                            <p className="text-xs leading-relaxed text-slate-500">{tourismInfo.description}</p>
                                          )}
                                          <div className="flex items-start gap-1.5 text-xs text-slate-500">
                                            <Globe className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />
                                            <span>{[tourismInfo.address, tourismInfo.city, tourismInfo.country].filter(Boolean).join(", ") || t("common.na")}</span>
                                          </div>
                                          {tourismInfo.sourceUrl && (
                                            <a href={tourismInfo.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:text-brand-hover">
                                              {tourismInfo.sourceName || t("tour.source")}
                                              <ExternalLink className="h-3 w-3" />
                                            </a>
                                          )}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2 p-3 font-semibold text-slate-600">
                                        <Info className="h-4 w-4 text-indigo-400" />
                                        {t("tour.tourismInfoId", { id: iti.tourismInfoId })}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })() : (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-14 text-center">
                  <Map className="mb-3 h-10 w-10 text-slate-300" />
                  <h3 className="mb-1 font-semibold text-slate-700">{t("tour.noItinerariesYet")}</h3>
                  <p className="text-sm text-slate-500">{t("tour.createItineraryHint")}</p>
                </div>
              )}
            </div>
          )}

          {/* ── REVIEWS TAB ── */}
          {activeTab === "reviews" && (
            <div className="space-y-5">
              {/* Filter bar */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-bold text-slate-800">
                  {t("tour.reviews")}
                  <span className="ml-2 text-sm font-medium text-slate-400">({totalCount || 0})</span>
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <select
                      value={ratingFilter === null ? "" : ratingFilter}
                      onChange={(e) => handleRatingChange(e.target.value)}
                      className="cursor-pointer appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2 pl-3 pr-8 text-sm font-semibold text-slate-700 outline-none transition-colors hover:border-brand/40 focus:border-brand focus:ring-2 focus:ring-brand/20"
                    >
                      <option value="">{t("common.all")} {t("tour.rating")}</option>
                      <option value="5">5 ★</option>
                      <option value="4">4 ★</option>
                      <option value="3">3 ★</option>
                      <option value="2">2 ★</option>
                      <option value="1">1 ★</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                  <div className="relative">
                    <select
                      value={dateSortOrder}
                      onChange={(e) => handleSortChange(e.target.value as "newest" | "oldest")}
                      className="cursor-pointer appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2 pl-3 pr-8 text-sm font-semibold text-slate-700 outline-none transition-colors hover:border-brand/40 focus:border-brand focus:ring-2 focus:ring-brand/20"
                    >
                      <option value="newest">{t("tour.newestFirst") || "Mới nhất"}</option>
                      <option value="oldest">{t("tour.oldestFirst") || "Cũ nhất"}</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Review list */}
              <div className="space-y-4">
                {visibleReviews.length > 0 ? (
                  visibleReviews.map((review) => {
                    const reviewerName = review.customerName || review.CustomerName || (review.customerId ? `Customer #${review.customerId}` : t("tour.anonymousCustomer"));
                    const initials = reviewerName.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase() || "A";
                    const reviewRating = review.rating || 0;

                    return (
                      <div key={review.id} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-blue-200 bg-blue-100 flex items-center justify-center text-brand font-bold text-sm uppercase">
                              {review.customerAvatar ? (
                                <img src={review.customerAvatar} alt={reviewerName} className="h-full w-full object-cover" />
                              ) : (
                                initials
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-800 text-sm">{reviewerName}</div>
                              {review.createdAt && (
                                <div className="text-xs text-slate-400">{new Date(review.createdAt).toLocaleDateString("vi-VN")}</div>
                              )}
                            </div>
                          </div>
                          <div className="flex shrink-0 text-amber-400">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} fill="currentColor" size={14} className={i >= reviewRating ? "text-slate-200" : ""} />
                            ))}
                          </div>
                        </div>
                        <ExpandableText
                          text={review.comment || t("tour.noComment")}
                          showMoreLabel={t("tour.showMore")}
                          showLessLabel={t("tour.showLess")}
                          className="text-sm leading-relaxed text-slate-700"
                        />

                        {review.replies && review.replies.length > 0 && (
                          <div className="mt-3 space-y-3">
                            {review.replies.map((reply: any) => {
                              const replyName = t("tour.tourManager");
                              const replyInitial = "TM";
                              return (
                                <div key={reply.id} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3.5">
                                  <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-indigo-200 bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs uppercase">
                                    {replyInitial}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                                      <span>{replyName}</span>
                                      <span className="text-slate-300">·</span>
                                      <span className="font-normal text-slate-400">{reply.createdAt ? new Date(reply.createdAt).toLocaleDateString("vi-VN") : ""}</span>
                                    </div>
                                    <ExpandableText
                                      text={reply.content}
                                      showMoreLabel={t("tour.showMore")}
                                      showLessLabel={t("tour.showLess")}
                                      className="mt-1 text-sm text-slate-600 leading-relaxed"
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  !isReviewsLoading && (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-14 text-center">
                      <Star className="mb-3 h-10 w-10 text-slate-300" />
                      <h3 className="mb-1 font-semibold text-slate-700">{t("tour.noReviews")}</h3>
                      <p className="text-sm text-slate-500">{t("tour.noReviewsMatchFilter") || "Chưa có đánh giá phù hợp với bộ lọc"}</p>
                    </div>
                  )
                )}

                {localReviews.length > 0 && (
                  <div className="mt-8 flex flex-wrap items-center justify-center gap-4 border-t border-slate-100 pt-8">
                    {localReviews.length < (totalCount || 0) && (
                      <button
                        onClick={() => setReviewPage(prev => prev + 1)}
                        disabled={isReviewsLoading}
                        className="group relative overflow-hidden rounded-xl bg-white px-8 py-3 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-50 hover:text-brand hover:ring-brand/50 hover:shadow-md disabled:opacity-50"
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          {isReviewsLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin text-brand" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-slate-400 transition-colors group-hover:text-brand" />
                          )}
                          {isReviewsLoading ? (t("tour.loadingReviewsMgr") || "Đang tải thêm...") : t("tour.showMore")}
                        </span>
                        <div className="absolute inset-0 z-0 bg-gradient-to-r from-brand/0 via-brand/5 to-brand/0 opacity-0 transition-opacity group-hover:opacity-100" />
                      </button>
                    )}
                    {reviewPage > 1 && (
                      <button
                        onClick={() => {
                          setReviewPage(1);
                          setLocalReviews(localReviews.slice(0, 5));
                        }}
                        disabled={isReviewsLoading}
                        className="group flex items-center gap-2 rounded-xl bg-white px-8 py-3 text-sm font-bold text-slate-500 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-50 hover:text-slate-700 hover:ring-slate-300 disabled:opacity-50"
                      >
                        <ChevronUp className="h-4 w-4 text-slate-400 transition-colors group-hover:text-slate-600" />
                        {t("tour.showLess")}
                      </button>
                    )}
                  </div>
                )}

                {isReviewsLoading && localReviews.length === 0 && (
                  <div className="flex justify-center py-4">
                    <div className="flex items-center gap-2 text-brand">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="text-sm font-medium">{t("tour.loadingReviewsMgr") || "Đang tải thêm..."}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
      <ConfirmDialog
        open={!!deletingItineraryId}
        onClose={() => setDeletingItineraryId(null)}
        onConfirm={handleDeleteItinerary}
        title={t("tour.deleteItineraryConfirm")}
        message={t("tour.deleteItineraryWarning")}
        confirmText={isDeletingItinerary ? t("tour.deleting") : t("common.confirm")}
        cancelText={t("common.cancel")}
        variant="warning"
        icon={<Trash2 className="h-6 w-6 text-rose-500" />}
      />
      {/* Image Preview Modal */}
      {previewImageIndex !== null && tour.tourImages && tour.tourImages.length > 0 && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setPreviewImageIndex(null)}
        >
          <button 
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
            onClick={() => setPreviewImageIndex(null)}
          >
            <X className="h-6 w-6" />
          </button>

          {/* Prev Button */}
          {tour.tourImages.length > 1 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/30 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setPreviewImageIndex((prev) => (prev === null ? 0 : prev === 0 ? tour.tourImages!.length - 1 : prev - 1));
              }}
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
          )}

          <img 
            src={tour.tourImages[previewImageIndex].imageUrl} 
            alt="Preview" 
            className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain shadow-2xl transition-all duration-300" 
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next Button */}
          {tour.tourImages.length > 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/30 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setPreviewImageIndex((prev) => (prev === null ? 0 : prev === tour.tourImages!.length - 1 ? 0 : prev + 1));
              }}
            >
              <ChevronRight className="h-8 w-8" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
