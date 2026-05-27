import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getScheduleItineraryById, updateScheduleItinerary } from "../services/tourScheduleItinerary.service";
import type { UpdateTourScheduleItineraryRequest, TourScheduleItinerary } from "../types/tourScheduleItinerary";
import { useToast } from "../../../contexts/ToastContext";
import { PATH } from "../../../config/routes/route";
import { useTourSchedule } from "./useTourSchedule";

export const useUpdateScheduleItinerary = () => {
  const { scheduleId, itineraryId } = useParams<{ scheduleId: string; itineraryId: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const { schedule, isLoading: isScheduleLoading } = useTourSchedule(scheduleId);

  const [itinerary, setItinerary] = useState<TourScheduleItinerary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!itineraryId) return;

    const fetchItinerary = async () => {
      try {
        setIsLoading(true);
        const data = await getScheduleItineraryById(itineraryId);
        setItinerary(data);
        setFetchError(null);
      } catch (err: any) {
        setFetchError(err.response?.data?.message || err.message || "Failed to fetch itinerary details.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchItinerary();
  }, [itineraryId]);

  const handleSubmit = async (values: Record<string, any>) => {
    if (!scheduleId || !itineraryId) return;
    setIsSubmitting(true);
    setServerErrors({});

    if (values.startDuration && values.endDuration) {
      if (values.startDuration >= values.endDuration) {
        showError("End time must be strictly after start time.");
        setIsSubmitting(false);
        return;
      }
    }

    if (schedule?.tourScheduleItineraries) {
      const existingWithSameDate = schedule.tourScheduleItineraries.find((i: any) => 
        i.itineraryDate?.split("T")[0] === values.itineraryDate && 
        Number(i.dayNumber) !== Number(values.dayNumber)
      );
      
      if (existingWithSameDate) {
        showError(`Date ${values.itineraryDate} is already assigned to Day ${existingWithSameDate.dayNumber}. Different days cannot share the same date.`);
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const payload: UpdateTourScheduleItineraryRequest = {
        scheduleId: Number(scheduleId),
        dayNumber: Number(values.dayNumber),
        itineraryDate: values.itineraryDate,
        title: values.title || null,
        description: values.description || null,
        startDuration: values.startDuration ? (values.startDuration.length === 5 ? `${values.startDuration}:00` : values.startDuration) : null,
        endDuration: values.endDuration ? (values.endDuration.length === 5 ? `${values.endDuration}:00` : values.endDuration) : null,
        locationName: values.locationName || null,
        locationLat: values.locationLat ? Number(values.locationLat) : null,
        locationLng: values.locationLng ? Number(values.locationLng) : null,
      };

      await updateScheduleItinerary(itineraryId, payload);
      success("Schedule itinerary updated successfully!");
      navigate(PATH.MANAGER.SCHEDULE_DETAIL(scheduleId));
    } catch (error: any) {
      if (error.response?.status === 400 && error.response.data?.errors) {
        setServerErrors(error.response.data.errors);
        showError("Please check again the errors in the form.");
      } else {
        showError(error.response?.data?.message || error.message || "Failed to update schedule itinerary.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (scheduleId) {
      navigate(PATH.MANAGER.SCHEDULE_DETAIL(scheduleId));
    } else {
      navigate(-1);
    }
  };

  return {
    scheduleId,
    itineraryId,
    schedule,
    itinerary,
    isScheduleLoading,
    isLoading,
    fetchError,
    handleSubmit,
    handleCancel,
    isSubmitting,
    serverErrors,
  };
};
