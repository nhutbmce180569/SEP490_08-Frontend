import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { customerVoucherService } from '../services/customerVoucher.service';

const PAGE_SIZE = 8;

export const useMyVouchers = () => {
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ['myVouchers', page, PAGE_SIZE, 'Available'],
    queryFn: () => customerVoucherService.getMyVouchers(page, PAGE_SIZE, 'Available'),
  });

  const validVouchers = useMemo(() => {
    const rawList = query.data?.data ?? [];
    const now = Date.now();
    return rawList.filter((v) => {
      const isStatusAvailable = v.status === 'Available';
      const isVoucherActive = v.isActive && (v.voucherStatus === 'Active' || v.voucherStatus === 'Scheduled');
      const hasQuantity = v.quantity > 0;
      const notExpired = new Date(v.endDate).getTime() >= now;
      return isStatusAvailable && isVoucherActive && hasQuantity && notExpired;
    });
  }, [query.data]);

  return {
    data: query.data,
    vouchers: validVouchers,
    isLoading: query.isLoading,
    error: query.isError ? 'Failed to load your vouchers.' : null,
    pageSize: PAGE_SIZE,
    setPage,
    resetPage: () => setPage(1),
    refetch: query.refetch,
  };
};
