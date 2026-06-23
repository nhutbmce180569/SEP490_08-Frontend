import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Banknote, PowerOff, Ticket, Users } from "lucide-react";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { LoadingOverlay } from "../../../components/dashboard/LoadingOverlay";
import { useToast } from "../../../contexts/ToastContext";
import { getApiErrorMessage } from "../../content/utils/apiError";
import { ticketTypeService } from "../../content/services/ticketType.service";
import type { ReadTicketTypeDTO } from "../../content/types/ticketType";
import { PATH } from "../../../config/routes/route";
import { useTourSchedule } from "../hooks/useTourSchedule";
import { tourScheduleTicketService } from "../services/tourScheduleTicket.service";
import type { TourScheduleTicket } from "../types/tourScheduleTicket";
import {
  formatTicketCurrency,
  getScheduleTicketCapacity,
  getScheduleTicketName,
  getScheduleTicketTypeId,
} from "../utils/tourScheduleTicket";
import { useTranslation } from "../../../contexts/LocaleContext";

export const DeleteScheduleTicket: React.FC = () => {
  const { t } = useTranslation();
  const { scheduleId, ticketId } = useParams<{ scheduleId: string; ticketId: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const { currentSchedule: schedule, isLoading: isScheduleLoading, fetchScheduleById } =
    useTourSchedule();

  const [ticket, setTicket] = React.useState<TourScheduleTicket | null>(null);
  const [ticketType, setTicketType] = React.useState<ReadTicketTypeDTO | null>(null);
  const [isFetching, setIsFetching] = React.useState(true);
  const [isDeleting, setIsDeleting] = React.useState(false);

  React.useEffect(() => {
    if (!scheduleId) return;
    void Promise.resolve().then(() => fetchScheduleById(scheduleId));
  }, [scheduleId, fetchScheduleById]);

  React.useEffect(() => {
    if (!ticketId) return;

    void Promise.resolve().then(async () => {
      setIsFetching(true);
      try {
        const ticketData = await tourScheduleTicketService.getById(ticketId);
        const ticketTypeId = getScheduleTicketTypeId(ticketData);
        const ticketTypeData = ticketTypeId
          ? await ticketTypeService.getById(ticketTypeId)
          : null;

        setTicket(ticketData);
        setTicketType(ticketTypeData);
      } catch (err: unknown) {
        showError(getApiErrorMessage(err, t("tour.failedLoadScheduleTicket")));
      } finally {
        setIsFetching(false);
      }
    });
  }, [ticketId, showError, t]);

  const handleCancel = () => {
    if (scheduleId) navigate(PATH.MANAGER.SCHEDULE_DETAIL(scheduleId));
    else navigate(-1);
  };

  const handleConfirmDelete = async () => {
    if (!ticketId || !scheduleId) return;

    setIsDeleting(true);
    try {
      if (ticket?.isActive ?? true) {
        await tourScheduleTicketService.changeStatus(ticketId);
      }
      success(t("tour.scheduleTicketDeactivated"));
      navigate(PATH.MANAGER.SCHEDULE_DETAIL(scheduleId));
    } catch (err: unknown) {
      showError(getApiErrorMessage(err, t("tour.failedDeactivateScheduleTicket")));
    } finally {
      setIsDeleting(false);
    }
  };

  const tourNameSuffix = schedule?.tour?.name ? ` (${schedule.tour.name})` : "";

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
    <div className="mx-auto max-w-2xl py-8">
      <button
        onClick={handleCancel}
        className="mb-6 flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("tour.backToSchedule")}
      </button>

      <div className="overflow-hidden rounded-2xl border border-rose-200 bg-white shadow-sm">
        <div className="flex items-start gap-4 border-b border-rose-100 bg-rose-50/50 px-6 py-5">
          <div className="mt-0.5 rounded-full bg-rose-100 p-2 text-rose-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-rose-700">{t("tour.deactivateScheduleTicket")}</h2>
            <p className="mt-1 text-sm text-rose-600/90">
              {t("tour.deactivateScheduleTicketDesc", { id: scheduleId, tourName: tourNameSuffix })}
            </p>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-4 text-sm font-bold text-slate-800">{t("tour.ticketDetails")}</div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                  <Ticket className="h-4 w-4" />
                  {t("tour.ticketType")}
                </div>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">
                  {getScheduleTicketName(ticket, ticketType)}
                </h3>
                {ticketType?.description && (
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {ticketType.description}
                  </p>
                )}
              </div>
              <span
                className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                  (ticket.isActive ?? true)
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-rose-100 text-rose-700"
                }`}
              >
                {(ticket.isActive ?? true) ? t("common.active") : t("common.inactive")}
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-white p-4 text-sm text-slate-700 shadow-sm">
                <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                  <Banknote className="h-4 w-4" />
                  {t("common.price")}
                </div>
                <div className="font-medium text-slate-900">
                  {formatTicketCurrency(ticket.price)}
                </div>
              </div>
              <div className="rounded-2xl bg-white p-4 text-sm text-slate-700 shadow-sm">
                <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                  <Users className="h-4 w-4" />
                  {t("tour.quantity")}
                </div>
                <div className="font-medium text-slate-900">
                  {getScheduleTicketCapacity(ticket) ?? t("common.na")}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          <ActionButton variant="secondary" onClick={handleCancel} className="px-5 py-2.5 text-sm">
            {t("common.cancel")}
          </ActionButton>
          <ActionButton
            variant="warning"
            onClick={handleConfirmDelete}
            disabled={isDeleting}
            className="gap-2 px-5 py-2.5 text-sm !border-rose-600 !bg-rose-600 !text-white hover:!border-rose-700 hover:!bg-rose-700"
          >
            <PowerOff className="h-4 w-4" />
            {isDeleting ? t("tour.deactivating") : t("tour.yesDeactivateTicket")}
          </ActionButton>
        </div>
      </div>

      <LoadingOverlay isOpen={isDeleting} message={t("tour.deactivatingScheduleTicket")} />
    </div>
  );
};
