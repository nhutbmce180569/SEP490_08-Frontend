import axios from "axios";
import { BOOKINGS_API } from "../../../config/api/bookings.api";
import type {
  CreateCancellationRequestDTO,
  ProcessCancellationDTO,
  CancellationRequestListDTO,
  CancellationRequestDetailDTO,
} from "../types/cancellation";

// Cấu hình Header mặc định mang theo Token (Authorization)
const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
});

export const cancellationService = {
  createRequest: async (data: CreateCancellationRequestDTO) => {
    const response = await axios.post(BOOKINGS_API.CREATE_CANCELLATION_REQUEST, data, { headers: getHeaders() });
    return response.data;
  },

  getRequests: async (status?: string) => {
    const params = status ? { status } : {};
    const response = await axios.get<{ message: string; data: CancellationRequestListDTO[] }>(
      BOOKINGS_API.GET_CANCELLATION_REQUESTS,
      { params, headers: getHeaders() }
    );
    return response.data.data;
  },

  getRequestDetail: async (id: number | string) => {
    const response = await axios.get<{ message: string; data: CancellationRequestDetailDTO }>(
      BOOKINGS_API.GET_CANCELLATION_REQUEST_DETAIL(id),
      { headers: getHeaders() }
    );
    return response.data.data;
  },

  processRequest: async (id: number | string, data: ProcessCancellationDTO) => {
    const response = await axios.put(BOOKINGS_API.PROCESS_CANCELLATION_REQUEST(id), data, { headers: getHeaders() });
    return response.data;
  },
};
