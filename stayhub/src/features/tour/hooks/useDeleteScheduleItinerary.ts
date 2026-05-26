import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { deleteScheduleItinerary } from "../services/tourScheduleItinerary.service";
import { useToast } from "../../../contexts/ToastContext";
import { PATH } from "../../../config/routes/route";
import { useTourSchedule } from "./useTourSchedule";

export const useDeleteScheduleItinerary = () => {
  const { scheduleId, itineraryId } = useParams<{ scheduleId: string; itineraryId: string }>();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const { schedule, isLoading: isFetching, error: fetchError } = useTourSchedule(scheduleId);

  const itinerary = schedule?.tourScheduleItineraries?.find(
    (item) => String(item.id) === String(itineraryId),
  );

  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!itineraryId || !scheduleId) return;
    try {
      setIsDeleting(true);
      await deleteScheduleItinerary(itineraryId);
      success("Schedule itinerary deleted successfully!");
      navigate(PATH.OPERATOR.SCHEDULE_DETAIL(scheduleId));
    } catch (err: any) {
      error(err.response?.data?.message || err.message || "Failed to delete schedule itinerary.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => navigate(-1);

  return { scheduleId, itinerary, isFetching, fetchError, isDeleting, handleConfirmDelete, handleCancel };
};
