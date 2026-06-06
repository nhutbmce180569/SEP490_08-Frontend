import React, { useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, Image as ImageIcon, MapPin, Search, Tag, X } from "lucide-react";
import type { TourismInformation } from "../types/tourismInformation";
import { useTranslation } from "../../../contexts/LocaleContext";

interface TourismInformationSelectorProps {
  items: TourismInformation[];
  value?: number | null;
  initialKeyword?: string;
  error?: string | null;
  onChange: (item: TourismInformation | null) => void;
}

const getAddressText = (item: TourismInformation) =>
  [item.address, item.city, item.country].filter(Boolean).join(", ");

export const TourismInformationSelector: React.FC<TourismInformationSelectorProps> = ({
  items,
  value,
  initialKeyword = "",
  error,
  onChange,
}) => {
  const { t } = useTranslation();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [keyword, setKeyword] = useState(initialKeyword);
  const [isOpen, setIsOpen] = useState(false);
  const selectedItem = items.find((item) => item.id === value) ?? null;

  useEffect(() => {
    if (!selectedItem) {
      setKeyword(initialKeyword);
    }
  }, [initialKeyword, selectedItem]);

  const filteredItems = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    if (!normalizedKeyword) return items;

    return items
      .filter((item) =>
        [item.name, item.type, item.address, item.city, item.country]
          .filter(Boolean)
          .some((text) => text!.toLowerCase().includes(normalizedKeyword)),
      );
  }, [items, keyword]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="flex flex-col gap-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={keyword}
          onFocus={() => setIsOpen(true)}
          onClick={() => setIsOpen(true)}
          onChange={(e) => {
            setKeyword(e.target.value);
            setIsOpen(true);
          }}
          placeholder={t("content.searchTourismSelectorPlaceholder")}
          className={`w-full rounded-xl border bg-slate-50 py-2.5 pl-10 pr-10 text-sm text-slate-700 outline-none transition-colors focus:border-brand focus:bg-white ${
            error ? "border-rose-500 bg-rose-50/30" : "border-slate-200"
          }`}
        />
        {(keyword || selectedItem) && (
          <button
            type="button"
            onClick={() => {
              setKeyword("");
              if (selectedItem) onChange(null);
              setIsOpen(false);
            }}
            className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label={t("content.clearTourismSelectorAria")}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {error && <span className="text-xs font-medium text-rose-500">{error}</span>}

      {isOpen && (
        <div className="max-h-52 overflow-y-auto rounded-xl border border-slate-100 bg-white p-1">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => {
              const isSelected = item.id === value;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onChange(item);
                    setKeyword("");
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                    isSelected ? "bg-indigo-50 text-indigo-700" : "hover:bg-slate-50"
                  }`}
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <Tag className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-slate-800">
                      {item.name}
                    </div>
                    <div className="mt-0.5 truncate text-xs font-medium text-slate-500">
                      {item.type} - {getAddressText(item) || `ID ${item.id}`}
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="px-3 py-4 text-center text-sm font-medium text-slate-400">
              {t("content.noTourismSelectorResults")}
            </div>
          )}
        </div>
      )}

      {selectedItem && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="grid gap-0 sm:grid-cols-[180px_1fr]">
            <div className="flex min-h-36 items-center justify-center bg-slate-100">
              {selectedItem.imageUrl ? (
                <img
                  src={selectedItem.imageUrl}
                  alt={selectedItem.name}
                  className="h-full min-h-36 w-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <ImageIcon className="h-8 w-8" />
                  <span className="text-xs font-medium">{t("content.noImage")}</span>
                </div>
              )}
            </div>

            <div className="space-y-3 p-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">{selectedItem.name}</h4>
                  <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-600">
                    {selectedItem.type}
                  </span>
                </div>
                {selectedItem.description && (
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    {selectedItem.description}
                  </p>
                )}
              </div>

              {getAddressText(selectedItem) && (
                <div className="flex items-start gap-2 text-xs font-medium text-slate-600">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  <span>{getAddressText(selectedItem)}</span>
                </div>
              )}

              {(selectedItem.latitude || selectedItem.longitude) && (
                <div className="text-xs font-medium text-slate-400">
                  {t("content.latLngLabel", {
                    lat: selectedItem.latitude ?? "N/A",
                    lng: selectedItem.longitude ?? "N/A",
                  })}
                </div>
              )}

              {selectedItem.sourceUrl && (
                <a
                  href={selectedItem.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:text-brand-hover"
                >
                  {selectedItem.sourceName || t("content.source")}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
