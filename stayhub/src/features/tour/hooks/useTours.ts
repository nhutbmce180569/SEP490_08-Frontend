import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../../contexts/ToastContext";
import { categoryService } from "../../content/services/category.service";
import type { ReadCategoryDTO } from "../../content/types/category";
import { PATH } from "../../../config/routes/route";
import { activeTour, getTours } from "../services/tour.service";
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

export const useTours = (initialPageSize: number = 5) => {
  const [page, setPage] = useState(1);
  const [search, setSearchState] = useState("");
  const [categoryId, setCategoryIdState] = useState<number | null>(null);
  const [createdByMe, setCreatedByMeState] = useState(false);
  const [categories, setCategories] = useState<ReadCategoryDTO[]>([]);
  const [isCategoryLoading, setIsCategoryLoading] = useState(false);
  const [data, setData] = useState<PaginatedResponse<Tour> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [togglingTourId, setTogglingTourId] = useState<number | null>(null);

  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const fetchTours = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getTours(
        page,
        initialPageSize,
        search,
        categoryId,
        createdByMe,
      );
      setData(res);
      setError(null);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to load tours"));
    } finally {
      setIsLoading(false);
    }
  }, [categoryId, createdByMe, initialPageSize, page, search]);

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
        const firstPage = await categoryService.getAllCategories(
          1,
          CATEGORY_PAGE_SIZE,
        );
        const allCategories = [...(firstPage.data ?? [])];

        if (firstPage.totalPages > 1) {
          const remainingPages = await Promise.all(
            Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
              categoryService.getAllCategories(index + 2, CATEGORY_PAGE_SIZE),
            ),
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

  const setCategoryId = (value: number | null) => {
    setCategoryIdState(value);
    setPage(1);
  };

  const setCreatedByMe = (value: boolean) => {
    setCreatedByMeState(value);
    setPage(1);
  };

  const clearFilters = () => {
    setSearchState("");
    setCategoryIdState(null);
    setCreatedByMeState(false);
    setPage(1);
  };

  const handleCreate = () => navigate(PATH.MANAGER.CREATE_TOUR);
  const handleEdit = (id: number) => navigate(PATH.MANAGER.EDIT_TOUR(id));
  const handleDelete = (id: number) => navigate(PATH.MANAGER.DELETE_TOUR(id));
  const handleView = (id: number) => navigate(PATH.MANAGER.TOUR_DETAIL(id));

  const handleToggleStatus = async (tour: Tour) => {
    const shouldActivate = tour.status !== "Active";

    try {
      setTogglingTourId(tour.id);
      await activeTour(tour.id, shouldActivate);
      success(`Tour successfully ${shouldActivate ? "activated" : "deactivated"}!`);
      await fetchTours();
    } catch (err: unknown) {
      showError(getErrorMessage(err, "Failed to update tour status."));
    } finally {
      setTogglingTourId(null);
    }
  };

  return {
    data,
    isLoading,
    error,
    page,
    setPage,
    search,
    setSearch,
    categoryId,
    setCategoryId,
    createdByMe,
    setCreatedByMe,
    clearFilters,
    categories,
    isCategoryLoading,
    pageSize: initialPageSize,
    handleCreate,
    handleEdit,
    handleDelete,
    handleView,
    handleToggleStatus,
    togglingTourId,
  };
};
