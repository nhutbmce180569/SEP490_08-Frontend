import { apiClient } from "../../../../utils/axiosClient";

export interface ScheduleLocationInfo {
  userId: number;
  fullName: string;
  avatarUrl?: string | null;
  lat: number;
  lng: number;
  lastUpdated: string;
}

export const scheduleTrackingService = {
  getScheduleLiveLocations: async (scheduleId: number): Promise<ScheduleLocationInfo[]> => {
    const response = await apiClient.get<any>(`/locations/schedules/${scheduleId}/live`);
    return response?.data || response;
  },
};
