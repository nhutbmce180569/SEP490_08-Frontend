import React, { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Map, ChevronDown, Search, FileText } from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import { tourScheduleService } from "../services/tourSchedule.service";
import { tourService } from "../services/tour.service";
import type { TourBasic } from "../types/tour";
import type {
  CreateTourScheduleRequest,
  UpdateTourScheduleRequest,
  TourSchedule,
} from "../types/tourSchedule";
import {
  DynamicForm,
  type FormField,
} from "../../../components/dashboard/DynamicForm";
import { LoadingOverlay } from "../../../components/dashboard/LoadingOverlay";
import { useTranslation } from "../../../contexts/LocaleContext";

// --- HELPERS ---

// Chuyển ISO string → "yyyy-MM-ddTHH:mm" để input datetime-local hiểu
const toDateTimeLocal = (dateString?: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
};

// --- CUSTOM FIELDS ---

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

  const selectedTour = useMemo(
    () => tours.find((t) => t.id === value),
    [tours, value],
  );

  useEffect(() => {
    if (!isOpen) setTourSearch(selectedTour?.name || "");
  }, [isOpen, selectedTour]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      )
        setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredTours = useMemo(() => {
    if (!tourSearch.trim()) return tours;
    return tours.filter((t) =>
      t.name.toLowerCase().includes(tourSearch.toLowerCase()),
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
            error
              ? "border-rose-500 bg-rose-50/30"
              : "border-slate-200 bg-slate-50"
          }`}
        />
        <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />

        {isOpen && (
          <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg py-1">
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
                {t("tour.noToursFound") || "No tours found"}
              </div>
            )}
          </div>
        )}
      </div>
      {error && (
        <span className="text-xs font-medium text-rose-500">{error}</span>
      )}
    </div>
  );
};

// ✅ Input datetime-local đơn giản — 1 ô duy nhất cho cả ngày lẫn giờ
const DateTimeField: React.FC<{
  value: any;
  onChange: (val: any) => void;
  error?: string;
  disabled?: boolean;
}> = ({ value, onChange, error, disabled }) => {
  return (
    <div className="flex flex-col gap-1.5">
      <input
        type="datetime-local"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        onClick={(e) => e.currentTarget.showPicker?.()}
        disabled={disabled}
        className={`w-full rounded-xl border px-4 py-2.5 text-sm text-slate-700 outline-none transition-all cursor-pointer
          focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10
          disabled:cursor-not-allowed disabled:opacity-70
          [&::-webkit-calendar-picker-indicator]:cursor-pointer
          [&::-webkit-calendar-picker-indicator]:opacity-60
          [&::-webkit-calendar-picker-indicator]:hover:opacity-100
          ${error ? "border-rose-500 bg-rose-50/30" : "border-slate-200 bg-slate-50"}`}
      />
      {error && (
        <span className="text-xs font-medium text-rose-500">{error}</span>
      )}
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

  // Tính returnDate = departureDate + số ngày tour
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

  // Load danh sách tour cho dropdown
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

  // Load dữ liệu cũ khi Edit
  useEffect(() => {
    if (!isEdit) return;
    const load = async () => {
      setLoading(true);
      try {
        const data: TourSchedule = await tourScheduleService.getScheduleById(
          id as string,
        );

        try {
          const tour = await tourService.getTourById(data.tourId);
          const itis = tour.tourItineraries || [];
          const maxDay =
            itis.length > 0
              ? Math.max(...itis.map((i: any) => Number(i.dayNumber)))
              : 1;
          tourDurationRef.current = maxDay;
        } catch {
          // giữ nguyên default = 1 nếu fetch thất bại
        }

        setInitialValues({
          tourId: data.tourId,
          departureDate: toDateTimeLocal(data.departureDate),
          returnDate: toDateTimeLocal(data.returnDate),
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
    const dep = formData.departureDate
      ? new Date(formData.departureDate).toISOString()
      : "";
    const ret = formData.returnDate
      ? new Date(formData.returnDate).toISOString()
      : "";

    const now = new Date();
    const d = new Date(dep);
    const r = new Date(ret);

    const newServerErrors: Record<string, string> = {};
    if (d < now) newServerErrors.departureDate = t("tour.departurePastError");
    if (r <= d)
      newServerErrors.returnDate = t("tour.returnAfterDepartureError");

    if (Object.keys(newServerErrors).length > 0) {
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
      showError(err?.response?.data?.message || t("tour.failedSaveSchedule"));
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
                      returnDate: calculateReturnDate(
                        prev.departureDate,
                        maxDay,
                      ),
                    };
                  });
                }
              });
            }
          }}
          error={error}
          tours={tours}
          disabled={isSubmitting || isEdit}
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
        <DateTimeField
          value={value}
          onChange={(newVal) => {
            onChange(newVal);
            if (newVal && setFormData) {
              setFormData((prev) => ({
                ...prev,
                returnDate: calculateReturnDate(
                  newVal,
                  tourDurationRef.current,
                ),
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
        <DateTimeField
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
      placeholder:
        t("tour.scheduleNotePlaceholder") || "Enter any additional notes...",
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
          isEdit
            ? t("tour.updateScheduleFormDesc")
            : t("tour.createScheduleFormDesc")
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
        message={
          isEdit ? t("tour.updatingSchedule") : t("tour.creatingSchedule")
        }
      />
    </>
  );
};

export default CreateEditSchedule;
