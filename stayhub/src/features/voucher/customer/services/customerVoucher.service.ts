import { apiClient } from '../../../../utils/axiosClient';
import { VOUCHER_API } from '../../../../config/api/voucher.api';
import type {
  ApplyVoucherDTO,
  ApplyVoucherResultDTO,
  ReadSavedVoucherDTO,
  SaveVoucherDTO,
} from '../types/customerVoucher';
import type { PaginationDTO } from '../../types/pagination';

const unwrap = <T>(response: unknown): T => {
  const data = response as Record<string, unknown>;
  if (data?.totalPages !== undefined) return response as T;
  if (data?.userVoucherId !== undefined || data?.code !== undefined) return response as T;
  return (data?.data ?? response) as T;
};

export const customerVoucherService = {
  saveVoucher: async (dto: SaveVoucherDTO): Promise<ReadSavedVoucherDTO> => {
    const response = await apiClient.post<ReadSavedVoucherDTO>(VOUCHER_API.SAVE_VOUCHER, dto);
    return unwrap<ReadSavedVoucherDTO>(response);
  },

  getMyVouchers: async (
    page: number,
    pageSize: number,
    status?: string,
  ): Promise<PaginationDTO<ReadSavedVoucherDTO>> => {
    const params: Record<string, string | number> = { page, pageSize };
    if (status) params.status = status;

    const response = await apiClient.get<PaginationDTO<ReadSavedVoucherDTO>>(
      VOUCHER_API.GET_MY_VOUCHERS,
      { params },
    );
    return unwrap<PaginationDTO<ReadSavedVoucherDTO>>(response);
  },

  applyVoucher: async (dto: ApplyVoucherDTO): Promise<ApplyVoucherResultDTO> => {
    const response = await apiClient.post<ApplyVoucherResultDTO>(VOUCHER_API.APPLY_VOUCHER, dto);
    return unwrap<ApplyVoucherResultDTO>(response);
  },

  redeemVoucher: async (dto: ApplyVoucherDTO): Promise<ApplyVoucherResultDTO> => {
    const response = await apiClient.post<ApplyVoucherResultDTO>(VOUCHER_API.REDEEM_VOUCHER, dto);
    return unwrap<ApplyVoucherResultDTO>(response);
  },
};
