import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getItineraryById, updateItinerary } from "../services/itinerary.service";
import { type UpdateItineraryRequest, type TourItinerary } from "../types/tourItinerary";
import { useToast } from "../../../contexts/ToastContext";
import { PATH } from "../../../config/routes/route";
import { useTour } from "./useTour";

export const useUpdateItinerary = () => {
  const { tourId, itineraryId } = useParams<{ tourId: string; itineraryId: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const { tour, isLoading: isTourLoading } = useTour(tourId);

  const [itinerary, setItinerary] = useState<TourItinerary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!itineraryId) return;

    const fetchItinerary = async () => {
      try {
        setIsLoading(true);
        const data = await getItineraryById(itineraryId);
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
    if (!tourId || !itineraryId) return;
    setIsSubmitting(true);
    setServerErrors({});

    if (values.startDuration && values.endDuration) {
      if (values.startDuration >= values.endDuration) {
        showError("Start time must be before end time.");
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const payload: UpdateItineraryRequest = {
        tourId: Number(tourId),
        dayNumber: Number(values.dayNumber),
        title: values.title || null,
        description: values.description || null,
        startDuration: values.startDuration ? (values.startDuration.length === 5 ? `${values.startDuration}:00` : values.startDuration) : null,
        endDuration: values.endDuration ? (values.endDuration.length === 5 ? `${values.endDuration}:00` : values.endDuration) : null,
        locationName: values.locationName || null,
        locationLat: values.locationLat ? Number(values.locationLat) : null,
        locationLng: values.locationLng ? Number(values.locationLng) : null,
      };

      await updateItinerary(itineraryId, payload);
      success("Itinerary updated successfully!");
      navigate(PATH.MANAGER.TOUR_DETAIL(tourId));
    } catch (error: any) {
      if (error.response?.status === 400 && error.response.data?.errors) {
        setServerErrors(error.response.data.errors);
        showError("Please check again the errors in the form.");
      } else {
        showError(error.response?.data?.message || error.message || "Failed to update itinerary.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => navigate(PATH.MANAGER.TOUR_DETAIL(tourId!));

  return { tourId, itineraryId, itinerary, tour, isTourLoading, isLoading, fetchError, handleSubmit, handleCancel, isSubmitting, serverErrors };
};