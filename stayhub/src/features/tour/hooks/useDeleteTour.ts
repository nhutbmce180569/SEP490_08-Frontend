import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { deleteTour } from "../services/tour.service";
import { useToast } from "../../../contexts/ToastContext";
import { PATH } from "../../../config/routes/route";
import { useTour } from "./useTour";

export const useDeleteTour = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const { tour, isLoading: isFetching, error: fetchError } = useTour(id);
  const [isDeleting, setIsDeleting] = useState(false);

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

  return { tour, isFetching, fetchError, isDeleting, handleConfirmDelete, handleCancel };
};