import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Banknote, Save, Ticket, Users, X } from "lucide-react";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { LoadingOverlay } from "../../../components/dashboard/LoadingOverlay";
import { useToast } from "../../../contexts/ToastContext";
import { getApiErrorMessage } from "../../content/utils/apiError";
import { ticketTypeService } from "../../content/services/ticketType.service";
import type { ReadTicketTypeDTO } from "../../content/types/ticketType";
import { PATH } from "../../../config/routes/route";
import { useTourSchedule } from "../hooks/useTourSchedule";
import { tourScheduleTicketService } from "../services/tourScheduleTicket.service";
import { buildScheduleTicketPayload } from "../utils/tourScheduleTicket";

export const CreateScheduleTicket: React.FC = () => {
  const { scheduleId } = useParams<{ scheduleId: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const { currentSchedule: schedule, isLoading: isScheduleLoading, fetchScheduleById } =
    useTourSchedule();

  const [ticketTypes, setTicketTypes] = React.useState<ReadTicketTypeDTO[]>([]);
  const [selectedTicketType, setSelectedTicketType] =
    React.useState<ReadTicketTypeDTO | null>(null);
  const [ticketTypeId, setTicketTypeId] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [quantity, setQuantity] = React.useState("");
  const [isLoadingTicketTypes, setIsLoadingTicketTypes] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!scheduleId) return;
    void Promise.resolve().then(() => fetchScheduleById(scheduleId));
  }, [scheduleId, fetchScheduleById]);

  React.useEffect(() => {
    void Promise.resolve().then(async () => {
      setIsLoadingTicketTypes(true);
      try {
        const data = await ticketTypeService.getActive();
        setTicketTypes(data);
      } catch (err: unknown) {
        showError(getApiErrorMessage(err, "Failed to load ticket types."));
      } finally {
        setIsLoadingTicketTypes(false);
      }
    });
  }, [showError]);

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
        showError(getApiErrorMessage(err, "Failed to load ticket type detail."));
      }
    });
  }, [ticketTypeId, showError]);

  const handleCancel = () => {
    if (scheduleId) navigate(PATH.MANAGER.SCHEDULE_DETAIL(scheduleId));
    else navigate(-1);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!scheduleId) return;

    const parsedTicketTypeId = Number(ticketTypeId);
    const parsedPrice = Number(price);
    const parsedQuantity = Number(quantity);

    if (!Number.isInteger(parsedTicketTypeId) || parsedTicketTypeId <= 0) {
      setFormError("Please select a ticket type.");
      return;
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setFormError("Price must be a valid non-negative number.");
      return;
    }

    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      setFormError("Quantity must be a positive whole number.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      await tourScheduleTicketService.create(
        buildScheduleTicketPayload(
          Number(scheduleId),
          parsedTicketTypeId,
          parsedPrice,
          parsedQuantity,
        ),
      );
      success("Schedule ticket created successfully.");
      navigate(PATH.MANAGER.SCHEDULE_DETAIL(scheduleId));
    } catch (err: unknown) {
      showError(getApiErrorMessage(err, "Failed to create schedule ticket."));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!scheduleId) {
    return <div className="p-10 text-center text-rose-500">Schedule ID is missing from URL.</div>;
  }

  if (isScheduleLoading) {
    return <div className="p-10 text-center text-slate-500">Loading schedule details...</div>;
  }

  return (
    <div className="mx-auto max-w-3xl py-6">
      <button
        type="button"
        onClick={handleCancel}
        className="mb-6 flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Schedule
      </button>

      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Add Schedule Ticket</h1>
            <p className="mt-1 text-sm text-slate-500">
              Configure ticket type, price, and quantity for Schedule #{scheduleId}
              {schedule?.tour?.name ? ` (${schedule.tour.name})` : ""}.
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
              Cancel
            </ActionButton>
            <ActionButton
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="gap-2 px-4 py-2 text-sm"
            >
              <Save className="h-4 w-4" />
              Save Ticket
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
              Ticket Type <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Ticket className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                value={ticketTypeId}
                onChange={(event) => {
                  setTicketTypeId(event.target.value);
                  setFormError(null);
                }}
                disabled={isLoadingTicketTypes || isSubmitting}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition-colors focus:border-[#4880ff] focus:bg-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                <option value="">
                  {isLoadingTicketTypes ? "Loading ticket types..." : "Select ticket type"}
                </option>
                {ticketTypes.map((ticketType) => (
                  <option key={ticketType.id} value={ticketType.id}>
                    {ticketType.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedTicketType && (
            <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-slate-700">
              <div className="flex items-center justify-between gap-3">
                <span className="font-bold text-slate-900">{selectedTicketType.name}</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    selectedTicketType.isActive
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {selectedTicketType.isActive ? "Active" : "Inactive"}
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
                Price <span className="text-rose-500">*</span>
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
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition-colors focus:border-[#4880ff] focus:bg-white"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Quantity <span className="text-rose-500">*</span>
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
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition-colors focus:border-[#4880ff] focus:bg-white"
                  placeholder="1"
                />
              </div>
            </div>
          </div>
        </div>
      </form>

      <LoadingOverlay isOpen={isSubmitting} message="Creating schedule ticket..." />
    </div>
  );
};
