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
  getScheduleLiveLocations: async (scheduleId: number): Promise<ScheduleLocationInfo[]> => {
    const response = await apiClient.get<any>(`/locations/schedules/${scheduleId}/live`);
    return response?.data || response;
  },

  getTourRoute: async (scheduleId: number): Promise<TourRouteResponse> => {
    const response = await apiClient.get<any>(`/TourSchedules/${scheduleId}/route`);
    // Đảm bảo bóc tách đúng data field dựa theo format response chuẩn của BaseResponse
    return response?.data?.data || response?.data || response;
  },
};
