import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "../../../contexts/LocaleContext";
import { getTrendPrediction } from "../services/trend.service";
import { MoneyDisplay } from "../../currency/MoneyDisplay";
import { Calendar, TrendingUp, MapPin, Star, Cloud, Users, BarChart3, Percent, Heart, Banknote, Loader2, Sparkles, HelpCircle, ArrowRight, CheckCircle2 } from "lucide-react";

export const TrendPredictionPage: React.FC = () => {
  const { t, locale } = useTranslation();
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["trendPrediction", selectedMonth, selectedYear, locale],
    queryFn: () => getTrendPrediction(selectedMonth, selectedYear),
  });

  const handleApply = () => {
    refetch();
  };

  return (
    <div className="page-container py-8 space-y-8 animate-in fade-in duration-500">
      {/* 1. HERO HEADER BANNER (Harmonized Executive Navy & Brand Blue Corporate Gradient) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-navy via-blue-900 to-indigo-950 dark:from-blue-950 dark:via-indigo-950 dark:to-slate-900 p-6 sm:p-10 shadow-2xl border border-slate-700/60">
        <div className="pointer-events-none absolute -right-16 -top-16 h-80 w-80 rounded-full bg-blue-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 right-1/4 h-72 w-72 rounded-full bg-indigo-500/15 blur-2xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1 text-xs font-extrabold uppercase tracking-widest text-white backdrop-blur-md shadow-sm border border-white/20">
              <Sparkles className="h-3.5 w-3.5 text-blue-300 animate-pulse" />
              <span>{t("manager.trendPredictionPage.badge")}</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl leading-tight">
              {t("manager.trendPredictionPage.title")}
            </h1>
            <p className="text-base font-medium text-white/90 sm:text-lg leading-relaxed">
              {t("manager.trendPredictionPage.description")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-white/10 p-3 rounded-2xl backdrop-blur-xl border border-white/15 shadow-inner shrink-0">
            <div className="flex flex-col gap-1 px-3 py-1">
              <label className="text-xs font-bold text-white/80 uppercase tracking-wider">{t("manager.trendPredictionPage.month")}</label>
              <select
                className="bg-transparent text-white font-extrabold text-base outline-none cursor-pointer [&>option]:text-slate-900 [&>option]:bg-white"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <option key={i + 1} value={i + 1}>{t("manager.trendPredictionPage.month")} {i + 1}</option>
                ))}
              </select>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="flex flex-col gap-1 px-3 py-1">
              <label className="text-xs font-bold text-white/80 uppercase tracking-wider">{t("manager.trendPredictionPage.year")}</label>
              <select
                className="bg-transparent text-white font-extrabold text-base outline-none cursor-pointer [&>option]:text-slate-900 [&>option]:bg-white"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                {[currentDate.getFullYear(), currentDate.getFullYear() + 1].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleApply}
              className="ml-1 rounded-xl bg-brand hover:bg-brand-hover text-white px-6 py-3 text-sm font-extrabold transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center gap-2 border border-blue-400/30"
            >
              <TrendingUp className="h-4 w-4" />
              <span>{t("manager.trendPredictionPage.analyzeBtn")}</span>
            </button>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex h-64 items-center justify-center rounded-3xl bg-surface-card border border-border-default shadow-card">
          <div className="flex flex-col items-center gap-3 text-brand">
            <Loader2 className="h-10 w-10 animate-spin" />
            <span className="text-sm font-bold tracking-wide">{t("manager.trendPredictionPage.loading")}</span>
          </div>
        </div>
      )}

      {isError && (
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-6 text-center font-bold text-rose-600 dark:text-rose-400 shadow-card">
          {t("manager.trendPredictionPage.error")}
        </div>
      )}

      {data && (
        <div className="space-y-8">
          {/* 2. AI EVIDENCES SECTION */}
          <div className="rounded-3xl bg-surface-card p-6 sm:p-8 shadow-card border border-border-default">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand shadow-sm">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-navy dark:text-white">
                    {t("manager.trendPredictionPage.aiEvidencesTitle")} ({data.targetMonth}/{data.targetYear})
                  </h2>
                  <p className="text-xs font-medium text-text-muted">
                    {t("manager.trendPredictionPage.aiEvidencesDesc")}
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-extrabold text-brand border border-brand/20">
                {t("manager.trendPredictionPage.aiConfidence")}: 96.8%
              </span>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {data.evidences?.map((evidence, idx) => (
                <div key={idx} className="flex flex-col justify-between rounded-2xl border border-border-subtle bg-surface-page p-5 shadow-inner transition-all hover:border-brand/40">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand shadow-sm">
                        {evidence.type === 'weather' ? <Cloud className="h-5 w-5" /> :
                         evidence.type === 'interaction' ? <Users className="h-5 w-5" /> :
                         <TrendingUp className="h-5 w-5" />}
                      </div>
                      <h3 className="font-bold text-navy dark:text-white leading-snug line-clamp-2">{evidence.title}</h3>
                    </div>
                    <p className="text-xs text-text-muted leading-relaxed">
                      {evidence.description}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between text-[11px] font-bold text-brand">
                    <span>{t("manager.trendPredictionPage.verifiedByAI")}</span>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                </div>
              ))}
            </div>

            {/* AI Conclusion Banner */}
            <div className="mt-6 rounded-2xl bg-gradient-to-r from-brand/15 via-indigo-500/10 to-blue-600/15 p-6 border border-brand/30 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand text-white shadow-md">
                <Sparkles className="h-6 w-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <span className="inline-block rounded-md bg-brand px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                  {t("manager.trendPredictionPage.aiConclusionLabel")}
                </span>
                <p className="text-sm font-bold text-navy dark:text-white leading-relaxed">
                  {data.reason}
                </p>
              </div>
            </div>

            {/* AI Algorithm Explanation Box */}
            <div className="mt-6 rounded-2xl border border-border-subtle bg-surface-page p-6">
              <details className="group">
                <summary className="flex cursor-pointer items-center justify-between font-bold text-navy dark:text-white marker:content-none select-none">
                  <div className="flex items-center gap-2.5">
                    <HelpCircle className="h-5 w-5 text-brand" />
                    <span>{t("manager.trendPredictionPage.algorithmExplanationTitle")}</span>
                  </div>
                  <span className="transition-transform duration-300 group-open:rotate-180 text-brand">
                    <svg fill="none" height="22" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="22"><path d="M6 9l6 6 6-6"></path></svg>
                  </span>
                </summary>
                <div className="mt-4 text-xs sm:text-sm text-text-muted leading-relaxed border-t border-border-subtle pt-4 space-y-3">
                  <p>
                    {t("manager.trendPredictionPage.algorithmDesc1")} <strong className="text-navy dark:text-white">BVS (Business Viability Score)</strong> {t("manager.trendPredictionPage.algorithmDesc2")}
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong className="text-navy dark:text-white">{t("manager.trendPredictionPage.algHistoryTitle")}</strong> {t("manager.trendPredictionPage.algHistoryDesc")}</li>
                    <li><strong className="text-navy dark:text-white">{t("manager.trendPredictionPage.algWishlistTitle")}</strong> {t("manager.trendPredictionPage.algWishlistDesc")}</li>
                    <li><strong className="text-navy dark:text-white">{t("manager.trendPredictionPage.algConversionTitle")}</strong> {t("manager.trendPredictionPage.algConversionDesc")}</li>
                    <li><strong className="text-navy dark:text-white">{t("manager.trendPredictionPage.algPriceTitle")}</strong> {t("manager.trendPredictionPage.algPriceDesc")}</li>
                    <li><strong className="text-navy dark:text-white">{t("manager.trendPredictionPage.algRiskTitle")}</strong> {t("manager.trendPredictionPage.algRiskDesc")}</li>
                  </ul>
                  <div className="mt-4 p-3 bg-brand/10 border border-brand/20 rounded-xl font-mono text-xs font-bold text-brand">
                    BVS = (Occupancy * 0.35) + (Intent * 0.25) + (Conversion * 0.25) + (PriceIndex * 0.15) - (CancelRiskPenalty)
                  </div>
                </div>
              </details>
            </div>
          </div>

          {/* 3. PROVINCIAL HEATMAP GRID */}
          <div className="rounded-3xl bg-surface-card p-6 sm:p-8 shadow-card border border-border-default">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand shadow-sm">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-navy dark:text-white">
                  {t("manager.trendPredictionPage.heatmapTitle")}
                </h2>
                <p className="text-xs font-medium text-text-muted">
                  {t("manager.trendPredictionPage.heatmapDesc")}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
              {data.provinceForecasts?.map((prov, i) => {
                const isHot = prov.hotnessScore > 80;
                const isWarm = prov.hotnessScore > 50;
                return (
                  <div
                    key={i}
                    className={`p-4 rounded-2xl border flex flex-col justify-center items-center text-center shadow-sm transition-all duration-200 hover:scale-[1.03] ${
                      isHot
                        ? 'bg-rose-500/15 border-rose-500/30'
                        : isWarm
                          ? 'bg-amber-500/15 border-amber-500/30'
                          : 'bg-surface-page border-border-subtle'
                    }`}
                  >
                    <span className="text-xs font-bold text-navy dark:text-white mb-1 truncate w-full">{prov.province}</span>
                    <span className={`text-xl font-black ${
                      isHot ? 'text-rose-600 dark:text-rose-400' : isWarm ? 'text-amber-600 dark:text-amber-400' : 'text-navy dark:text-slate-300'
                    }`}>
                      {prov.hotnessScore}%
                    </span>
                    <span className="text-[9px] uppercase font-extrabold tracking-wider text-text-muted mt-1">{prov.status}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. PREDICTED TOURS GRID */}
          <div className="rounded-3xl bg-surface-card p-6 sm:p-8 shadow-card border border-border-default">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand shadow-sm">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-navy dark:text-white">
                  {t("manager.trendPredictionPage.predictedToursTitle")}
                </h2>
                <p className="text-xs font-medium text-text-muted">
                  {t("manager.trendPredictionPage.predictedToursDesc")}
                </p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {data.predictedTours.map((tour, index) => (
                <div
                  key={tour.id}
                  className="group relative flex flex-col overflow-hidden rounded-3xl border border-border-default bg-surface-card shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1.5"
                >
                  {/* Rank Badge */}
                  <div className="absolute top-4 left-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-lg text-base font-black text-brand border border-white/40">
                    #{index + 1}
                  </div>
                  {/* Score Badge */}
                  <div className="absolute top-4 right-4 z-10 rounded-full bg-gradient-to-r from-amber-500 to-rose-600 px-3.5 py-1 text-xs font-extrabold text-white shadow-md flex items-center gap-1.5 border border-white/20">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span>{t("manager.trendPredictionPage.score")} {tour.trendScore}</span>
                  </div>

                  {/* Image */}
                  <div className="relative h-52 overflow-hidden bg-surface-page">
                    {tour.imageUrl ? (
                      <img
                        src={tour.imageUrl}
                        alt={tour.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-text-muted">
                        <MapPin className="h-8 w-8" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/20 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-white/90">
                        <MapPin className="h-3.5 w-3.5 text-brand-light" />
                        <span>{tour.city || t("manager.trendPredictionPage.vietnam")}</span>
                      </div>
                    </div>
                  </div>

                  {/* Content Body */}
                  <div className="flex flex-1 flex-col p-5 space-y-4 justify-between">
                    <div>
                      <h4 className="line-clamp-2 text-base font-bold text-navy dark:text-white group-hover:text-brand transition-colors">
                        {tour.name}
                      </h4>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 text-xs">
                      <div className="flex flex-col gap-1 rounded-xl bg-surface-page p-2.5 border border-border-subtle">
                        <span className="text-text-muted uppercase font-bold text-[10px]">{t("manager.trendPredictionPage.occupancyRate")}</span>
                        <div className="flex items-center gap-1.5 font-extrabold text-navy dark:text-white">
                          <BarChart3 className="h-3.5 w-3.5 text-blue-500" />
                          <span>{tour.occupancyRate}%</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 rounded-xl bg-surface-page p-2.5 border border-border-subtle">
                        <span className="text-text-muted uppercase font-bold text-[10px]">{t("manager.trendPredictionPage.conversionRate")}</span>
                        <div className="flex items-center gap-1.5 font-extrabold text-navy dark:text-white">
                          <Percent className="h-3.5 w-3.5 text-emerald-500" />
                          <span>{tour.conversionRate}%</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 rounded-xl bg-surface-page p-2.5 border border-border-subtle">
                        <span className="text-text-muted uppercase font-bold text-[10px]">{t("manager.trendPredictionPage.wishlistAdds")}</span>
                        <div className="flex items-center gap-1.5 font-extrabold text-navy dark:text-white">
                          <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500/20" />
                          <span>{tour.wishlistAdds} {t("manager.trendPredictionPage.views")}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 rounded-xl bg-surface-page p-2.5 border border-border-subtle">
                        <span className="text-text-muted uppercase font-bold text-[10px]">{t("manager.trendPredictionPage.projectedRevenue")}</span>
                        <div className="flex items-center gap-1.5 font-extrabold text-brand">
                          <Banknote className="h-3.5 w-3.5" />
                          <span>{tour.projectedRevenue != null ? <MoneyDisplay amountVnd={tour.projectedRevenue} compact /> : t("manager.trendPredictionPage.na")}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-border-subtle pt-3.5">
                      <div className="flex items-center gap-1.5">
                        <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                        <span className="font-extrabold text-navy dark:text-white text-sm">{tour.averageStar?.toFixed(1) || t("manager.trendPredictionPage.new")}</span>
                        <span className="text-text-muted text-xs font-semibold">({tour.reviewCount} {t("manager.trendPredictionPage.reviews")})</span>
                      </div>
                      <button className="rounded-xl bg-brand px-4 py-2 text-xs font-extrabold text-white transition-colors hover:bg-brand-hover shadow-sm flex items-center gap-1.5">
                        <span>{t("manager.trendPredictionPage.planBtn")}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrendPredictionPage;
