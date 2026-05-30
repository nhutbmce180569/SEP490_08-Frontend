import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { FULL_API } from "../../../../config/api/api";

export interface EligibleSchedule {
  scheduleId: number;
  tourName: string;
  departureDate: string;
  returnDate: string;
  statusContext: string;
}

const fetchEligibleSchedules = async (): Promise<EligibleSchedule[]> => {
  const token = localStorage.getItem("accessToken");
  const response = await axios.get(`${FULL_API}/users/me/eligible-schedules`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  // API trả về format { message: string, data: [] }, nên chúng ta chỉ lấy phần data
  return response.data.data;
};

export const useGetEligibleSchedules = () => {
  return useQuery({
    queryKey: ["eligibleSchedules"],
    queryFn: fetchEligibleSchedules,
  });
};