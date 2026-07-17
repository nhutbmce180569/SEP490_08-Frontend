import { useEffect, useState } from "react";
import { apiClient } from "../utils/axiosClient";
import { TOURS_API } from "../config/api/tours.api";
import type { Tour } from "../features/tour/types/tour";

const isRequestCancelled = (err: unknown) => {
  if (!err || typeof err !== "object") return false;
  const requestError = err as { code?: string; name?: string };
  return requestError.code === "ERR_CANCELED" || requestError.name === "CanceledError";
};

export const useHomeSections = () => {
  const [saleTours, setSaleTours] = useState<Tour[]>([]);
  const [hotTours, setHotTours] = useState<Tour[]>([]);
  const [upcomingTours, setUpcomingTours] = useState<Tour[]>([]);
  
  const [isLoadingSale, setIsLoadingSale] = useState(true);
  const [isLoadingHot, setIsLoadingHot] = useState(true);
  const [isLoadingUpcoming, setIsLoadingUpcoming] = useState(true);

  const [errorSale, setErrorSale] = useState<string | null>(null);
  const [errorHot, setErrorHot] = useState<string | null>(null);
  const [errorUpcoming, setErrorUpcoming] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchSection = async (
      url: string,
      limit: number,
      setData: (data: Tour[]) => void,
      setLoading: (loading: boolean) => void,
      setError: (error: string | null) => void
    ) => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiClient.get<Tour[]>(url, {
          signal: controller.signal,
          params: { limit },
        });
        // Handle case where res is wrapped in { data: ... } or just array
        const items = Array.isArray(res) ? res : (res as any).data || [];
        setData(items);
      } catch (err: unknown) {
        if (isRequestCancelled(err)) return;
        const message = err && typeof err === "object" && "message" in err
            ? String((err as { message?: unknown }).message)
            : "Failed to fetch tours";
        setError(message);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void fetchSection(TOURS_API.GET_SALE_TOURS, 6, setSaleTours, setIsLoadingSale, setErrorSale);
    void fetchSection(TOURS_API.GET_HOT_TOURS, 5, setHotTours, setIsLoadingHot, setErrorHot);
    void fetchSection(TOURS_API.GET_UPCOMING_TOURS, 6, setUpcomingTours, setIsLoadingUpcoming, setErrorUpcoming);

    return () => {
      controller.abort();
    };
  }, []);

  return {
    sale: { tours: saleTours, isLoading: isLoadingSale, error: errorSale },
    hot: { tours: hotTours, isLoading: isLoadingHot, error: errorHot },
    upcoming: { tours: upcomingTours, isLoading: isLoadingUpcoming, error: errorUpcoming },
  };
};
