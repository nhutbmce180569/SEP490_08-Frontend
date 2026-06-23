import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { PATH } from '../../../config/routes/route';
import { voucherService } from '../services/voucher.service';
import type { VoucherFilters } from '../types/voucher';

const PAGE_SIZE = 10;

export const useVouchers = (filters: VoucherFilters) => {
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const query = useQuery({
    queryKey: ['vouchers', page, PAGE_SIZE, filters],
    queryFn: () => voucherService.getAll(page, PAGE_SIZE, filters),
  });

  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  const handleCreate = () => navigate(isAdminRoute ? PATH.ADMIN.CREATE_ADMIN_VOUCHER : PATH.MANAGER.CREATE_OPERATOR_VOUCHER);
  const handleEdit = (id: number) => navigate(isAdminRoute ? PATH.ADMIN.EDIT_ADMIN_VOUCHER(id) : PATH.MANAGER.EDIT_OPERATOR_VOUCHER(id));
  const handleView = (id: number) => navigate(isAdminRoute ? PATH.ADMIN.ADMIN_VOUCHER_DETAIL(id) : PATH.MANAGER.OPERATOR_VOUCHER_DETAIL(id));

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.isError ? 'Failed to fetch vouchers.' : null,
    page,
    pageSize: PAGE_SIZE,
    setPage,
    handleCreate,
    handleEdit,
    handleView,
  };
};
