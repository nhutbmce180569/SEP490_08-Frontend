import { apiClient } from "../../../utils/axiosClient";
import type { CreateOrderRequest, ReadOrderDTO } from "../types/booking";
import { BOOKINGS_API } from "../../../config/api/bookings.api";

export interface OrderPaginationResponse {
  data: ReadOrderDTO[];
  total?: number;
  totalPages: number;
  currentPage: number;
  pageSize?: number;
}

const unwrapApiResponse = <T>(response: unknown): T => {
  if (!response || typeof response !== "object" || !("data" in response)) {
    return response as T;
  }

  const apiResponse = response as {
    data?: unknown;
    currentPage?: unknown;
    totalPages?: unknown;
    page?: unknown;
    pageSize?: unknown;
    totalCount?: unknown;
  };

  const isPaginatedPayload =
    Array.isArray(apiResponse.data) &&
    ("currentPage" in apiResponse ||
      "totalPages" in apiResponse ||
      "page" in apiResponse ||
      "pageSize" in apiResponse ||
      "totalCount" in apiResponse);

  if (isPaginatedPayload) {
    return response as T;
  }

  return unwrapApiResponse<T>(apiResponse.data);
};

export const createOrder = async (data: CreateOrderRequest, idempotencyKey: string) => {
  const response: unknown = await apiClient.post(
    BOOKINGS_API.CREATE_ORDER,
    data,
    {
      headers: {
        "Idempotency-Key": idempotencyKey,
      },
    }
  );
  const order = unwrapApiResponse<ReadOrderDTO>(response);
  if (!order || typeof order !== "object" || !("id" in order)) {
    throw new Error("Invalid order response from server.");
  }
  return order;
};

export const getOrdersByScheduleId = async (scheduleId: number) => {
  const response: unknown = await apiClient.get(BOOKINGS_API.GET_ORDERS_BY_SCHEDULE(scheduleId));
  return unwrapApiResponse(response);
};

export const getScheduleCustomersByScheduleId = async (
  scheduleId: number,
  params?: {
    attendeeName?: string;
  }
) => {
  const response: unknown = await apiClient.get(
    BOOKINGS_API.GET_SCHEDULE_CUSTOMERS(scheduleId),
    { params }
  );
  return unwrapApiResponse(response);
};

export const getOrdersByUserId = async (
  userId: string | number,
  page: number = 1,
  pageSize: number = 5,
  status?: string | null,
): Promise<OrderPaginationResponse> => {
  const response: unknown = await apiClient.get(
    BOOKINGS_API.GET_CUSTOMER_ORDERS_BY_USER(userId),
    { params: { page, pageSize, status: status || undefined } },
  );
  return unwrapApiResponse<OrderPaginationResponse>(response);
};

export const getOrderById = async (orderId: string | number) => {
  const response: unknown = await apiClient.get(BOOKINGS_API.GET_ORDER_BY_ID(orderId));
  return unwrapApiResponse<ReadOrderDTO | null>(response);
};

export const cancelOrder = async (orderId: string | number) => {
  const response: unknown = await apiClient.patch(BOOKINGS_API.CANCEL_ORDER(orderId));
  return unwrapApiResponse(response);
};
