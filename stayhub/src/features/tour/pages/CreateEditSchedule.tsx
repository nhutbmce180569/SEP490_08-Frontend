import React, { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, X, Map, Calendar, ChevronDown, Search, Clock } from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import { tourScheduleService } from "../services/tourSchedule.service";
import { tourService } from "../services/tour.service";
import type { TourBasic } from "../types/tour";
import type {
  CreateTourScheduleRequest,
  UpdateTourScheduleRequest,
  TourSchedule,
} from "../types/tourSchedule";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { LoadingOverlay } from "../../../components/dashboard/LoadingOverlay";
import { useTranslation } from "../../../contexts/LocaleContext";

// Hàm hỗ trợ format date từ API sang định dạng YYYY-MM-DDThh:mm
const formatDateTimeLocal = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Hàm hỗ trợ tách chuỗi YYYY-MM-DDThh:mm thành Date và Time riêng biệt cho UI
const getSplitDateTime = (isoString?: string) => {
  if (!isoString) return { date: "", time: "" };
  const parts = isoString.split("T");
  return {
    date: parts[0] || "",
    time: parts[1] ? parts[1].substring(0, 5) : "", // Chỉ lấy hh:mm
  };
};

export const CreateEditSchedule: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { success: showSuccess, error: showError } = useToast();

  const [tours, setTours] = useState<TourBasic[]>([]);
  const [form, setForm] = useState<Partial<CreateTourScheduleRequest>>({
    tourId: undefined,
    departureDate: "",
    returnDate: "",
    note: "",
  });
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // --- STATE CHO COMBOBOX TÌM KIẾM TOUR ---
  const [tourSearch, setTourSearch] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredTours = useMemo(() => {
    if (!tourSearch.trim()) return tours;
    return tours.filter((t) =>
      t.name.toLowerCase().includes(tourSearch.toLowerCase())
    );
  }, [tours, tourSearch]);

  const selectedTour = useMemo(
    () => tours.find((t) => t.id === form.tourId),
    [tours, form.tourId]
  );

  useEffect(() => {
    if (!isDropdownOpen) {
      setTourSearch(selectedTour?.name || "");
    }
  }, [isDropdownOpen, selectedTour]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  // ----------------------------------------------

  useEffect(() => {
    const loadTours = async () => {
      try {
        const data = await tourService.getAllToursForDropdown();
        setTours(data || []);
      } catch (err: any) {
        showError(err?.response?.data?.message || t("tour.failedLoadTours"));
      }
    };
    loadTours();
  }, [showError, t]);

  useEffect(() => {
    if (!isEdit) return;
    const load = async () => {
      setLoading(true);
      try {
        const data: TourSchedule = await tourScheduleService.getScheduleById(id as string);
        setForm({
          tourId: data.tourId,
          departureDate: formatDateTimeLocal(data.departureDate),
          returnDate: formatDateTimeLocal(data.returnDate),
          note: data.note ?? "",
        });
      } catch (err: any) {
        showError(err?.response?.data?.message || t("tour.failedLoadSchedule"));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isEdit, showError, t]);

  const handleChange = (field: string, value: any) => {
    setForm((f) => ({ ...f, [field]: value }));
    setFormError(null);
  };

  const handleDateTimeUpdate = (field: "departureDate" | "returnDate", type: "date" | "time", value: string) => {
    let currentVal = form[field] || "";
    let [datePart, timePart] = currentVal.split("T");

    if (type === "date") {
      datePart = value;
      if (!timePart) timePart = "08:00";
    } else {
      timePart = value;
      if (!datePart || datePart === "undefined") {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, "0");
        const dd = String(today.getDate()).padStart(2, "0");
        datePart = `${yyyy}-${mm}-${dd}`;
      }
    }

    handleChange(field, `${datePart}T${timePart}`);
  };

  const validateDates = (dep: string, ret: string) => {
    const now = new Date();
    const d = new Date(dep);
    const r = new Date(ret);

    if (d < now) {
      setFormError(t("tour.departurePastError"));
      return false;
    }
    if (r <= d) {
      setFormError(t("tour.returnAfterDepartureError"));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tourId = Number(form.tourId);

    const dep = form.departureDate ? new Date(form.departureDate).toISOString() : "";
    const ret = form.returnDate ? new Date(form.returnDate).toISOString() : "";

    if (!tourId) return setFormError(t("tour.chooseTourError"));
    if (!form.departureDate || !form.returnDate)
      return setFormError(t("tour.fillBothDatesError"));
    if (!validateDates(form.departureDate, form.returnDate)) return;

    setLoading(true);
    setFormError(null);
    try {
      if (isEdit) {
        const payload: UpdateTourScheduleRequest = {
          tourId,
          departureDate: dep,
          returnDate: ret,
          note: form.note ?? null,
        };
        await tourScheduleService.updateSchedule(id as string, payload);
        showSuccess(t("tour.scheduleUpdated"));
      } else {
        const payload: CreateTourScheduleRequest = {
          tourId,
          departureDate: dep,
          returnDate: ret,
          note: form.note ?? null,
        };
        await tourScheduleService.createSchedule(payload);
        showSuccess(t("tour.scheduleCreated"));
      }
      navigate(-1);
    } catch (err: any) {
      setFormError(err?.response?.data?.message || t("tour.failedSaveSchedule"));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const depSplit = getSplitDateTime(form.departureDate);
  const retSplit = getSplitDateTime(form.returnDate);

  return (
    <div className="mx-auto max-w-3xl py-6">
      <button
        type="button"
        onClick={handleCancel}
        className="mb-6 flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("tour.backToSchedules")}
      </button>

      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {isEdit ? t("tour.editScheduleTitle") : t("tour.createSchedule")}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {isEdit ? t("tour.updateScheduleFormDesc") : t("tour.createScheduleFormDesc")}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <ActionButton type="button" variant="secondary" onClick={handleCancel} className="gap-2 px-4 py-2 text-sm">
              <X className="h-4 w-4" />
              {t("common.cancel")}
            </ActionButton>
            <ActionButton type="submit" variant="primary" disabled={loading} className="gap-2 px-4 py-2 text-sm">
              <Save className="h-4 w-4" />
              {isEdit ? t("tour.updateSchedule") : t("tour.saveSchedule")}
            </ActionButton>
          </div>
        </div>

        <div className="space-y-6 p-6 bg-slate-50/30">
          {formError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
              {formError}
            </div>
          )}

          {/* TRƯỜNG CHỌN TOUR */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <label className="mb-3 block text-sm font-bold text-slate-700">
              {t("tour.tour")} <span className="text-rose-500">*</span>
            </label>
            <div className="relative" ref={dropdownRef}>
              <Map className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 z-10" />
              <input
                type="text"
                value={tourSearch}
                onChange={(e) => {
                  setTourSearch(e.target.value);
                  if (!isDropdownOpen) setIsDropdownOpen(true);
                  if (e.target.value === "") handleChange("tourId", undefined);
                }}
                onClick={() => setIsDropdownOpen(true)}
                placeholder={t("tour.selectTour") || "Search and select a tour..."}
                disabled={loading}
                className="w-full cursor-text rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-10 text-sm text-slate-700 outline-none transition-all focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10 disabled:cursor-not-allowed disabled:opacity-70"
              />
              <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />

              {isDropdownOpen && (
                <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg py-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
                  {filteredTours.length > 0 ? (
                    filteredTours.map((tourItem) => (
                      <button
                        key={tourItem.id}
                        type="button"
                        onClick={() => {
                          handleChange("tourId", tourItem.id);
                          setTourSearch(tourItem.name);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-3 text-left text-sm transition-colors hover:bg-slate-50 ${
                          form.tourId === tourItem.id
                            ? "bg-blue-50/50 font-semibold text-brand"
                            : "text-slate-700"
                        }`}
                      >
                        {tourItem.name}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 flex items-center justify-center gap-2 text-sm text-slate-500">
                      <Search className="w-4 h-4" />
                      Không tìm thấy Tour nào
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* NHÓM NGÀY GIỜ */}
          <div className="grid gap-6 sm:grid-cols-2">
            {/* THỜI GIAN KHỞI HÀNH */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <label className="mb-4 block text-sm font-bold text-slate-700">
                {t("tour.departureDate")} <span className="text-rose-500">*</span>
              </label>
              
              <div className="flex flex-col gap-3 lg:flex-row">
                {/* Khối chọn Ngày */}
                <div className="flex flex-1 items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 transition-all focus-within:border-brand focus-within:bg-white focus-within:ring-2 focus-within:ring-brand/20 hover:border-brand/50">
                  <div className="flex items-center justify-center pl-3 pr-2 border-r border-slate-200">
                    <Calendar className="h-4 w-4 text-brand" />
                  </div>
                  <input
                    type="date"
                    value={depSplit.date}
                    onChange={(e) => handleDateTimeUpdate("departureDate", "date", e.target.value)}
                    onClick={(e) => e.currentTarget.showPicker?.()}
                    disabled={loading}
                    className="w-full cursor-pointer bg-transparent px-3 py-2.5 text-sm text-slate-700 outline-none [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  />
                </div>
                
                {/* Khối chọn Giờ */}
                <div className="flex w-full shrink-0 items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 transition-all focus-within:border-brand focus-within:bg-white focus-within:ring-2 focus-within:ring-brand/20 hover:border-brand/50 lg:w-[140px]">
                  <div className="flex items-center justify-center pl-3 pr-2 border-r border-slate-200">
                    <Clock className="h-4 w-4 text-amber-500" />
                  </div>
                  <input
                    type="time"
                    value={depSplit.time}
                    onChange={(e) => handleDateTimeUpdate("departureDate", "time", e.target.value)}
                    onClick={(e) => e.currentTarget.showPicker?.()}
                    disabled={loading}
                    className="w-full cursor-pointer bg-transparent px-3 py-2.5 text-sm text-slate-700 outline-none [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* THỜI GIAN TRỞ VỀ */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <label className="mb-4 block text-sm font-bold text-slate-700">
                {t("tour.returnDate")} <span className="text-rose-500">*</span>
              </label>
              
              <div className="flex flex-col gap-3 lg:flex-row">
                {/* Khối chọn Ngày */}
                <div className="flex flex-1 items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 transition-all focus-within:border-brand focus-within:bg-white focus-within:ring-2 focus-within:ring-brand/20 hover:border-brand/50">
                  <div className="flex items-center justify-center pl-3 pr-2 border-r border-slate-200">
                    <Calendar className="h-4 w-4 text-brand" />
                  </div>
                  <input
                    type="date"
                    value={retSplit.date}
                    onChange={(e) => handleDateTimeUpdate("returnDate", "date", e.target.value)}
                    onClick={(e) => e.currentTarget.showPicker?.()}
                    disabled={loading}
                    className="w-full cursor-pointer bg-transparent px-3 py-2.5 text-sm text-slate-700 outline-none [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  />
                </div>
                
                {/* Khối chọn Giờ */}
                <div className="flex w-full shrink-0 items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 transition-all focus-within:border-brand focus-within:bg-white focus-within:ring-2 focus-within:ring-brand/20 hover:border-brand/50 lg:w-[140px]">
                  <div className="flex items-center justify-center pl-3 pr-2 border-r border-slate-200">
                    <Clock className="h-4 w-4 text-amber-500" />
                  </div>
                  <input
                    type="time"
                    value={retSplit.time}
                    onChange={(e) => handleDateTimeUpdate("returnDate", "time", e.target.value)}
                    onClick={(e) => e.currentTarget.showPicker?.()}
                    disabled={loading}
                    className="w-full cursor-pointer bg-transparent px-3 py-2.5 text-sm text-slate-700 outline-none [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <label className="mb-3 block text-sm font-bold text-slate-700">
              {t("tour.note")}
            </label>
            <textarea
              value={form.note ?? ""}
              onChange={(e) => handleChange("note", e.target.value)}
              rows={4}
              disabled={loading}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition-all focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10"
              placeholder={t("tour.scheduleNotePlaceholder") || "Enter any additional notes..."}
            />
          </div>
        </div>
      </form>

      <LoadingOverlay
        isOpen={loading}
        message={isEdit ? t("tour.updatingSchedule") : t("tour.creatingSchedule")}
      />
    </div>
  );
};

export default CreateEditSchedule;