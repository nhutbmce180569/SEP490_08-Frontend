import axios from "axios";
import { API_BASE_URL } from "../../../../config/api/api";
import { withLanguageHeaders } from "../../../../utils/httpLanguage";
import { apiClient } from "../../../../utils/axiosClient";

export interface ScheduleLocationInfo {
  userId: number;
  fullName: string;
  avatarUrl?: string | null;
  lat: number;
  lng: number;
  lastUpdated: string;
}

export interface TourWaypoint {
  name: string;
  lat: number;
  lng: number;
  sequence: number;
}

export interface TourRouteResponse {
  scheduleId: number;
  tourName: string;
  waypoints: TourWaypoint[];
  geometryCoordinates: [number, number][];
}

export const scheduleTrackingService = {
  // ✅ Dùng axios + token từ localStorage (endpoint yêu cầu auth)
  getScheduleLiveLocations: async (scheduleId: number): Promise<ScheduleLocationInfo[]> => {
    const token = localStorage.getItem("accessToken");
    const response = await axios.get(
      `${API_BASE_URL}/api/locations/schedules/${scheduleId}/live`,
      {
        headers: {
          ...withLanguageHeaders(),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
    );
    return response.data?.data || response.data || [];
  },

  getTourRoute: async (scheduleId: number): Promise<TourRouteResponse> => {
    const response = await apiClient.get<any>(`/TourSchedules/${scheduleId}/route`);
    return response?.data?.data || response?.data || response;
  },
};