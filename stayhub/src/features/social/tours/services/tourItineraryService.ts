import axios from "axios";
import { FULL_API } from "../../../../config/api/api";
import { withLanguageHeaders } from "../../../../utils/httpLanguage";

export interface ItineraryLocation {
  id: number;
  dayNumber: number;
  title: string;
  locationName: string;
  locationLat: number;
  locationLng: number;
  startDuration: string | null;
  endDuration: string | null;
}

export const getTourItineraries = async (tourId: number): Promise<ItineraryLocation[]> => {
  const response = await axios.get(`${FULL_API}/tours/${tourId}/itineraries`, {
    headers: withLanguageHeaders(),
  });
  return response.data.data;
};

export const getScheduleItineraries = async (scheduleId: number): Promise<ItineraryLocation[]> => {
  const token = localStorage.getItem("accessToken");
  const response = await axios.get(`${FULL_API}/tourschedules/${scheduleId}/itineraries`, {
    headers: withLanguageHeaders({
      Authorization: `Bearer ${token}`,
    }),
  });
  return response.data.data;
};