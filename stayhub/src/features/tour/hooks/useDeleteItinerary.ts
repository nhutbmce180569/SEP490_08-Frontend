import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTour } from "./useTour";
import { deleteItinerary } from "../services/itinerary.service";
import { useToast } from "../../../contexts/ToastContext";
import { PATH } from "../../../config/routes/route";
import { useTranslation } from "../../../contexts/LocaleContext";

export const useDeleteItinerary = () => {
  const { tourId, itineraryId } = useParams<{ tourId: string; itineraryId: string }>();
  const navigate = useNavigate();
  const { success, error } = useToast();
  const { t } = useTranslation();
  
  const { tour, isLoading: isFetching, error: fetchError } = useTour(tourId);
  const [isDeleting, setIsDeleting] = useState(false);

  // Tìm itinerary cụ thể trong danh sách của tour
  const itinerary = tour?.tourItineraries?.find((iti: any) => String(iti.id) === String(itineraryId));

  const handleConfirmDelete = async () => {
    if (!itineraryId || !tourId) return;
    try {
      setIsDeleting(true);
      await deleteItinerary(itineraryId);
      success(t("tour.deleteItinerarySuccess"));
      navigate(PATH.MANAGER.TOUR_DETAIL(tourId));
    } catch (err: any) {
      error(err.response?.data?.message || err.message || t("tour.failedDeleteItinerary"));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => navigate(-1);

  return { tourId, itinerary, isFetching, fetchError, isDeleting, handleConfirmDelete, handleCancel };
};