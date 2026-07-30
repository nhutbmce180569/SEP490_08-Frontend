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

const fetchEligibleSchedules = async (role: string, token: string | null): Promise<EligibleSchedule[]> => {
  if (!token) return [];

  let url = `${FULL_API}/orders/me/eligible-schedules`;
  if (role === "Manager") {
    url = `${FULL_API}/TourSchedules/my?page=1&pageSize=1000`;
  } else if (role === "Staff") {
    url = `${FULL_API}/TourScheduleStaffs/assigned?page=1&pageSize=1000`;
  }

  const response = await axios.get(url, {
    headers: withLanguageHeaders({
      Authorization: `Bearer ${token}`,
    }),
  });

  const rawData = response.data?.data || response.data || [];
  const list = Array.isArray(rawData) ? rawData : (rawData.data || []);

  return list.map((item: any) => {
    const scheduleId = item.scheduleId || item.ScheduleId || item.id || 0;
    let mappedTourName = item.tourName || item.TourName || item.tour?.name || item.tour?.Name || item.name || item.Name || item.title || `Tour #${scheduleId}`;

    const departureDate = item.departureDate || item.DepartureDate;
    if (departureDate) {
      const d = new Date(departureDate);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const dateStrWithZero = `${day}/${month}/${year}`;
      const dateStrWithoutZero = `${d.getDate()}/${d.getMonth() + 1}/${year}`;

      if (!mappedTourName.includes(dateStrWithZero) && !mappedTourName.includes(dateStrWithoutZero)) {
        mappedTourName = `${mappedTourName} - ${dateStrWithZero}`;
      }
    }

    return {
      scheduleId,
      tourName: mappedTourName,
      departureDate: departureDate || new Date().toISOString(),
      returnDate: item.returnDate || item.ReturnDate || new Date().toISOString(),
      statusContext: item.statusContext || item.StatusContext || "",
    };
  }).sort((a, b) => new Date(a.departureDate).getTime() - new Date(b.departureDate).getTime());
};

export const useGetEligibleSchedules = () => {
  const savedUser = localStorage.getItem("user");
  const token = localStorage.getItem("accessToken");

  let role = "Customer";
  if (savedUser) {
    try {
      const parsed = JSON.parse(savedUser);
      const roles = parsed.roles || parsed.Roles || [];
      if (Array.isArray(roles)) {
        if (roles.includes("Manager")) role = "Manager";
        else if (roles.includes("Staff")) role = "Staff";
        else if (roles.includes("Admin")) role = "Manager";
      } else if (typeof roles === "string") {
        if (roles === "Manager" || roles === "Admin") role = "Manager";
        else if (roles === "Staff") role = "Staff";
      }
    } catch (e) {
      console.error(e);
    }
  }

  return useQuery({
    queryKey: ["eligibleSchedules", role, token],
    queryFn: () => fetchEligibleSchedules(role, token),
  });
};