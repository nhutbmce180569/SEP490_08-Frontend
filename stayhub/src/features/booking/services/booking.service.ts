import { apiClient } from "../../../utils/axiosClient";
import type { CreateOrderRequest } from "../types/booking";
import { BOOKINGS_API } from "../../../config/api/bookings.api";

export const createOrder = async (data: CreateOrderRequest) => {
  const response: { data?: unknown; message?: string } = await apiClient.post(
    BOOKINGS_API.CREATE_ORDER,
    data,
  );
  const order = response?.data ?? response;
  if (!order || typeof order !== "object" || !("id" in order)) {
    throw new Error("Invalid order response from server.");
  }
  return order as import("../types/booking").ReadOrderDTO;
};

export const getOrdersByScheduleId = async (scheduleId: number) => {
  const response: any = await apiClient.get(BOOKINGS_API.GET_ORDERS_BY_SCHEDULE(scheduleId));
  return response.data?.data !== undefined ? response.data.data : response.data;
};

export const getOrdersByUserId = async (userId: string | number, page: number = 1, pageSize: number = 5) => {
  const response: any = await apiClient.get(BOOKINGS_API.GET_CUSTOMER_ORDERS_BY_USER(userId), { params: { page, pageSize } });
  return response.data !== undefined ? response.data : response;
};

export const getOrderById = async (orderId: string | number) => {
  const response: any = await apiClient.get(BOOKINGS_API.GET_ORDER_BY_ID(orderId));
  return response.data?.data !== undefined ? response.data.data : response.data;
};

export const cancelOrder = async (orderId: string | number) => {
  const response: any = await apiClient.patch(BOOKINGS_API.CANCEL_ORDER(orderId));
  return response.data !== undefined ? response.data : response;
};
