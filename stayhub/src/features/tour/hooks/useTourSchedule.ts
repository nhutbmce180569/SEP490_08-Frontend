import { useState, useCallback } from "react";
import { tourScheduleService } from "../services/tourSchedule.service";
import { useToast } from "../../../contexts/ToastContext";
import type {
  TourSchedule,
  CreateTourScheduleRequest,
  UpdateTourScheduleRequest,
} from "../types/tourSchedule";

export const useTourSchedule = () => {
  const [schedules, setSchedules] = useState<TourSchedule[]>([]);
  const [currentSchedule, setCurrentSchedule] = useState<TourSchedule | null>(
    null,
  );

  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    currentPage: 1,
    pageSize: 10,
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { success: showSuccess, error: showError } = useToast();

  // --- QUERIES ---

  const fetchAllSchedules = useCallback(
    async (page: number = 1, pageSize: number = 10, tourName?: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await tourScheduleService.getAllSchedules(
          page,
          pageSize,
          tourName,
        );
        setSchedules(response.data || []);
        setPagination({
          total: response.total || 0,
          totalPages: response.totalPages || 0,
          currentPage: response.currentPage || page,
          pageSize: response.pageSize || pageSize,
        });
      } catch (err: any) {
        setError(
          err?.response?.data?.message ||
            err.message ||
            "Failed to fetch schedules.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const fetchMySchedules = useCallback(
  async (
    page: number = 1,
    pageSize: number = 10,
    tourId?: number | null,
    startDate?: string,
    endDate?: string,
    search?: string,
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await tourScheduleService.getMySchedules(page, pageSize, tourId, startDate, endDate, search);
      setSchedules(response.data || []);
      setPagination({
        total: response.total || 0,
        totalPages: response.totalPages || 0,
        currentPage: response.currentPage || page,
        pageSize: response.pageSize || pageSize,
      });
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to fetch my schedules.",
      );
    } finally {
      setIsLoading(false);
    }
  },
  [],
);

  // Lấy chi tiết lịch trình
  const fetchScheduleById = useCallback(async (id: string | number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await tourScheduleService.getScheduleById(id);
      setCurrentSchedule(data);
      return data;
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to fetch schedule detail.",
      );
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // --- MUTATIONS ---

  // Tạo lịch trình mới
  const createSchedule = async (data: CreateTourScheduleRequest) => {
    setIsSubmitting(true);
    try {
      const newSchedule = await tourScheduleService.createSchedule(data);
      showSuccess("Tour schedule created successfully!");
      return newSchedule;
    } catch (err: any) {
      showError(err?.response?.data?.message || "Failed to create schedule.");
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cập nhật lịch trình
  const updateSchedule = async (
    id: string | number,
    data: UpdateTourScheduleRequest,
  ) => {
    setIsSubmitting(true);
    try {
      const updated = await tourScheduleService.updateSchedule(id, data);
      showSuccess("Tour schedule updated successfully!");
      return updated;
    } catch (err: any) {
      showError(err?.response?.data?.message || "Failed to update schedule.");
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xóa lịch trình
  const deleteSchedule = async (id: string | number) => {
    setIsSubmitting(true);
    try {
      await tourScheduleService.deleteSchedule(id);
      showSuccess("Tour schedule deleted successfully!");
      setSchedules((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      showError(err?.response?.data?.message || "Failed to delete schedule.");
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Giữ chỗ (Đặt vé)
  const reserveSeats = async (id: string | number, quantity: number) => {
    setIsSubmitting(true);
    try {
      return await tourScheduleService.reserveSeats(id, quantity);
    } catch (err: any) {
      showError(err?.response?.data?.message || "Reservation failed.");
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const releaseSeats = async (id: string | number, quantity: number) => {
    setIsSubmitting(true);
    try {
      return await tourScheduleService.releaseSeats(id, quantity);
    } catch (err: any) {
      showError(err?.response?.data?.message || "Failed to release seats.");
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkScheduleHasOrders = useCallback(async (id: string | number) => {
    try {
      const response = await tourScheduleService.checkScheduleHasOrders(id);
      return response.hasOrders;
    } catch (err: any) {
      console.error("Failed to check if schedule has orders", err);
      return false;
    }
  }, []);

  return {
    schedules,
    currentSchedule,
    pagination,
    isLoading,
    isSubmitting,
    error,
    fetchAllSchedules,
    fetchMySchedules,
    fetchScheduleById,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    reserveSeats,
    releaseSeats,
    checkScheduleHasOrders,
  };
};
