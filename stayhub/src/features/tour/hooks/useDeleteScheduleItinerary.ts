import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { deleteScheduleItinerary } from "../services/tourScheduleItinerary.service";
import { useToast } from "../../../contexts/ToastContext";
import { PATH } from "../../../config/routes/route";
import { useTourSchedule } from "./useTourSchedule";
import { useTranslation } from "../../../contexts/LocaleContext";

export const useDeleteScheduleItinerary = () => {
  const { scheduleId, itineraryId } = useParams<{ scheduleId: string; itineraryId: string }>();
  const navigate = useNavigate();
  const { success, error } = useToast();
  const { t } = useTranslation();

  const { currentSchedule: schedule, isLoading: isFetching, error: fetchError, fetchScheduleById } = useTourSchedule();

  useEffect(() => {
    if (scheduleId) {
      fetchScheduleById(scheduleId);
    }
  }, [scheduleId, fetchScheduleById]);

  const itinerary = schedule?.tourScheduleItineraries?.find(
    (item) => String(item.id) === String(itineraryId),
  );

  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!itineraryId || !scheduleId) return;
    try {
      setIsDeleting(true);
      await deleteScheduleItinerary(itineraryId);
      success(t("tour.deleteScheduleItinerarySuccess"));
      navigate(PATH.MANAGER.SCHEDULE_DETAIL(scheduleId));
    } catch (err: any) {
      error(err.response?.data?.message || err.message || t("tour.failedDeleteScheduleItinerary"));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => navigate(-1);

  return { scheduleId, itinerary, isFetching, fetchError, isDeleting, handleConfirmDelete, handleCancel };
};
