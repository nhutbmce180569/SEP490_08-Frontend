import { useState, useEffect } from "react";
import { apiClient } from "../utils/axiosClient";
import { TOURS_API } from "../config/api/tours.api";
import type { Tour } from "../features/tour/types/tour";

export const useRegionTours = (region: string) => {
  const [tours, setTours] = useState<Tour[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!region) return;

    const fetchTours = async () => {
      try {
        setIsLoading(true);
        const res = await apiClient.get<Tour[] | { data: Tour[] } | { items: Tour[] }>(
          TOURS_API.GET_TOURS_BY_REGION(region),
          { params: { limit: 15 } }
        );
        
        const payload = Array.isArray(res) 
          ? res 
          : (res as any).data && Array.isArray((res as any).data) 
            ? (res as any).data 
            : (res as any).items && Array.isArray((res as any).items) 
              ? (res as any).items 
              : [];
              
        setTours(payload);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to fetch region tours");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTours();
  }, [region]);

  return { tours, isLoading, error };
};
