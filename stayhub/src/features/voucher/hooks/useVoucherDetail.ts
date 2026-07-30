import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PATH } from '../../../config/routes/route';
import { voucherService } from '../services/voucher.service';

export const useVoucherDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const query = useQuery({
    queryKey: ['voucher', id],
    queryFn: () => voucherService.getById(id!),
    enabled: !!id,
  });

  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  const handleEdit = () => navigate(isAdminRoute ? PATH.ADMIN.EDIT_ADMIN_VOUCHER(id!) : PATH.MANAGER.EDIT_OPERATOR_VOUCHER(id!));
  const handleBack = () => navigate(isAdminRoute ? PATH.ADMIN.SYSTEM_VOUCHERS : PATH.MANAGER.VOUCHERS);

  return {
    id,
    voucher: query.data,
    isLoading: query.isLoading,
    error: query.isError ? 'Failed to fetch voucher details.' : null,
    handleEdit,
    handleBack,
    refetch: query.refetch,
  };
};
