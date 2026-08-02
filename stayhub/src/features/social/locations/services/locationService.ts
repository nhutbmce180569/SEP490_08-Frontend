import axios from "axios";
import { FULL_API } from "../../../../config/api/api";
import { withLanguageHeaders } from "../../../../utils/httpLanguage";

const getAuthHeaders = () => {
  const token = localStorage.getItem("accessToken");
  return {
    headers: withLanguageHeaders({
      Authorization: `Bearer ${token}`,
    }),
  };
};

export const locationService = {
  getLiveFriends: async () => {
    const response = await axios.get(`${FULL_API}/locations/friends/live`, getAuthHeaders());
    return response.data;
  },
  pingLocation: async (lat: number, lng: number, scheduleId: number | null = null) => {
    const response = await axios.post(`${FULL_API}/locations/ping`, { lat, lng, scheduleId, platform: "Web" }, getAuthHeaders());
    return response.data;
  },
  stopLocationSharing: async () => {
    const response = await axios.post(`${FULL_API}/locations/stop`, {}, getAuthHeaders());
    return response.data;
  }
};