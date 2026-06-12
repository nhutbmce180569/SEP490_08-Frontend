import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { FULL_API } from "../../../../config/api/api";
import { withLanguageHeaders } from "../../../../utils/httpLanguage";

export interface EligibleSchedule {
  scheduleId: number;
  tourName: string;
  departureDate: string;
  returnDate: string;
  statusContext: string;
}

const fetchEligibleSchedules = async (): Promise<EligibleSchedule[]> => {
  const token = localStorage.getItem("accessToken");
  
  const response = await axios.get(`${FULL_API}/orders/me/eligible-schedules`, {
    headers: withLanguageHeaders({
      Authorization: `Bearer ${token}`,
    }),
  });
  
  const rawData = response.data?.data || response.data || [];

  return rawData.map((item: any) => {
    const mappedTourName = item.tourName || item.TourName || item.name || item.Name || item.title || `Tour #${item.scheduleId || item.ScheduleId}`;

    return {
      scheduleId: item.scheduleId || item.ScheduleId || item.id || 0,
      tourName: mappedTourName,
      departureDate: item.departureDate || item.DepartureDate || new Date().toISOString(),
      returnDate: item.returnDate || item.ReturnDate || new Date().toISOString(),
      statusContext: item.statusContext || item.StatusContext || "",
    };
  });
};

export const useGetEligibleSchedules = () => {
  return useQuery({
    queryKey: ["eligibleSchedules"],
    queryFn: fetchEligibleSchedules,
  });
};