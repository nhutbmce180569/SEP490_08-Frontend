import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, X, Map, Calendar } from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import { tourScheduleService } from "../services/tourSchedule.service";
import { tourService } from "../services/tour.service";
import type { TourBasic } from "../types/tour";
import type { CreateTourScheduleRequest, UpdateTourScheduleRequest, TourSchedule } from "../types/tourSchedule";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { LoadingOverlay } from "../../../components/dashboard/LoadingOverlay";
import { useTranslation } from "../../../contexts/LocaleContext";

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

  useEffect(() => {
    const loadTours = async () => {
      try {
        const data = await tourService.getAllTours();
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
          departureDate: data.departureDate.slice(0, 10),
          returnDate: data.returnDate.slice(0, 10),
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

  const validateDates = (dep: string, ret: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(dep);
    const r = new Date(ret);
    d.setHours(0, 0, 0, 0);
    r.setHours(0, 0, 0, 0);
    if (d < today) {
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
    const dep = form.departureDate || "";
    const ret = form.returnDate || "";

    if (!tourId) return setFormError(t("tour.chooseTourError"));
    if (!dep || !ret) return setFormError(t("tour.fillBothDatesError"));
    if (!validateDates(dep, ret)) return;

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
            <ActionButton
              type="button"
              variant="secondary"
              onClick={handleCancel}
              className="gap-2 px-4 py-2 text-sm"
            >
              <X className="h-4 w-4" />
              {t("common.cancel")}
            </ActionButton>
            <ActionButton
              type="submit"
              variant="primary"
              disabled={loading}
              className="gap-2 px-4 py-2 text-sm"
            >
              <Save className="h-4 w-4" />
              {isEdit ? t("tour.updateSchedule") : t("tour.saveSchedule")}
            </ActionButton>
          </div>
        </div>

        <div className="space-y-6 p-6">
          {formError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
              {formError}
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              {t("tour.tour")} <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Map className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                value={form.tourId ?? ""}
                onChange={(e) => handleChange("tourId", Number(e.target.value))}
                disabled={loading}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition-colors focus:border-brand focus:bg-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                <option value="">{t("tour.selectTour")}</option>
                {tours.map((tourItem) => (
                  <option key={tourItem.id} value={tourItem.id}>
                    {tourItem.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                {t("tour.departureDate")} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={form.departureDate ?? ""}
                  onChange={(e) => handleChange("departureDate", e.target.value)}
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition-colors focus:border-brand focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                {t("tour.returnDate")} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={form.returnDate ?? ""}
                  onChange={(e) => handleChange("returnDate", e.target.value)}
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition-colors focus:border-brand focus:bg-white"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              {t("tour.note")}
            </label>
            <textarea
              value={form.note ?? ""}
              onChange={(e) => handleChange("note", e.target.value)}
              rows={3}
              disabled={loading}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition-colors focus:border-brand focus:bg-white"
              placeholder={t("tour.scheduleNotePlaceholder")}
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
