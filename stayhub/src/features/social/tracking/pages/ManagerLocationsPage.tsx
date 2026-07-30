import React, { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Navigation, Compass, AlertCircle } from "lucide-react";
import { useTranslation } from "../../../../contexts/LocaleContext";
import { useToast } from "../../../../contexts/ToastContext";
import { tourScheduleService } from "../../../tour/services/tourSchedule.service";
import { ManagerScheduleMapFeed } from "../components/ManagerScheduleMapFeed";
import { DynamicText } from "../../../../components/DynamicText";
import { getStoredLocale } from "../../../../i18n";

export const ManagerLocationsPage: React.FC = () => {
  const { t } = useTranslation();
  const { error: showError } = useToast();
  const locale = getStoredLocale();

  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null);

  // Fetch all ongoing/upcoming schedules for the manager
  const {
    data: response,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["managerTrackingMapSchedules"],
    queryFn: () => {
      // Just fetch recent/ongoing ones. You can adjust pagination if needed.
      // We pass a large page size to get options for the dropdown.
      return tourScheduleService.getMySchedules(1, 1000);
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const schedules = useMemo(() => {
    if (!response?.data) {
      return [];
    }
    
    const now = new Date();
    // Relaxed date range: -7 days to +7 days to avoid timezone strictness hiding active tours
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 23, 59, 59, 999);

    const filtered = response.data
      .filter((s) => {
        const departure = new Date(s.departureDate);
        const returnD = new Date(s.returnDate);
        
        return departure.getTime() <= todayEnd.getTime() && returnD.getTime() >= todayStart.getTime();
      })
      .sort(
        (a, b) => new Date(a.departureDate).getTime() - new Date(b.departureDate).getTime()
      );

    // Removed Mock Data. Use only real schedules from the database.

    return filtered;
  }, [response]);

  useEffect(() => {
    if (error) {
      showError(
        (error as Error)?.message || t("social.trackingLoadSchedulesError", "Không thể tải danh sách chuyến đi.")
      );
    }
  }, [error, showError, t]);

  const selectedSchedule = useMemo(() => {
    return schedules.find(s => s.id === selectedScheduleId);
  }, [schedules, selectedScheduleId]);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] gap-4">
      {/* Top Bar for Schedule Selection */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {t("social.scheduleOnMap", "Schedule on Map")}
            </h2>
            <p className="text-sm text-slate-500 font-medium">
              {t("social.scheduleOnMapDesc", "Monitor the real-time location of Staff during schedules")}
            </p>
          </div>
        </div>

        <div className="flex-1 max-w-md">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MapPin className="h-5 w-5 text-slate-400" />
            </div>
            <select
              value={selectedScheduleId || ""}
              onChange={(e) => setSelectedScheduleId(e.target.value ? Number(e.target.value) : null)}
              className="block w-full pl-10 pr-10 py-3 text-base border-slate-200 focus:outline-none focus:ring-brand focus:border-brand sm:text-sm rounded-xl font-medium bg-slate-50 text-slate-700 shadow-inner appearance-none cursor-pointer"
              disabled={isLoading}
            >
              <option value="">
                {isLoading ? (t("common.loadingSchedules", "Loading schedules...")) : (t("social.selectScheduleToTrack", "--- Select a schedule to track ---"))}
              </option>
              {schedules.map((schedule) => (
                <option key={schedule.id} value={schedule.id}>
                  {schedule.tour?.name || (t("social.trackingUntitledTour", "Untitled Tour"))} ({new Date(schedule.departureDate).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US')})
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <Navigation className="h-4 w-4 text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 w-full bg-slate-100 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        {selectedScheduleId ? (
           <ManagerScheduleMapFeed scheduleId={selectedScheduleId} />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm z-10 text-center px-4">
             <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4 border-4 border-white shadow-lg">
                <MapPin className="w-8 h-8 text-slate-400" />
             </div>
             <h3 className="text-xl font-bold text-slate-800 mb-2">
                {t("social.noScheduleSelected", "No schedule selected")}
             </h3>
             <p className="text-slate-500 max-w-sm">
                {t("social.noScheduleSelectedDesc", "Please select a schedule from the dropdown above to view the map and staff locations.")}
             </p>
          </div>
        )}
      </div>
    </div>
  );
};
