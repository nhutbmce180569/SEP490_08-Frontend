import React, { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Map, Calendar, ChevronDown, Search, Clock, FileText } from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import { tourScheduleService } from "../services/tourSchedule.service";
import { tourService } from "../services/tour.service";
import type { TourBasic } from "../types/tour";
import type { CreateTourScheduleRequest, UpdateTourScheduleRequest, TourSchedule } from "../types/tourSchedule";
import { DynamicForm, type FormField } from "../../../components/dashboard/DynamicForm";
import { LoadingOverlay } from "../../../components/dashboard/LoadingOverlay";
import { useTranslation } from "../../../contexts/LocaleContext";

// --- HELPERS ---
const formatDateTimeLocal = (dateString?: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const getSplitDateTime = (isoString?: string) => {
  if (!isoString) return { date: "", time: "" };
  const parts = isoString.split("T");
  return {
    date: parts[0] || "",
    time: parts[1] ? parts[1].substring(0, 5) : "",
  };
};

// --- CUSTOM FIELDS CHO DYNAMIC FORM ---

const TourSelectField: React.FC<{
  value: any;
  onChange: (val: any) => void;
  tours: TourBasic[];
  error?: string;
  disabled?: boolean;
  t: any;
}> = ({ value, onChange, tours, error, disabled, t }) => {
  const [tourSearch, setTourSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedTour = useMemo(() => tours.find((t) => t.id === value), [tours, value]);

  useEffect(() => {
    if (!isOpen) {
      setTourSearch(selectedTour?.name || "");
    }
  }, [isOpen, selectedTour]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredTours = useMemo(() => {
    if (!tourSearch.trim()) return tours;
    return tours.filter((tItem) =>
      tItem.name.toLowerCase().includes(tourSearch.toLowerCase())
    );
  }, [tours, tourSearch]);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative" ref={dropdownRef}>
        <Map className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 z-10" />
        <input
          type="text"
          value={tourSearch}
          onChange={(e) => {
            setTourSearch(e.target.value);
            if (!isOpen) setIsOpen(true);
            if (e.target.value === "") onChange(undefined);
          }}
          onClick={() => !disabled && setIsOpen(true)}
          placeholder={t("tour.selectTour") || "Search and select a tour..."}
          disabled={disabled}
          className={`w-full cursor-text rounded-xl border py-2.5 pl-10 pr-10 text-sm text-slate-700 outline-none transition-all focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10 disabled:cursor-not-allowed disabled:opacity-70 ${
            error ? "border-rose-500 bg-rose-50/30" : "border-slate-200 bg-slate-50"
          }`}
        />
        <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />

        {isOpen && (
          <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg py-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
            {filteredTours.length > 0 ? (
              filteredTours.map((tourItem) => (
                <button
                  key={tourItem.id}
                  type="button"
                  onClick={() => {
                    onChange(tourItem.id);
                    setTourSearch(tourItem.name);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-3 text-left text-sm transition-colors hover:bg-slate-50 ${
                    value === tourItem.id
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
      {error && <span className="text-xs font-medium text-rose-500">{error}</span>}
    </div>
  );
};

const DateTimeSelectField: React.FC<{
  value: any;
  onChange: (val: any) => void;
  error?: string;
  disabled?: boolean;
}> = ({ value, onChange, error, disabled }) => {
  const split = getSplitDateTime(value);

  const handleUpdate = (part: "date" | "time", partValue: string) => {
    let datePart = split.date;
    let timePart = split.time;

    if (part === "date") {
      datePart = partValue;
      if (!timePart) timePart = "08:00";
    } else {
      timePart = partValue;
      if (!datePart) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, "0");
        const dd = String(today.getDate()).padStart(2, "0");
        datePart = `${yyyy}-${mm}-${dd}`;
      }
    }
    onChange(`${datePart}T${timePart}`);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-col gap-3 lg:flex-row">
        {/* Date Input */}
        <div className={`flex flex-1 items-center overflow-hidden rounded-xl border transition-all focus-within:border-brand focus-within:bg-white focus-within:ring-2 focus-within:ring-brand/20 hover:border-brand/50 ${
          error ? "border-rose-500 bg-rose-50/30" : "border-slate-200 bg-slate-50"
        }`}>
          <div className="flex items-center justify-center pl-3 pr-2 border-r border-slate-200">
            <Calendar className="h-4 w-4 text-brand" />
          </div>
          <input
            type="date"
            value={split.date}
            onChange={(e) => handleUpdate("date", e.target.value)}
            onClick={(e) => e.currentTarget.showPicker?.()}
            disabled={disabled}
            className="w-full cursor-pointer bg-transparent px-3 py-2.5 text-sm text-slate-700 outline-none [&::-webkit-calendar-picker-indicator]:cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
          />
        </div>

        {/* Time Input */}
        <div className={`flex w-full shrink-0 items-center overflow-hidden rounded-xl border transition-all focus-within:border-brand focus-within:bg-white focus-within:ring-2 focus-within:ring-brand/20 hover:border-brand/50 lg:w-[140px] ${
          error ? "border-rose-500 bg-rose-50/30" : "border-slate-200 bg-slate-50"
        }`}>
          <div className="flex items-center justify-center pl-3 pr-2 border-r border-slate-200">
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <input
            type="time"
            value={split.time}
            onChange={(e) => handleUpdate("time", e.target.value)}
            onClick={(e) => e.currentTarget.showPicker?.()}
            disabled={disabled}
            className="w-full cursor-pointer bg-transparent px-3 py-2.5 text-sm text-slate-700 outline-none [&::-webkit-calendar-picker-indicator]:cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
          />
        </div>
      </div>
      {error && <span className="text-xs font-medium text-rose-500">{error}</span>}
    </div>
  );
};

// --- MAIN COMPONENT ---

export const CreateEditSchedule: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { success: showSuccess, error: showError } = useToast();

  const [tours, setTours] = useState<TourBasic[]>([]);
  const [initialValues, setInitialValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(isEdit);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const tourDurationRef = useRef<number>(1);

  const calculateReturnDate = (depDateStr: string, duration: number) => {
    const dep = new Date(depDateStr);
    if (isNaN(dep.getTime())) return "";

    const ret = new Date(dep);
    ret.setDate(ret.getDate() + duration);

    const yyyy = ret.getFullYear();
    const mm = String(ret.getMonth() + 1).padStart(2, "0");
    const dd = String(ret.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}T17:00`;
  };

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

        // ✅ FIX: Fetch tour detail để lấy đúng duration cho edit mode
        // Không dùng ref mặc định = 1, phải lấy từ tour thật
        try {
          const tour = await tourService.getTourById(data.tourId);
          const itis = tour.tourItineraries || [];
          const maxDay = itis.length > 0
            ? Math.max(...itis.map((i: any) => Number(i.dayNumber)))
            : 1;
          tourDurationRef.current = maxDay; // ✅ Ref được set đúng trước khi form render
        } catch {
          // Nếu fetch tour thất bại thì giữ nguyên duration = 1, không crash form
        }

        setInitialValues({
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

  const handleSubmit = async (formData: Record<string, any>) => {
    const dep = formData.departureDate ? new Date(formData.departureDate).toISOString() : "";
    const ret = formData.returnDate ? new Date(formData.returnDate).toISOString() : "";

    const now = new Date();
    const d = new Date(dep);
    const r = new Date(ret);

    let hasError = false;
    const newServerErrors: Record<string, string> = {};

    if (d < now) {
      newServerErrors.departureDate = t("tour.departurePastError");
      hasError = true;
    }
    if (r <= d) {
      newServerErrors.returnDate = t("tour.returnAfterDepartureError");
      hasError = true;
    }

    if (hasError) {
      setServerErrors(newServerErrors);
      return;
    }

    setIsSubmitting(true);
    setServerErrors({});

    try {
      if (isEdit) {
        const payload: UpdateTourScheduleRequest = {
          tourId: Number(formData.tourId),
          departureDate: dep,
          returnDate: ret,
          note: formData.note ?? null,
        };
        await tourScheduleService.updateSchedule(id as string, payload);
        showSuccess(t("tour.scheduleUpdated"));
      } else {
        const payload: CreateTourScheduleRequest = {
          tourId: Number(formData.tourId),
          departureDate: dep,
          returnDate: ret,
          note: formData.note ?? null,
        };
        await tourScheduleService.createSchedule(payload);
        showSuccess(t("tour.scheduleCreated"));
      }
      navigate(-1);
    } catch (err: any) {
      const msg = err?.response?.data?.message || t("tour.failedSaveSchedule");
      showError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const scheduleFields: FormField[] = [
    {
      name: "tourId",
      label: t("tour.tour"),
      type: "custom",
      colSpan: 2,
      required: true,
      render: (value, onChange, error, setFormData) => (
        <TourSelectField
          value={value}
          onChange={(newTourId) => {
            onChange(newTourId);
            if (newTourId) {
              // ✅ Khi đổi tour (cả Create lẫn Edit), luôn fetch lại duration mới
              tourService.getTourById(newTourId).then((tour) => {
                const itis = tour.tourItineraries || [];
                const maxDay =
                  itis.length > 0
                    ? Math.max(...itis.map((i: any) => Number(i.dayNumber)))
                    : 1;
                tourDurationRef.current = maxDay;

                if (setFormData) {
                  setFormData((prev) => {
                    if (!prev.departureDate) return prev;
                    return {
                      ...prev,
                      returnDate: calculateReturnDate(prev.departureDate, maxDay),
                    };
                  });
                }
              });
            }
          }}
          error={error}
          tours={tours}
          disabled={isSubmitting}
          t={t}
        />
      ),
    },
    {
      name: "departureDate",
      label: t("tour.departureDate"),
      type: "custom",
      required: true,
      render: (value, onChange, error, setFormData) => (
        <DateTimeSelectField
          value={value}
          onChange={(newDepVal) => {
            onChange(newDepVal);
            // ✅ Dùng ref đã được set đúng — hoạt động cho cả Create và Edit
            if (newDepVal && setFormData) {
              const maxDay = tourDurationRef.current;
              setFormData((prev) => ({
                ...prev,
                returnDate: calculateReturnDate(newDepVal, maxDay),
              }));
            }
          }}
          error={error}
          disabled={isSubmitting}
        />
      ),
    },
    {
      name: "returnDate",
      label: t("tour.returnDate"),
      type: "custom",
      required: true,
      validate: (value) => (!value ? t("tour.fillBothDatesError") : undefined),
      render: (value, onChange, error) => (
        <DateTimeSelectField
          value={value}
          onChange={onChange}
          error={error}
          disabled={isSubmitting}
        />
      ),
    },
    {
      name: "note",
      label: t("tour.note"),
      type: "textarea",
      colSpan: 2,
      placeholder: t("tour.scheduleNotePlaceholder") || "Enter any additional notes...",
      icon: <FileText className="h-4 w-4" />,
    },
  ];

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center text-slate-500">
        {t("common.loading") || "Đang tải dữ liệu..."}
      </div>
    );
  }

  return (
    <>
      <DynamicForm
        title={isEdit ? t("tour.editScheduleTitle") : t("tour.createSchedule")}
        description={
          isEdit ? t("tour.updateScheduleFormDesc") : t("tour.createScheduleFormDesc")
        }
        fields={scheduleFields}
        onSubmit={handleSubmit}
        serverErrors={serverErrors}
        onCancel={() => navigate(-1)}
        initialValues={initialValues}
        submitText={isEdit ? t("tour.updateSchedule") : t("tour.saveSchedule")}
        cancelText={t("common.cancel")}
      />
      <LoadingOverlay
        isOpen={isSubmitting}
        message={isEdit ? t("tour.updatingSchedule") : t("tour.creatingSchedule")}
      />
    </>
  );
};

export default CreateEditSchedule;