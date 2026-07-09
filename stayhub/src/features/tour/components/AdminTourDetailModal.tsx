import React, { useState } from "react";
import { X, MapPin, Navigation, Star } from "lucide-react";
import { useTranslation } from "../../../contexts/LocaleContext";
import { type Tour } from "../types/tour";
import { ManagerCell } from "./ManagerCell";

interface AdminTourDetailModalProps {
  tour: Tour | null;
  onClose: () => void;
  categoryName?: string;
}

export const AdminTourDetailModal: React.FC<AdminTourDetailModalProps> = ({
  tour,
  onClose,
  categoryName,
}) => {
  const { t } = useTranslation();
  const [showFullDesc, setShowFullDesc] = useState(false);

  if (!tour) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-xl font-bold text-slate-800">
            {t("tour.tourDetails")}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6 overflow-y-auto">
          {/* Main Info */}
          <div className="flex flex-col sm:flex-row gap-5">
            {tour.imageUrl ? (
              <img
                src={tour.imageUrl}
                alt={tour.name}
                className="h-32 w-32 sm:h-40 sm:w-40 rounded-xl object-cover border border-slate-100 shadow-sm"
              />
            ) : (
              <div className="flex h-32 w-32 sm:h-40 sm:w-40 items-center justify-center rounded-xl bg-slate-100 text-slate-400 border border-slate-200 shadow-sm">
                <span className="text-sm font-medium">{t("tour.noImg")}</span>
              </div>
            )}
            
            <div className="flex flex-col flex-1">
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-lg font-bold text-slate-900 leading-tight">
                  {tour.name}
                </h3>
                <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 shrink-0">
                  ID: {tour.id}
                </span>
              </div>
              
              <div className="mt-3 flex flex-wrap gap-y-2 gap-x-4">
                {categoryName && (
                  <div className="flex items-center gap-1.5 text-sm text-slate-600">
                    <Navigation className="h-4 w-4 text-brand" />
                    <span className="font-medium">{categoryName}</span>
                  </div>
                )}
                
                {(tour.city || tour.country) && (
                  <div className="flex items-center gap-1.5 text-sm text-slate-600">
                    <MapPin className="h-4 w-4 text-brand" />
                    <span>{[tour.city, tour.country].filter(Boolean).join(", ")}</span>
                  </div>
                )}
              </div>
              
              <div className="mt-4 flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(tour.averageStar || 0)
                          ? "fill-amber-400 text-amber-400"
                          : i < (tour.averageStar || 0)
                            ? "fill-amber-200 text-amber-400"
                            : "text-slate-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-semibold text-slate-700">
                  {(tour.averageStar || 0) > 0 ? (tour.averageStar || 0).toFixed(1) : t("tour.noRatings")}
                </span>
              </div>
              
            </div>
          </div>

          {/* Description */}
          <div className="border-t border-slate-100 pt-5">
            <h4 className="text-sm font-bold text-slate-800 mb-2">{t("tour.overview")}</h4>
            {tour.description ? (
              <div className="flex flex-col items-start">
                <div 
                  className={`text-sm text-slate-600 whitespace-pre-wrap leading-relaxed prose prose-sm max-w-none ${!showFullDesc ? "line-clamp-4 overflow-hidden" : ""}`}
                  dangerouslySetInnerHTML={{ __html: tour.description.replace(/&nbsp;/g, ' ') }} 
                />
                {tour.description.replace(/<[^>]+>/g, '').length > 200 && (
                  <button 
                    onClick={() => setShowFullDesc(!showFullDesc)} 
                    className="text-brand text-sm font-medium hover:underline mt-1"
                  >
                    {showFullDesc ? t("tour.showLess") : t("tour.showMore")}
                  </button>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-600">{t("tour.noDescription")}</p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-5">
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
               <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Status</h5>
               <p className="text-sm font-semibold text-slate-800">{tour.status || t("tour.draft")}</p>
            </div>
             <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
               <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t("tour.createdBy")}</h5>
               <ManagerCell userId={tour.createdBy} fallbackName={tour.createdByName} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
