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
    if (filters?.voucherType) params.voucherType = filters.voucherType;
    if (filters?.createdByMe !== undefined) params.createdByMe = filters.createdByMe;

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

  getBirthdayVoucherPreview: async (
    month: number,
    year?: number,
  ): Promise<{
    month: number;
    year: number;
    voucherCode: string;
    isDistributed: boolean;
    totalEligibleCustomers: number;
    customers: Array<{ id: number; fullName: string; email: string; status: string }>;
  }> => {
    const params = { month, year: year ?? new Date().getFullYear() };
    const response = await apiClient.get(VOUCHER_API.DISTRIBUTE_BIRTHDAY_PREVIEW, { params });
    return unwrap(response);
  },

  distributeBirthdayVouchers: async (
    month?: number,
    options?: {
      discountType?: string;
      discountValue?: number;
      maxDiscountAmount?: number;
      startDate?: string;
      endDate?: string;
    },
  ): Promise<{ voucherCode: string; totalEligibleCustomers: number; emailsSent: number; message: string }> => {
    const params: Record<string, string | number> = {};
    if (month) params.month = month;
    if (options?.discountType) params.discountType = options.discountType;
    if (options?.discountValue) params.discountValue = options.discountValue;
    if (options?.maxDiscountAmount) params.maxDiscountAmount = options.maxDiscountAmount;
    if (options?.startDate) params.startDate = options.startDate;
    if (options?.endDate) params.endDate = options.endDate;

    const response = await apiClient.post(VOUCHER_API.DISTRIBUTE_BIRTHDAY, undefined, { params });
    return unwrap(response);
  },

  checkBirthdayVoucherStatus: async (month: number, year: number): Promise<{ isDistributed: boolean }> => {
    const params = { month, year };
    const response = await apiClient.get(VOUCHER_API.DISTRIBUTE_BIRTHDAY_STATUS, { params });
    return unwrap(response);
  },

  cancelBirthdayVouchers: async (month: number, year: number): Promise<{ message: string }> => {
    const params = { month, year };
    const response = await apiClient.delete(VOUCHER_API.DISTRIBUTE_BIRTHDAY, { params });
    return unwrap(response);
  },
};
