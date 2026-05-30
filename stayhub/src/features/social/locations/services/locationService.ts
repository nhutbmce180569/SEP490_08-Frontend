import axios from "axios";
import { FULL_API } from "../../../../config/api/api";

const getAuthHeaders = () => {
  const token = localStorage.getItem("accessToken");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const locationService = {
  getLiveFriends: async () => {
    const response = await axios.get(`${FULL_API}/locations/friends/live`, getAuthHeaders());
    return response.data;
  },
  pingLocation: async (lat: number, lng: number, scheduleId: number | null = null) => {
    const response = await axios.post(`${FULL_API}/locations/ping`, { lat, lng, scheduleId }, getAuthHeaders());
    return response.data;
  }
};