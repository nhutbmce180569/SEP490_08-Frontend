import { useState, useEffect } from "react";
import { apiClient } from "../utils/axiosClient";
import { TOURS_API } from "../config/api/tours.api";
import type { Tour } from "../features/tour/types/tour";

type SearchToursResponse =
  | Tour[]
  | {
      data?: Tour[] | SearchToursResponse;
      items?: Tour[];
      totalPages?: number;
      totalPage?: number;
    };

const normalizeSearchToursResponse = (response: SearchToursResponse) => {
  const payload =
    !Array.isArray(response) &&
    response.data &&
    !Array.isArray(response.data) &&
    ("data" in response.data || "items" in response.data)
      ? response.data
      : response;

  const items = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.data)
      ? payload.data
      : Array.isArray(payload.items)
        ? payload.items
        : [];

  const totalPages = Array.isArray(payload)
    ? 1
    : (payload.totalPages ?? payload.totalPage ?? 1);

  return { items, totalPages };
};

export const useSearchTours = (
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
  sortBy?: string
) => {
  const [tours, setTours] = useState<Tour[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActiveTours = async () => {
      try {
        setIsLoading(true);
        const res = await apiClient.get<SearchToursResponse>(TOURS_API.SEARCH, {
          params: { 
            page, 
            pageSize,
            searchTerm: searchTerm || undefined,
            startDate: startDate || undefined,
            categoryId: categoryId || undefined,
            country: country || undefined,
            city: city || undefined,
            minPrice: minPrice || undefined,
            maxPrice: maxPrice || undefined,
            endDate: endDate || undefined,
            duration: duration || undefined,
            sortBy: sortBy || undefined
          }
        });
        
        // Đọc dữ liệu linh hoạt tuỳ theo cấu trúc response trả về từ BE
        const { items, totalPages } = normalizeSearchToursResponse(res);
        setTours(items);
        setTotalPages(totalPages);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to fetch active tours");
      } finally {
        setIsLoading(false);
      }
    };
    fetchActiveTours();
  }, [page, pageSize, searchTerm, startDate, categoryId, country, city, minPrice, maxPrice, endDate, duration, sortBy]);

  return { tours, isLoading, error, totalPages };
};

/**
 * Fetches search suggestions from the API.
 * @param searchTerm The term to search for.
 * @param signal AbortSignal to cancel the request.
 * @returns A promise that resolves to an array of suggestion strings.
 */
export const getSearchSuggestions = async (
  searchTerm: string,
  signal?: AbortSignal,
): Promise<string[]> => {
  if (!searchTerm.trim()) {
    return [];
  }

  // Sử dụng API search có sẵn để lấy gợi ý
  const res = await apiClient.get<SearchToursResponse>(TOURS_API.SEARCH, {
    params: {
      searchTerm,
      pageSize: 5, // Chỉ lấy 5 kết quả để làm gợi ý
      page: 1,
    },
    signal,
  });

  // Chuẩn hóa response và trích xuất tên tour
  const { items: tours } = normalizeSearchToursResponse(res);
  return tours.map((tour) => tour.name).filter((name): name is string => !!name);
};
