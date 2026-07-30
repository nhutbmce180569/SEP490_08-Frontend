import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTourSchedule } from "./useTourSchedule";

export const useDeleteSchedule = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    currentSchedule: schedule,
    isLoading: isFetching,
    error: fetchError,
    fetchScheduleById,
    deleteSchedule,
  } = useTourSchedule();

  const [isDeleting, setIsDeleting] = React.useState(false);

  React.useEffect(() => {
    if (!id) return;
    fetchScheduleById(id);
  }, [id, fetchScheduleById]);

  const handleConfirmDelete = async () => {
    if (!schedule) return;

    setIsDeleting(true);

    try {
      await deleteSchedule(schedule.id);
      navigate(-2);
    } catch (err: unknown) {
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return {
    schedule,
    isFetching,
    fetchError,
    isDeleting,
    handleConfirmDelete,
    handleCancel,
  };
};