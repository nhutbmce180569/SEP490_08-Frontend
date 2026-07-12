import { useCallback, useEffect, useState } from "react";
import { useToast } from "../../../contexts/ToastContext";
import { categoryService } from "../../content/services/category.service";
import type { ReadCategoryDTO } from "../../content/types/category";
import { getAllToursForAdmin } from "../services/tour.service";
import type { PaginatedResponse } from "../types/paginatedReponse";
import type { Tour } from "../types/tour";

const CATEGORY_PAGE_SIZE = 1000;

const getErrorMessage = (err: unknown, fallback: string) => {
  if (err && typeof err === "object") {
    const error = err as { response?: { data?: { message?: string } }; message?: string };
    return error.response?.data?.message || error.message || fallback;
  }
  return fallback;
};

export const useAdminTours = (initialPageSize: number = 5) => {
  const [page, setPage] = useState(1);
  const [search, setSearchState] = useState("");
  const [managerIdFilter, setManagerIdFilter] = useState<number | undefined>(undefined);
  const [categories, setCategories] = useState<ReadCategoryDTO[]>([]);
  const [isCategoryLoading, setIsCategoryLoading] = useState(false);
  const [data, setData] = useState<PaginatedResponse<Tour> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { error: showError } = useToast();

  const fetchTours = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getAllToursForAdmin(page, initialPageSize, search, managerIdFilter);
      setData(res);
      setError(null);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to load tours"));
    } finally {
      setIsLoading(false);
    }
  }, [initialPageSize, page, search, managerIdFilter]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchTours();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchTours]);

  useEffect(() => {
    let cancelled = false;

    const fetchAllCategories = async () => {
      setIsCategoryLoading(true);
      try {
        const firstPage = await categoryService.getAllCategories(1, CATEGORY_PAGE_SIZE);
        const allCategories = [...(firstPage.data ?? [])];

        if (firstPage.totalPages > 1) {
          const remainingPages = await Promise.all(
            Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
              categoryService.getAllCategories(index + 2, CATEGORY_PAGE_SIZE)
            )
          );

          remainingPages.forEach((pageResult) => {
            allCategories.push(...(pageResult.data ?? []));
          });
        }

        if (!cancelled) {
          setCategories(allCategories);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          showError(getErrorMessage(err, "Failed to load categories."));
        }
      } finally {
        if (!cancelled) {
          setIsCategoryLoading(false);
        }
      }
    };

    void fetchAllCategories();

    return () => {
      cancelled = true;
    };
  }, [showError]);

  const setSearch = (value: string) => {
    setSearchState(value);
    setPage(1);
  };

  const clearFilters = () => {
    setSearchState("");
    setManagerIdFilter(undefined);
    setPage(1);
  };

  return {
    data,
    isLoading,
    error,
    page,
    setPage,
    search,
    setSearch,
    managerIdFilter,
    setManagerIdFilter,
    clearFilters,
    categories,
    isCategoryLoading,
    pageSize: initialPageSize,
    refetch: fetchTours,
  };
};
