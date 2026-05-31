import { apiClient } from '../../../utils/axiosClient';
import { VOUCHER_API } from '../../../config/api/voucher.api';
import type {
  CreateVoucherDTO,
  ReadVoucherDetailDTO,
  ReadVoucherDTO,
  UpdateVoucherDTO,
  VoucherFilters,
} from '../types/voucher';
import type { PaginationDTO } from '../types/pagination';

const unwrap = <T>(response: unknown): T => {
  const data = response as Record<string, unknown>;
  if (data?.totalPages !== undefined) return response as T;
  if (data?.id !== undefined) return response as T;
  return (data?.data ?? response) as T;
};

export const voucherService = {
  getAll: async (
    page: number,
    pageSize: number,
    filters?: VoucherFilters,
  ): Promise<PaginationDTO<ReadVoucherDTO>> => {
    const params: Record<string, string | number | boolean> = { page, pageSize };

    if (filters?.search?.trim()) params.search = filters.search.trim();
    if (filters?.tourId) params.tourId = filters.tourId;
    if (filters?.discountType) params.discountType = filters.discountType;
    if (filters?.status) params.status = filters.status;
    if (filters?.isActive !== undefined) params.isActive = filters.isActive;

    const response = await apiClient.get<PaginationDTO<ReadVoucherDTO>>(VOUCHER_API.GET_ALL, { params });
    return unwrap<PaginationDTO<ReadVoucherDTO>>(response);
  },

  getById: async (id: number | string): Promise<ReadVoucherDetailDTO> => {
    const response = await apiClient.get<ReadVoucherDetailDTO>(VOUCHER_API.GET_BY_ID(id));
    return unwrap<ReadVoucherDetailDTO>(response);
  },

  create: async (data: CreateVoucherDTO): Promise<ReadVoucherDetailDTO> => {
    const response = await apiClient.post<ReadVoucherDetailDTO>(VOUCHER_API.CREATE, data);
    return unwrap<ReadVoucherDetailDTO>(response);
  },

  update: async (id: number | string, data: UpdateVoucherDTO): Promise<ReadVoucherDetailDTO> => {
    const response = await apiClient.put<ReadVoucherDetailDTO>(VOUCHER_API.UPDATE(id), data);
    return unwrap<ReadVoucherDetailDTO>(response);
  },

  activate: async (id: number | string): Promise<ReadVoucherDTO> => {
    const response = await apiClient.patch<ReadVoucherDTO>(VOUCHER_API.ACTIVATE(id));
    return unwrap<ReadVoucherDTO>(response);
  },

  deactivate: async (id: number | string): Promise<ReadVoucherDTO> => {
    const response = await apiClient.patch<ReadVoucherDTO>(VOUCHER_API.DEACTIVATE(id));
    return unwrap<ReadVoucherDTO>(response);
  },
};
