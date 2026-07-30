import { useState, useEffect, useCallback } from "react";
import { apiClient } from "../utils/axiosClient";
import { TOURS_API } from "../config/api/tours.api";
import type { Tour } from "../features/tour/types/tour";

export const usePublicTour = (id: string | number | undefined) => {
  const [tour, setTour] = useState<Tour | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTour = useCallback(async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      const data = await apiClient.get<Tour>(TOURS_API.GET_PUBLIC_DETAIL(id));
      setTour(data);
      setError(null);
    } catch (err: any) {
      const errorMessage = 
        typeof err?.response?.data === 'string' ? err.response.data :
        err?.response?.data?.message || 
        err.message || "Failed to fetch tour details.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTour();
  }, [fetchTour]);

  return { tour, isLoading, error, refetch: fetchTour };
};