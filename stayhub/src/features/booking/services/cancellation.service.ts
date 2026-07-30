import { apiClient } from "../../../utils/axiosClient";
import { BOOKINGS_API } from "../../../config/api/bookings.api";
import type {
  CreateCancellationRequestDTO,
  ProcessCancellationDTO,
  CancellationRequestListDTO,
  CancellationRequestDetailDTO,
  CancellationRequestPaginationDTO,
} from "../types/cancellation";

type RawPagination = Partial<CancellationRequestPaginationDTO> & {
  items?: CancellationRequestListDTO[];
  totalCount?: number;
  count?: number;
  page?: number;
};

const unwrapData = <T>(response: any): T => {
  if (response && typeof response === "object" && "data" in response) {
    return response.data as T;
  }

  return response as T;
};

const normalizeCancellationPagination = (
  response: any,
  page: number,
  pageSize: number,
): CancellationRequestPaginationDTO => {
  const payload = unwrapData<RawPagination | CancellationRequestListDTO[]>(response);

  if (Array.isArray(payload)) {
    return {
      data: payload,
      total: payload.length,
      totalPages: 1,
      currentPage: page,
      pageSize,
    };
  }

  const data = payload.data ?? payload.items ?? [];
  const total = payload.total ?? payload.totalCount ?? payload.count ?? data.length;
  const normalizedPageSize = payload.pageSize ?? pageSize;

  return {
    data,
    total,
    totalPages: payload.totalPages ?? Math.max(1, Math.ceil(total / normalizedPageSize)),
    currentPage: payload.currentPage ?? payload.page ?? page,
    pageSize: normalizedPageSize,
  };
};

export const cancellationService = {
  createRequest: async (data: CreateCancellationRequestDTO) => {
    return apiClient.post<{ message: string; data: CancellationRequestDetailDTO }>(
      BOOKINGS_API.CREATE_CANCELLATION_REQUEST,
      data,
    );
  },

  getRequests: async (status?: string, date?: string, tourId?: number | string, page: number = 1, pageSize: number = 5) => {
    const params: Record<string, string | number> = { page, pageSize };
    if (status) params.status = status;
    if (date) params.date = date;
    if (tourId) params.tourId = Number(tourId);

    const response = await apiClient.get<{ message: string; data: RawPagination } | RawPagination>(
      BOOKINGS_API.GET_CANCELLATION_REQUESTS,
      { params },
    );

    return normalizeCancellationPagination(response, page, pageSize);
  },

  getRequestDetail: async (id: number | string) => {
    const response = await apiClient.get<
      { message: string; data: CancellationRequestDetailDTO } | CancellationRequestDetailDTO
    >(BOOKINGS_API.GET_CANCELLATION_REQUEST_DETAIL(id));

    return unwrapData<CancellationRequestDetailDTO>(response);
  },

  processRequest: async (id: number | string, data: ProcessCancellationDTO) => {
    return apiClient.put<{ message: string; data: CancellationRequestDetailDTO }>(
      BOOKINGS_API.PROCESS_CANCELLATION_REQUEST(id),
      data,
    );
  },
};
