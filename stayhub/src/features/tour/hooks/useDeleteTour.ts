import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { deleteTour } from "../services/tour.service";
import { useToast } from "../../../contexts/ToastContext";
import { PATH } from "../../../config/routes/route";
import { useTour } from "./useTour";
import { useTranslation } from "../../../contexts/LocaleContext";

export const useDeleteTour = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const { tour, categoryName, isLoading: isFetching, error: fetchError } = useTour(id);
  const [isDeleting, setIsDeleting] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (tour) {
      if (tour.status?.toLowerCase() !== "inactive") {
        showError(t("tour.mustBeInactiveToDelete"));
        navigate(PATH.MANAGER.MY_TOURS);
      } else if (tour.tourSchedules && tour.tourSchedules.length > 0) {
        showError(t("tour.cannotDeleteWithSchedules"));
        navigate(PATH.MANAGER.MY_TOURS);
      }
    }
  }, [tour, navigate, showError, t]);

  const handleConfirmDelete = async () => {
    if (!id) return;
    try {
      setIsDeleting(true);
      await deleteTour(id);
      success("Tour deleted successfully!");
      navigate(PATH.MANAGER.MY_TOURS);
    } catch (err: any) {
      showError(err?.response?.data?.message || err.message || "Failed to delete tour.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    navigate(PATH.MANAGER.MY_TOURS);
  };

  return { tour, categoryName, isFetching, fetchError, isDeleting, handleConfirmDelete, handleCancel };
};