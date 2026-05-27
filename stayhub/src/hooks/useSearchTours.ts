import { useState, useEffect } from "react";
import { apiClient } from "../utils/axiosClient";
import { TOURS_API } from "../config/api/tours.api";
import type { PaginatedResponse } from "../features/tour/types/paginatedReponse";
import type { Tour } from "../features/tour/types/tour";

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
        const res = await apiClient.get<any>(TOURS_API.SEARCH, {
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
        const items = res.items || res.data || (Array.isArray(res) ? res : []);
        setTours(items);
        setTotalPages(res.totalPages || res.totalPage || 1);
      } catch (err: any) {
        setError(err.message || "Failed to fetch active tours");
      } finally {
        setIsLoading(false);
      }
    };
    fetchActiveTours();
  }, [page, pageSize, searchTerm, startDate, categoryId, country, city, minPrice, maxPrice, endDate, duration, sortBy]);

  return { tours, isLoading, error, totalPages };
};