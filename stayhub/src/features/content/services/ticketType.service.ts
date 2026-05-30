import { apiClient } from "../../../utils/axiosClient";
import { CONTENT_API } from "../../../config/api/content.api";
import type {
  CreateTicketTypeDTO,
  ReadTicketTypeDTO,
  TicketTypePaginationDTO,
  UpdateTicketTypeDTO,
} from "../types/ticketType";

type RawPagination<T> = {
  data?: T[] | RawPagination<T>;
  items?: T[];
  total?: number;
  totalCount?: number;
  currentPage?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
};

const normalizePagination = <T>(
  response: RawPagination<T> | T[],
  page: number,
  pageSize: number,
): TicketTypePaginationDTO<T> => {
  const payload =
    !Array.isArray(response) &&
    response.data &&
    !Array.isArray(response.data) &&
    ("totalPages" in response.data || "items" in response.data)
      ? response.data
      : response;

  const data = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.data)
      ? payload.data
      : Array.isArray(payload.items)
        ? payload.items
        : [];

  const total = Array.isArray(payload)
    ? data.length
    : (payload.total ?? payload.totalCount ?? data.length);
  const normalizedPageSize = Array.isArray(payload)
    ? pageSize
    : (payload.pageSize ?? pageSize);

  return {
    data,
    total,
    currentPage: Array.isArray(payload)
      ? page
      : (payload.currentPage ?? payload.page ?? page),
    pageSize: normalizedPageSize,
    totalPages: Array.isArray(payload)
      ? Math.max(1, Math.ceil(data.length / pageSize))
      : (payload.totalPages ?? Math.max(1, Math.ceil(total / normalizedPageSize))),
  };
};

const unwrapData = <T>(response: T | { data?: T }): T => {
  if (
    response &&
    typeof response === "object" &&
    "data" in response &&
    (response as { data?: T }).data
  ) {
    return (response as { data: T }).data;
  }

  return response as T;
};

export const ticketTypeService = {
  getAll: async (
    page: number = 1,
    pageSize: number = 10,
    searchTerm?: string,
  ): Promise<TicketTypePaginationDTO<ReadTicketTypeDTO>> => {
    const response = await apiClient.get<RawPagination<ReadTicketTypeDTO>>(
      CONTENT_API.TICKET_TYPES.GET_ALL,
      {
        params: {
          page,
          pageSize,
          ...(searchTerm?.trim() ? { searchTerm: searchTerm.trim() } : {}),
        },
      },
    );

    return normalizePagination(response, page, pageSize);
  },

  getActive: async (): Promise<ReadTicketTypeDTO[]> => {
    const response = await apiClient.get<ReadTicketTypeDTO[] | { data: ReadTicketTypeDTO[] }>(
      CONTENT_API.TICKET_TYPES.GET_ACTIVE,
    );

    const data = unwrapData(response);
    return Array.isArray(data) ? data : [];
  },

  getById: async (id: number | string): Promise<ReadTicketTypeDTO> => {
    const response = await apiClient.get<ReadTicketTypeDTO | { data: ReadTicketTypeDTO }>(
      CONTENT_API.TICKET_TYPES.GET_BY_ID(id),
    );

    return unwrapData(response);
  },

  create: async (data: CreateTicketTypeDTO): Promise<ReadTicketTypeDTO> => {
    const response = await apiClient.post<ReadTicketTypeDTO | { data: ReadTicketTypeDTO }>(
      CONTENT_API.TICKET_TYPES.CREATE,
      data,
    );

    return unwrapData(response);
  },

  update: async (
    id: number | string,
    data: UpdateTicketTypeDTO,
  ): Promise<{ message: string }> => {
    const response = await apiClient.put<{ message: string } | { data: { message: string } }>(
      CONTENT_API.TICKET_TYPES.UPDATE(id),
      data,
    );

    return unwrapData(response);
  },

  activate: async (id: number | string): Promise<{ message: string }> => {
    const response = await apiClient.patch<{ message: string } | { data: { message: string } }>(
      CONTENT_API.TICKET_TYPES.ACTIVATE(id),
    );

    return unwrapData(response);
  },

  deactivate: async (id: number | string): Promise<{ message: string }> => {
    const response = await apiClient.patch<{ message: string } | { data: { message: string } }>(
      CONTENT_API.TICKET_TYPES.DEACTIVATE(id),
    );

    return unwrapData(response);
  },
};
