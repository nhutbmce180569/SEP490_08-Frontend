import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { customerVoucherService } from '../services/customerVoucher.service';
import type { WalletTab } from '../types/customerVoucher';

const PAGE_SIZE = 8;

const tabToStatus = (tab: WalletTab): string | undefined => {
  switch (tab) {
    case 'available': return 'Available';
    case 'used': return 'Used';
    case 'expired': return 'Expired';
    default: return undefined;
  }
};

export const useMyVouchers = (activeTab: WalletTab) => {
  const [page, setPage] = useState(1);
  const status = tabToStatus(activeTab);

  const query = useQuery({
    queryKey: ['myVouchers', page, PAGE_SIZE, status],
    queryFn: () => customerVoucherService.getMyVouchers(page, PAGE_SIZE, status),
  });

  return {
    data: query.data,
    vouchers: query.data?.data ?? [],
    isLoading: query.isLoading,
    error: query.isError ? 'Failed to load your vouchers.' : null,
    pageSize: PAGE_SIZE,
    setPage,
    resetPage: () => setPage(1),
    refetch: query.refetch,
  };
};
