import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Filter,
  Search,
  MapPin,
  X,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  ArrowUpDown,
} from "lucide-react";
import { ActionButton } from "../components/home/ActionButton";
import { TourCard } from "../components/home/TourCard";
import { useQuery } from "@tanstack/react-query";
import { categoryService } from "../features/content/services/category.service";
import { useSearchTours } from "../hooks/useSearchTours";
import type { Tour } from "../features/tour/types/tour";
import { getNumberValue } from "../features/tour/utils/tourScheduleTicket";

// ─── Constants ───────────────────────────────────────────────────────────────

const MAX_PRICE = 100_000_000;
const MAX_DAYS = 30;

const SORT_OPTIONS = [
  { label: "Recommended", value: "" },
  { label: "Price: Low → High", value: "price_asc" },
  { label: "Price: High → Low", value: "price_desc" },
  { label: "Newest first", value: "date_desc" },
  { label: "Oldest first", value: "date_asc" },
];

const getTourLowestTicketPrice = (tour: Tour) => {
  const prices =
    tour.tourSchedules
      ?.flatMap((schedule) => schedule.tourScheduleTickets ?? [])
      .map((ticket) => getNumberValue(ticket.price))
      .filter((price): price is number => price !== null) ?? [];

  return prices.length > 0 ? Math.min(...prices) : null;
};

// ─── Slider CSS ───────────────────────────────────────────────────────────────

const SLIDER_CSS = `
  .ts-range {
    -webkit-appearance: none; appearance: none;
    width: 100%; height: 20px;
    background: transparent; cursor: pointer; margin: 0; padding: 0;
  }
  .ts-range::-webkit-slider-runnable-track { background: transparent; }
  .ts-range::-moz-range-track              { background: transparent; }
  .ts-range::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 18px; height: 18px; border-radius: 50%;
    background: #fff; border: 2.5px solid #EB662B;
    box-shadow: 0 1px 6px rgba(235,102,43,.3); margin-top: -8px; cursor: pointer;
  }
  .ts-range::-moz-range-thumb {
    width: 18px; height: 18px; border-radius: 50%;
    background: #fff; border: 2.5px solid #EB662B;
    box-shadow: 0 1px 6px rgba(235,102,43,.3); cursor: pointer;
  }
  .ts-dual { position: relative; height: 20px; }
  .ts-dual .ts-range { position: absolute; inset: 0; pointer-events: none; }
  .ts-dual .ts-range::-webkit-slider-thumb { pointer-events: all; }
  .ts-dual .ts-range::-moz-range-thumb     { pointer-events: all; }
`;

// ─── Track Fill ───────────────────────────────────────────────────────────────

function SliderTrack({ lo, hi }: { lo: number; hi: number }) {
  return (
    <div
      className="relative h-[3px] rounded-full mx-[9px] mb-1"
      style={{ background: "rgba(5,7,60,0.08)" }}
    >
      <div
        className="absolute inset-y-0 rounded-full"
        style={{ left: `${lo}%`, right: `${100 - hi}%`, background: "#EB662B" }}
      />
    </div>
  );
}

// ─── Price Slider ─────────────────────────────────────────────────────────────

function PriceSlider({
  valueMin,
  valueMax,
  onChangeMin,
  onChangeMax,
  onCommit,
}: {
  valueMin: number;
  valueMax: number;
  onChangeMin(v: number): void;
  onChangeMax(v: number): void;
  onCommit(): void;
}) {
  const pct = (v: number) => (v / MAX_PRICE) * 100;
  const fmt = (v: number) =>
    v <= 0 ? "0" : v >= MAX_PRICE ? "Max" : (v / 1_000_000).toFixed(0) + "M đ";

  return (
    <div className="space-y-3">
      <SliderTrack lo={pct(valueMin)} hi={pct(valueMax)} />
      <div className="ts-dual">
        <input
          className="ts-range"
          type="range"
          min={0}
          max={MAX_PRICE}
          step={500_000}
          value={valueMin}
          style={{ zIndex: valueMin > MAX_PRICE * 0.95 ? 5 : 3 }}
          onChange={(e) =>
            onChangeMin(Math.min(+e.target.value, valueMax - 500_000))
          }
          onMouseUp={onCommit}
          onTouchEnd={onCommit}
        />
        <input
          className="ts-range"
          type="range"
          min={0}
          max={MAX_PRICE}
          step={500_000}
          value={valueMax}
          style={{ zIndex: 4 }}
          onChange={(e) =>
            onChangeMax(Math.max(+e.target.value, valueMin + 500_000))
          }
          onMouseUp={onCommit}
          onTouchEnd={onCommit}
        />
      </div>
      <div
        className="flex justify-between text-xs font-bold"
        style={{ color: "#EB662B" }}
      >
        <span>{fmt(valueMin)}</span>
        <span>{fmt(valueMax)}</span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          placeholder="Min"
          value={valueMin === 0 ? "" : valueMin}
          onChange={(e) => onChangeMin(+e.target.value)}
          onBlur={onCommit}
          onKeyDown={(e) => e.key === "Enter" && onCommit()}
          className="w-full text-xs text-slate-700 rounded-xl py-2 px-3 outline-none transition-colors"
          style={{
            background: "rgba(5,7,60,0.04)",
            border: "1px solid rgba(5,7,60,0.1)",
          }}
        />
        <span className="text-slate-300 shrink-0 font-bold">—</span>
        <input
          type="number"
          placeholder="Max"
          value={valueMax >= MAX_PRICE ? "" : valueMax}
          onChange={(e) => onChangeMax(+e.target.value)}
          onBlur={onCommit}
          onKeyDown={(e) => e.key === "Enter" && onCommit()}
          className="w-full text-xs text-slate-700 rounded-xl py-2 px-3 outline-none transition-colors"
          style={{
            background: "rgba(5,7,60,0.04)",
            border: "1px solid rgba(5,7,60,0.1)",
          }}
        />
      </div>
    </div>
  );
}

// ─── Duration Slider ──────────────────────────────────────────────────────────

function DurationSlider({
  value,
  onChange,
  onCommit,
}: {
  value: number;
  onChange(v: number): void;
  onCommit(): void;
}) {
  return (
    <div className="space-y-3">
      <SliderTrack lo={0} hi={(value / MAX_DAYS) * 100} />
      <input
        className="ts-range"
        type="range"
        min={0}
        max={MAX_DAYS}
        step={1}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        onMouseUp={onCommit}
        onTouchEnd={onCommit}
      />
      <div className="flex items-center justify-between">
        <span
          className="text-sm font-black"
          style={{ color: "#EB662B", fontFamily: "'Sora', sans-serif" }}
        >
          {value === 0 ? "Any duration" : `Up to ${value} days`}
        </span>
        <span className="text-xs text-slate-400">max {MAX_DAYS}d</span>
      </div>
    </div>
  );
}

// ─── Filter Section Label ─────────────────────────────────────────────────────

function FilterSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="py-6"
      style={{ borderBottom: "1px solid rgba(5,7,60,0.07)" }}
    >
      <p
        className="text-[10px] font-black uppercase tracking-[0.18em] mb-3"
        style={{ color: "#EB662B" }}
      >
        {label}
      </p>
      {children}
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function Sidebar({
  localSearch,
  setLocalSearch,
  localCity,
  setLocalCity,
  localStart,
  setLocalStart,
  localEnd,
  setLocalEnd,
  localMinPrice,
  setLocalMinPrice,
  localMaxPrice,
  setLocalMaxPrice,
  localDuration,
  setLocalDuration,
  categoryId,
  categories,
  submitText,
  submitDates,
  submitPrice,
  submitDuration,
  upd,
  onClear,
}: any) {
  return (
    <aside
      className="w-full lg:w-[360px] lg:shrink-0 lg:sticky lg:top-24 lg:self-start"
      style={{
        fontFamily: "'Sora', 'Plus Jakarta Sans', system-ui, sans-serif",
      }}
    >
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "#fff",
          border: "1px solid rgba(5,7,60,0.08)",
          boxShadow: "0 4px 24px rgba(5,7,60,0.06)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid rgba(5,7,60,0.07)" }}
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} style={{ color: "#EB662B" }} />
            <span className="text-sm font-black text-slate-800">Filters</span>
          </div>
          <button
            onClick={onClear}
            className="text-[11px] font-bold text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1"
          >
            <X size={12} /> Clear all
          </button>
        </div>

        <div className="px-6">
          {/* Keywords */}
          <FilterSection label="Search">
            <div className="flex flex-col gap-2.5">
              {[
                {
                  icon: Search,
                  val: localSearch,
                  set: setLocalSearch,
                  ph: "Search tours…",
                },
                {
                  icon: MapPin,
                  val: localCity,
                  set: setLocalCity,
                  ph: "City, e.g. Hanoi",
                },
              ].map(({ icon: Icon, val, set, ph }) => (
                <label
                  key={ph}
                  className="flex items-center gap-2.5 rounded-xl px-4 py-2.5 cursor-text transition-all"
                  style={{
                    background: "rgba(5,7,60,0.03)",
                    border: "1px solid rgba(5,7,60,0.08)",
                  }}
                >
                  <Icon size={14} className="text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={val}
                    placeholder={ph}
                    onChange={(e) => set(e.target.value)}
                    onBlur={submitText}
                    onKeyDown={(e) => e.key === "Enter" && submitText()}
                    className="bg-transparent text-[13px] text-slate-700 placeholder:text-slate-400 outline-none w-full font-medium"
                  />
                </label>
              ))}
            </div>
          </FilterSection>

          {/* Travel dates */}
          <FilterSection label="Travel Dates">
            <div className="grid grid-cols-2 gap-3">
              {[
                { lbl: "From", val: localStart, set: setLocalStart },
                { lbl: "To", val: localEnd, set: setLocalEnd },
              ].map(({ lbl, val, set }) => (
                <div key={lbl}>
                  <p className="text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                    {lbl}
                  </p>
                  <input
                    type="date"
                    value={val}
                    onChange={(e) => set(e.target.value)}
                    onBlur={submitDates}
                    className="w-full rounded-xl py-2.5 px-3 text-sm text-slate-700 outline-none transition-colors font-medium"
                    style={{
                      background: "rgba(5,7,60,0.03)",
                      border: "1px solid rgba(5,7,60,0.08)",
                    }}
                  />
                </div>
              ))}
            </div>
          </FilterSection>

          {/* Category */}
          <FilterSection label="Category">
            <div className="flex flex-wrap gap-2">
              {categories.map((c: any) => {
                const active = (categoryId ?? null) === c.value;
                return (
                  <button
                    key={c.label}
                    onClick={() => upd({ categoryId: c.value })}
                    className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
                    style={{
                      background: active ? "#EB662B" : "rgba(5,7,60,0.04)",
                      color: active ? "#fff" : "#64748b",
                      border: active
                        ? "1px solid #EB662B"
                        : "1px solid rgba(5,7,60,0.08)",
                    }}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </FilterSection>

          {/* Price */}
          <FilterSection label="Price Range">
            <PriceSlider
              valueMin={localMinPrice}
              valueMax={localMaxPrice}
              onChangeMin={setLocalMinPrice}
              onChangeMax={setLocalMaxPrice}
              onCommit={submitPrice}
            />
          </FilterSection>

          {/* Duration */}
          <FilterSection label="Duration">
            <DurationSlider
              value={localDuration}
              onChange={setLocalDuration}
              onCommit={submitDuration}
            />
          </FilterSection>
        </div>
      </div>
    </aside>
  );
}

// ─── Pagination, Main Component giữ nguyên (chỉ thay Sidebar) ───────────────

function Pagination({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage(p: number): void;
}) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const visible = pages.filter((p) => Math.abs(p - page) <= 2);

  return (
    <div className="mt-14 flex items-center justify-center gap-2">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page === 1}
        className="w-10 h-10 flex items-center justify-center rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        style={{ border: "1px solid rgba(5,7,60,0.1)", background: "#fff" }}
      >
        <ChevronLeft size={18} className="text-slate-600" />
      </button>

      {visible[0] > 1 && (
        <>
          <button
            onClick={() => onPage(1)}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-sm font-bold text-slate-600 transition-all hover:text-[#EB662B]"
            style={{ border: "1px solid rgba(5,7,60,0.1)", background: "#fff" }}
          >
            1
          </button>
          {visible[0] > 2 && <span className="text-slate-300 px-1">…</span>}
        </>
      )}

      {visible.map((p) => (
        <button
          key={p}
          onClick={() => onPage(p)}
          className="w-10 h-10 flex items-center justify-center rounded-xl text-sm font-bold transition-all"
          style={{
            background: p === page ? "#EB662B" : "#fff",
            color: p === page ? "#fff" : "#475569",
            border:
              p === page ? "1px solid #EB662B" : "1px solid rgba(5,7,60,0.1)",
            boxShadow: p === page ? "0 4px 16px rgba(235,102,43,0.3)" : "none",
            fontFamily: "'Sora', sans-serif",
          }}
        >
          {p}
        </button>
      ))}

      {visible[visible.length - 1] < totalPages && (
        <>
          {visible[visible.length - 1] < totalPages - 1 && (
            <span className="text-slate-300 px-1">…</span>
          )}
          <button
            onClick={() => onPage(totalPages)}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-sm font-bold text-slate-600 transition-all hover:text-[#EB662B]"
            style={{ border: "1px solid rgba(5,7,60,0.1)", background: "#fff" }}
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        onClick={() => onPage(page + 1)}
        disabled={page === totalPages}
        className="w-10 h-10 flex items-center justify-center rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        style={{ border: "1px solid rgba(5,7,60,0.1)", background: "#fff" }}
      >
        <ChevronRight size={18} className="text-slate-600" />
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TourSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const page = parseInt(searchParams.get("page") || "1", 10);
  const searchTerm =
    searchParams.get("searchTerm") || searchParams.get("query") || "";
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";
  const minPrice = searchParams.get("minPrice")
    ? +searchParams.get("minPrice")!
    : undefined;
  const maxPrice = searchParams.get("maxPrice")
    ? +searchParams.get("maxPrice")!
    : undefined;
  const duration = searchParams.get("duration")
    ? +searchParams.get("duration")!
    : undefined;
  const categoryId = searchParams.get("categoryId")
    ? +searchParams.get("categoryId")!
    : undefined;
  const city = searchParams.get("city") || "";
  const sortBy = searchParams.get("sortBy") || "";

  const [localSearch, setLocalSearch] = useState(searchTerm);
  const [localCity, setLocalCity] = useState(city);
  const [localStart, setLocalStart] = useState(startDate);
  const [localEnd, setLocalEnd] = useState(endDate);
  const [localMinPrice, setLocalMinPrice] = useState(minPrice ?? 0);
  const [localMaxPrice, setLocalMaxPrice] = useState(maxPrice ?? MAX_PRICE);
  const [localDuration, setLocalDuration] = useState(duration ?? 0);

  const { data: categoryData } = useQuery({
    queryKey: ["categories", "active"],
    queryFn: () => categoryService.getActiveCategories(1, 100),
  });
  const fetchedCategories = Array.isArray(categoryData)
    ? categoryData
    : (categoryData as any)?.data || (categoryData as any)?.items || [];
  const categoriesList = [{ label: "All", value: null }, ...fetchedCategories.map((c: any) => ({ label: c.name, value: c.id }))];

  useEffect(() => setLocalSearch(searchTerm), [searchTerm]);
  useEffect(() => setLocalCity(city), [city]);
  useEffect(() => setLocalStart(startDate), [startDate]);
  useEffect(() => setLocalEnd(endDate), [endDate]);
  useEffect(() => {
    setLocalMinPrice(minPrice ?? 0);
    setLocalMaxPrice(maxPrice ?? MAX_PRICE);
  }, [minPrice, maxPrice]);
  useEffect(() => setLocalDuration(duration ?? 0), [duration]);

  const { tours, isLoading, error, totalPages } = useSearchTours(
    page,
    6,
    searchTerm,
    startDate,
    categoryId,
    undefined,
    city,
    minPrice,
    maxPrice,
    endDate,
    duration,
    sortBy,
  );

  const upd = (updates: Record<string, string | number | null>) => {
    const p = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) =>
      v === null || v === "" ? p.delete(k) : p.set(k, String(v)),
    );
    if (!updates.page) p.set("page", "1");
    setSearchParams(p);
  };

  const submitText = () => upd({ searchTerm: localSearch, city: localCity });
  const submitDates = () => upd({ startDate: localStart, endDate: localEnd });
  const submitPrice = () =>
    upd({
      minPrice: localMinPrice > 0 ? localMinPrice : null,
      maxPrice: localMaxPrice < MAX_PRICE ? localMaxPrice : null,
    });
  const submitDuration = () =>
    upd({ duration: localDuration > 0 ? localDuration : null });
  const handleClear = () => setSearchParams(new URLSearchParams());

  const activeFilterCount = [
    searchTerm,
    city,
    startDate,
    endDate,
    minPrice,
    maxPrice,
    duration,
    categoryId,
    sortBy,
  ].filter(Boolean).length;

  return (
    <div
      className="min-h-screen pb-24"
      style={{
        background: "#F9F7F5",
        fontFamily: "'Sora', 'Plus Jakarta Sans', system-ui, sans-serif",
      }}
    >
      <style>{SLIDER_CSS}</style>

      {/* ── Body ── */}
      <div className="container mx-auto max-w-7xl px-4 pt-10">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Sidebar */}
          <Sidebar
            localSearch={localSearch}
            setLocalSearch={setLocalSearch}
            localCity={localCity}
            setLocalCity={setLocalCity}
            localStart={localStart}
            setLocalStart={setLocalStart}
            localEnd={localEnd}
            setLocalEnd={setLocalEnd}
            localMinPrice={localMinPrice}
            setLocalMinPrice={setLocalMinPrice}
            localMaxPrice={localMaxPrice}
            setLocalMaxPrice={setLocalMaxPrice}
            localDuration={localDuration}
            setLocalDuration={setLocalDuration}
            categoryId={categoryId}
            categories={categoriesList}
            submitText={submitText}
            submitDates={submitDates}
            submitPrice={submitPrice}
            submitDuration={submitDuration}
            upd={upd}
            onClear={handleClear}
          />

          {/* Main content */}
          <div className="flex-1 min-w-0 w-full">
            {/* Sort + filter bar */}
            <div
              className="flex items-center justify-between gap-4 mb-8 px-5 py-3.5 rounded-2xl"
              style={{
                background: "#fff",
                border: "1px solid rgba(5,7,60,0.07)",
                boxShadow: "0 2px 12px rgba(5,7,60,0.04)",
              }}
            >
              {/* Mobile filter toggle */}
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden flex items-center gap-2 text-sm font-bold text-slate-700"
              >
                <Filter size={15} style={{ color: "#EB662B" }} />
                Filters
                {activeFilterCount > 0 && (
                  <span
                    className="flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black text-white"
                    style={{ background: "#EB662B" }}
                  >
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <div className="hidden lg:flex items-center gap-1 text-sm font-medium text-slate-400">
                <span className="font-black text-slate-700 m-0">
                  {tours.length}
                </span>
                results
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2.5">
                <ArrowUpDown size={14} className="text-slate-400 shrink-0" />
                <span className="text-sm text-slate-400 font-medium hidden sm:block">
                  Sort by
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => upd({ sortBy: e.target.value })}
                  className="text-sm font-bold text-slate-700 outline-none cursor-pointer rounded-xl px-3 py-2 transition-colors"
                  style={{
                    background: "rgba(5,7,60,0.04)",
                    border: "1px solid rgba(5,7,60,0.08)",
                  }}
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active filter pills */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {searchTerm && (
                  <span
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white"
                    style={{ background: "#EB662B" }}
                  >
                    "{searchTerm}"
                    <button onClick={() => upd({ searchTerm: null })}>
                      <X size={11} />
                    </button>
                  </span>
                )}
                {city && (
                  <span
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
                    style={{
                      background: "#FFF1EB",
                      color: "#EB662B",
                      border: "1px solid rgba(235,102,43,0.2)",
                    }}
                  >
                    📍 {city}
                    <button onClick={() => upd({ city: null })}>
                      <X size={11} />
                    </button>
                  </span>
                )}
                {categoryId && (
                  <span
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
                    style={{
                      background: "#FFF1EB",
                      color: "#EB662B",
                      border: "1px solid rgba(235,102,43,0.2)",
                    }}
                  >
                {categoriesList.find((c) => c.value === categoryId)?.label || "Category"}
                    <button onClick={() => upd({ categoryId: null })}>
                      <X size={11} />
                    </button>
                  </span>
                )}
                {(minPrice || maxPrice) && (
                  <span
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
                    style={{
                      background: "#FFF1EB",
                      color: "#EB662B",
                      border: "1px solid rgba(235,102,43,0.2)",
                    }}
                  >
                    💰 Price filter
                    <button
                      onClick={() => upd({ minPrice: null, maxPrice: null })}
                    >
                      <X size={11} />
                    </button>
                  </span>
                )}
                {duration && (
                  <span
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
                    style={{
                      background: "#FFF1EB",
                      color: "#EB662B",
                      border: "1px solid rgba(235,102,43,0.2)",
                    }}
                  >
                    ⏱ Up to {duration}d
                    <button onClick={() => upd({ duration: null })}>
                      <X size={11} />
                    </button>
                  </span>
                )}
                <button
                  onClick={handleClear}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors"
                  style={{ border: "1px solid rgba(5,7,60,0.1)" }}
                >
                  Clear all
                </button>
              </div>
            )}

            {/* Tour grid */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-32 gap-4">
                <div
                  className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
                  style={{
                    borderColor: "#EB662B",
                    borderTopColor: "transparent",
                  }}
                />
                <p className="text-sm font-bold text-slate-400">
                  Finding your adventures…
                </p>
              </div>
            ) : error ? (
              <div
                className="py-20 text-center text-rose-500 rounded-2xl"
                style={{
                  background: "#FFF1F2",
                  border: "1px solid rgba(244,63,94,0.15)",
                }}
              >
                <p className="text-lg font-bold mb-1">
                  Oops, something went wrong
                </p>
                <p className="text-sm opacity-70">{error}</p>
              </div>
            ) : tours.length === 0 ? (
              <div
                className="py-28 flex flex-col items-center text-center rounded-3xl"
                style={{
                  background: "#fff",
                  border: "1px dashed rgba(5,7,60,0.12)",
                }}
              >
                <div
                  className="w-20 h-20 flex items-center justify-center rounded-full mb-5 text-3xl"
                  style={{ background: "#FFF8F5" }}
                >
                  🗺️
                </div>
                <h3
                  className="text-xl font-black text-slate-800 mb-2"
                  style={{ fontFamily: "'Sora', sans-serif" }}
                >
                  No tours found
                </h3>
                <p className="text-slate-400 text-sm max-w-xs font-medium">
                  Try broadening your search or clearing some filters.
                </p>
                <ActionButton
                  variant="primary"
                  onClick={handleClear}
                  className="mt-6 !px-8"
                >
                  Clear filters
                </ActionButton>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {tours.map((tour) => {
                  const days = tour.tourItineraries?.length ?? 0;
                  const minP = getTourLowestTicketPrice(tour);
                  const loc =
                    [tour.city, tour.country].filter(Boolean).join(", ") ||
                    "Various Locations";
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
                            ? `${days} day${days > 1 ? "s" : ""}`
                            : "Flexible",
                        price: minP,
                        imageUrl:
                          tour.imageUrl ||
                          "",
                        tourStatus: tour.status,
                      }}
                    />
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {!isLoading && totalPages > 1 && (
              <Pagination
                page={page}
                totalPages={totalPages}
                onPage={(p) => upd({ page: p })}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile sidebar overlay ── */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-[92%] max-w-[380px] bg-white overflow-y-auto shadow-2xl">
            <Sidebar
              localSearch={localSearch}
              setLocalSearch={setLocalSearch}
              localCity={localCity}
              setLocalCity={setLocalCity}
              localStart={localStart}
              setLocalStart={setLocalStart}
              localEnd={localEnd}
              setLocalEnd={setLocalEnd}
              localMinPrice={localMinPrice}
              setLocalMinPrice={setLocalMinPrice}
              localMaxPrice={localMaxPrice}
              setLocalMaxPrice={setLocalMaxPrice}
              localDuration={localDuration}
              setLocalDuration={setLocalDuration}
              categoryId={categoryId}
              categories={categoriesList}
              submitText={submitText}
              submitDates={submitDates}
              submitPrice={submitPrice}
              submitDuration={submitDuration}
              upd={upd}
              onClear={handleClear}
            />
          </div>
        </div>
      )}
    </div>
  );
}
