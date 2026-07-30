import { useEffect, useState } from "react";
import { apiClient } from "../utils/axiosClient";
import { TOURS_API } from "../config/api/tours.api";
import type { Tour } from "../features/tour/types/tour";

type PublicToursResponse = {
  items?: Tour[];
  data?: Tour[];
  totalPages?: number;
  totalPage?: number;
};

const isRequestCancelled = (err: unknown) => {
  if (!err || typeof err !== "object") return false;

  const requestError = err as { code?: string; name?: string };
  return requestError.code === "ERR_CANCELED" || requestError.name === "CanceledError";
};

export const usePublicTours = (
  page = 1,
  pageSize = 10,
  searchTerm?: string,
  startDate?: string,
  categoryId?: number,
  country?: string,
  city?: string,
  minPrice?: number,
  maxPrice?: number,
  endDate?: string,
  duration?: number,
  sortBy?: string,
) => {
  const [tours, setTours] = useState<Tour[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchActiveTours = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const res = await apiClient.get<PublicToursResponse | Tour[]>(
          TOURS_API.GET_PUBLIC_TOURS,
          {
            signal: controller.signal,
            params: {
              page,
              pageSize,
            },
          },
        );

        const items = Array.isArray(res) ? res : res.items || res.data || [];
        setTours(items);
        setTotalPages(Array.isArray(res) ? 1 : res.totalPages || res.totalPage || 1);
      } catch (err: unknown) {
        if (isRequestCancelled(err)) return;

        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: unknown }).message)
            : "Failed to fetch active tours";

        setError(message);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void fetchActiveTours();

    return () => {
      controller.abort();
    };
  }, [
    page,
    pageSize,
    searchTerm,
    startDate,
    categoryId,
    country,
    city,
    minPrice,
    maxPrice,
    endDate,
    duration,
    sortBy,
  ]);

  return { tours, isLoading, error, totalPages };
};
