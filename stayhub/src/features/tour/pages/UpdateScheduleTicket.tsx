import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Banknote, Save, Ticket, Users, X } from "lucide-react";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { LoadingOverlay } from "../../../components/dashboard/LoadingOverlay";
import { SearchableSelect } from "../../../components/dashboard/SearchableSelect";
import { useToast } from "../../../contexts/ToastContext";
import { getApiErrorMessage } from "../../content/utils/apiError";
import { ticketTypeService } from "../../content/services/ticketType.service";
import type { ReadTicketTypeDTO } from "../../content/types/ticketType";
import { PATH } from "../../../config/routes/route";
import { useTourSchedule } from "../hooks/useTourSchedule";
import { tourScheduleTicketService } from "../services/tourScheduleTicket.service";
import type { TourScheduleTicket } from "../types/tourScheduleTicket";
import {
  buildScheduleTicketPayload,
  getScheduleTicketCapacity,
  getScheduleTicketTypeId,
  formatTicketCurrency,
} from "../utils/tourScheduleTicket";
import { useTranslation } from "../../../contexts/LocaleContext";
import { usePromotions } from "../../promotion/hooks/usePromotions";

export const UpdateScheduleTicket: React.FC = () => {
  const { t } = useTranslation();
  const { scheduleId, ticketId } = useParams<{ scheduleId: string; ticketId: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const { currentSchedule: schedule, isLoading: isScheduleLoading, fetchScheduleById } =
    useTourSchedule();

  const { data: promotionsData, isLoading: isLoadingPromotions } = usePromotions({ status: "Active", limit: 1000 });
  const activePromotions = promotionsData?.data || [];

  const [ticket, setTicket] = React.useState<TourScheduleTicket | null>(null);
  const [ticketTypes, setTicketTypes] = React.useState<ReadTicketTypeDTO[]>([]);
  const [selectedTicketType, setSelectedTicketType] =
    React.useState<ReadTicketTypeDTO | null>(null);
  const [ticketTypeId, setTicketTypeId] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [quantity, setQuantity] = React.useState("");
  const [promotionId, setPromotionId] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);
  const [note, setNote] = React.useState("");
  const [isFetching, setIsFetching] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const selectedPromotion = React.useMemo(() => {
    return activePromotions.find((p) => p.id.toString() === promotionId);
  }, [activePromotions, promotionId]);

  const discountAmount = React.useMemo(() => {
    if (!selectedPromotion || !price) return 0;
    const p = Number(price);
    if (!Number.isFinite(p) || p <= 0) return 0;
    
    let amount = 0;
    if (selectedPromotion.discountType === "PERCENTAGE") {
      amount = p * (selectedPromotion.discountValue / 100);
      if (selectedPromotion.maxDiscountAmount && amount > selectedPromotion.maxDiscountAmount) {
        amount = selectedPromotion.maxDiscountAmount;
      }
    } else {
      amount = selectedPromotion.discountValue;
    }
    return Math.round(amount);
  }, [selectedPromotion, price]);

  React.useEffect(() => {
    if (!scheduleId) return;
    void Promise.resolve().then(() => fetchScheduleById(scheduleId));
  }, [scheduleId, fetchScheduleById]);

  React.useEffect(() => {
    if (!ticketId) return;

    void Promise.resolve().then(async () => {
      setIsFetching(true);
      try {
        const [ticketData, activeTypes] = await Promise.all([
          tourScheduleTicketService.getById(ticketId),
          ticketTypeService.getActive(),
        ]);
        const existingTicketTypeId = getScheduleTicketTypeId(ticketData);
        let detail: ReadTicketTypeDTO | null = null;

        if (existingTicketTypeId) {
          detail = await ticketTypeService.getById(existingTicketTypeId);
        }

        setTicket(ticketData);
        setTicketTypes(
          detail && !activeTypes.some((type) => type.id === detail?.id)
            ? [detail, ...activeTypes]
            : activeTypes,
        );
        setSelectedTicketType(detail);
        setTicketTypeId(existingTicketTypeId ? String(existingTicketTypeId) : "");
        setPrice(ticketData.price === undefined || ticketData.price === null ? "" : String(ticketData.price));
        setQuantity(() => {
          const capacity = getScheduleTicketCapacity(ticketData);
          return capacity === null ? "" : String(capacity);
        });
        setPromotionId(ticketData.promotion?.id ? String(ticketData.promotion.id) : "");
        setIsActive(ticketData.isActive ?? true);
        setNote(ticketData.note ?? "");
      } catch (err: unknown) {
        showError(getApiErrorMessage(err, t("tour.failedLoadScheduleTicket")));
      } finally {
        setIsFetching(false);
      }
    });
  }, [ticketId, showError, t]);

  React.useEffect(() => {
    if (!ticketTypeId) {
      void Promise.resolve().then(() => setSelectedTicketType(null));
      return;
    }

    void Promise.resolve().then(async () => {
      try {
        const data = await ticketTypeService.getById(ticketTypeId);
        setSelectedTicketType(data);
      } catch (err: unknown) {
        setSelectedTicketType(null);
        showError(getApiErrorMessage(err, t("tour.failedLoadTicketType")));
      }
    });
  }, [ticketTypeId, showError, t]);

  const handleCancel = () => {
    if (scheduleId) navigate(PATH.MANAGER.SCHEDULE_DETAIL(scheduleId));
    else navigate(-1);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!scheduleId || !ticketId) return;

    const parsedTicketTypeId = Number(ticketTypeId);
    const parsedPrice = Number(price);
    const parsedQuantity = Number(quantity);

    if (!Number.isInteger(parsedTicketTypeId) || parsedTicketTypeId <= 0) {
      setFormError(t("tour.selectTicketType"));
      return;
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setFormError(t("tour.priceInvalid"));
      return;
    }

    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      setFormError(t("tour.quantityInvalid"));
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      await tourScheduleTicketService.update(
        ticketId,
        buildScheduleTicketPayload(
          Number(scheduleId),
          parsedTicketTypeId,
          parsedPrice,
          parsedQuantity,
          isActive,
          note,
          promotionId ? Number(promotionId) : null,
        ),
      );
      success(t("tour.scheduleTicketUpdated"));
      navigate(PATH.MANAGER.SCHEDULE_DETAIL(scheduleId));
    } catch (err: unknown) {
      showError(getApiErrorMessage(err, t("tour.scheduleTicketUpdateFailed")));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!scheduleId || !ticketId) {
    return <div className="p-10 text-center text-rose-500">{t("tour.scheduleTicketRouteInvalid")}</div>;
  }

  if (isScheduleLoading || isFetching) {
    return <div className="p-10 text-center text-slate-500">{t("tour.loadingScheduleTicket")}</div>;
  }

  if (!ticket) {
    return <div className="p-10 text-center text-rose-500">{t("tour.scheduleTicketNotFound")}</div>;
  }

  return (
    <div className="mx-auto max-w-3xl py-6">
      <button
        type="button"
        onClick={handleCancel}
        className="mb-6 flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("tour.backToSchedule")}
      </button>

      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{t("tour.editScheduleTicket")}</h1>
            <p className="mt-1 text-sm text-slate-500">
              Update ticket #{ticketId} for Schedule #{scheduleId}
              {schedule?.tour?.name ? ` (${schedule.tour.name})` : ""}.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <ActionButton type="button" variant="secondary" onClick={handleCancel} className="gap-2 px-4 py-2 text-sm">
              <X className="h-4 w-4" />
              {t("common.cancel")}
            </ActionButton>
            <ActionButton type="submit" variant="primary" disabled={isSubmitting} className="gap-2 px-4 py-2 text-sm">
              <Save className="h-4 w-4" />
              {t("tour.updateTicket")}
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
              {t("tour.ticketType")} <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Ticket className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                value={ticketTypeId}
                onChange={(event) => {
                  setTicketTypeId(event.target.value);
                  setFormError(null);
                }}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition-colors focus:border-brand focus:bg-white"
              >
                <option value="">{t("tour.selectTicketType")}</option>
                {ticketTypes.map((ticketType) => (
                  <option key={ticketType.id} value={ticketType.id}>
                    {ticketType.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedTicketType && (
            <div className="rounded-xl border border-blue-100 bg-brand-light px-4 py-3 text-sm text-slate-700">
              <div className="flex items-center justify-between gap-3">
                <span className="font-bold text-slate-900">{selectedTicketType.name}</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    selectedTicketType.isActive
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {selectedTicketType.isActive ? t("common.active") : t("common.inactive")}
                </span>
              </div>
              {selectedTicketType.description && (
                <p className="mt-2 text-slate-600">{selectedTicketType.description}</p>
              )}
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                {t("common.price")} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Banknote className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={price}
                  onChange={(event) => {
                    setPrice(event.target.value);
                    setFormError(null);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition-colors focus:border-brand focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                {t("tour.quantity")} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={quantity}
                  onChange={(event) => {
                    setQuantity(event.target.value);
                    setFormError(null);
                  }}
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
              value={note}
              onChange={(event) => {
                setNote(event.target.value);
                setFormError(null);
              }}
              rows={3}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition-colors focus:border-brand focus:bg-white"
              placeholder={t("tour.internalNotePlaceholder")}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Promotion <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <SearchableSelect
                options={[
                  { label: isLoadingPromotions ? "Loading promotions..." : "No promotion", value: "" },
                  ...activePromotions.map((promo) => ({
                    label: `${promo.code} - ${promo.name}`,
                    value: promo.id.toString(),
                  })),
                ]}
                value={promotionId}
                onChange={(val) => setPromotionId(String(val))}
                disabled={isLoadingPromotions || isSubmitting}
                placeholder="Select promotion"
                direction="up"
              />
            </div>
            {selectedPromotion && Number(price) > 0 && (
              <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium">Original Price:</span>
                  <span>{formatTicketCurrency(Number(price))}</span>
                </div>
                <div className="flex justify-between items-center mb-1 text-emerald-600">
                  <span className="font-medium">Discount ({selectedPromotion.discountType === "PERCENTAGE" ? `${selectedPromotion.discountValue}%` : 'Fixed'}):</span>
                  <span>- {formatTicketCurrency(discountAmount)}</span>
                </div>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-emerald-200/50 font-bold text-emerald-800">
                  <span>Final Price:</span>
                  <span>{formatTicketCurrency(Math.max(0, Number(price) - discountAmount))}</span>
                </div>
              </div>
            )}
          </div>

          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <div className="text-sm font-semibold text-slate-800">{t("common.active")}</div>
              <div className="text-xs font-medium text-slate-500">
                {t("tour.activeTicketsHint")}
              </div>
            </div>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => {
                setIsActive(event.target.checked);
                setFormError(null);
              }}
              className="h-5 w-5 rounded border-slate-300 text-brand focus:ring-brand"
            />
          </label>
        </div>
      </form>

      <LoadingOverlay isOpen={isSubmitting} message={t("tour.updatingScheduleTicket")} />
    </div>
  );
};
