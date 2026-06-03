import axios from "axios";
import { FULL_API } from "../../../../config/api/api";
import { withLanguageHeaders } from "../../../../utils/httpLanguage";

export interface TrackingInfo {
  userId: number;
  fullName: string;
  lat: number;
  lng: number;
  lastUpdated: string;
  avatarUrl?: string;
}

const getAuthConfig = () => {
  const token = localStorage.getItem("accessToken");
  return {
    headers: withLanguageHeaders({
      Authorization: `Bearer ${token}`,
    }),
  };
};

export const trackingService = {
  generateTrackingToken: async (): Promise<string> => {
    const response = await axios.post(`${FULL_API}/locations/share`, {}, getAuthConfig());
    // Dựa theo cách backend trả về, thông thường sẽ nằm trong response.data hoặc response.data.token
    return response.data?.token || response.data;
  },

  getPublicTrackingInfo: async (token: string): Promise<TrackingInfo> => {
    const response = await axios.get(`${FULL_API}/locations/track/${token}`, {
      headers: withLanguageHeaders(),
    });
    return response.data;
  },
};