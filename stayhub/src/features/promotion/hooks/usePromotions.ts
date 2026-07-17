import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PATH } from '../../../config/routes/route';
import { promotionService } from '../services/promotion.service';
import type { PaginatedPromotions } from '../types/promotion';

interface UsePromotionsFilters {
  search?: string;
  status?: string;
}

export const usePromotions = (filters: UsePromotionsFilters) => {
  const [data, setData] = useState<PaginatedPromotions | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const navigate = useNavigate();

  const fetchPromotions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await promotionService.getAllPromotions(
        page,
        pageSize,
        filters.search,
        filters.status
      );
      setData(response);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to fetch promotions');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, filters.search, filters.status]);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  const handleCreate = () => {
    navigate(PATH.ADMIN.CREATE_ADMIN_PROMOTION);
  };

  const handleEdit = (id: string | number) => {
    navigate(PATH.ADMIN.EDIT_ADMIN_PROMOTION(id));
  };

  const handleView = (id: string | number) => {
    navigate(PATH.ADMIN.ADMIN_PROMOTION_DETAIL(id));
  };

  return {
    data,
    isLoading,
    error,
    pageSize,
    page,
    setPage,
    handleCreate,
    handleEdit,
    handleView,
    refetch: fetchPromotions
  };
};
