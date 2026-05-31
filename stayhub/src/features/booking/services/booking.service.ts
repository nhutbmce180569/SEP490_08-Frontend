import { apiClient } from "../../../utils/axiosClient";
import type { CreateOrderRequest, ReadOrderDTO } from "../types/booking";
import { BOOKINGS_API } from "../../../config/api/bookings.api";

const unwrapApiResponse = <T>(response: any): T => {
  if (!response || typeof response !== "object" || !("data" in response)) {
    return response as T;
  }

  const isPaginatedPayload =
    Array.isArray(response.data) &&
    ("currentPage" in response ||
      "totalPages" in response ||
      "page" in response ||
      "pageSize" in response ||
      "totalCount" in response);

  if (isPaginatedPayload) {
    return response as T;
  }

  return unwrapApiResponse<T>(response.data);
};

export const createOrder = async (data: CreateOrderRequest) => {
  const response: unknown = await apiClient.post(
    BOOKINGS_API.CREATE_ORDER,
    data,
  );
  const order = unwrapApiResponse<ReadOrderDTO>(response);
  if (!order || typeof order !== "object" || !("id" in order)) {
    throw new Error("Invalid order response from server.");
  }
  return order;
};

export const getOrdersByScheduleId = async (scheduleId: number) => {
  const response: any = await apiClient.get(BOOKINGS_API.GET_ORDERS_BY_SCHEDULE(scheduleId));
  return unwrapApiResponse(response);
};

export const getOrdersByUserId = async (userId: string | number, page: number = 1, pageSize: number = 5) => {
  const response: any = await apiClient.get(BOOKINGS_API.GET_CUSTOMER_ORDERS_BY_USER(userId), { params: { page, pageSize } });
  return unwrapApiResponse(response);
};

export const getOrderById = async (orderId: string | number) => {
  const response: any = await apiClient.get(BOOKINGS_API.GET_ORDER_BY_ID(orderId));
  return unwrapApiResponse<ReadOrderDTO | null>(response);
};

export const cancelOrder = async (orderId: string | number) => {
  const response: any = await apiClient.patch(BOOKINGS_API.CANCEL_ORDER(orderId));
  return unwrapApiResponse(response);
};
