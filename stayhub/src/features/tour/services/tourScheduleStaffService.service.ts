import { apiClient } from "../../auth/utils/axiosClient";
import { TOURS_API } from "../../../config/api/tours.api";
import type { AssignedTourSchedule, AssignStaffPayload, RemoveStaffResponse, StaffAssignmentResponse } from "../types/tourScheduleStaff";
import type { PaginationResponse } from "../types/tourSchedule";


export const tourScheduleStaffService = {
  getStaffBySchedule: async (scheduleId: number) => {
    const response = await apiClient.get<any>(
      TOURS_API.GET_STAFF_BY_SCHEDULE(scheduleId),
    );
    return response.data?.data || response.data || [];
  },

  assignStaff: async (
    payload: AssignStaffPayload,
  ): Promise<StaffAssignmentResponse> => {
    return await apiClient.post<StaffAssignmentResponse>(
      TOURS_API.ASSIGN_STAFF,
      {
        ...payload,
        assignedRole: payload.assignedRole || "Staff",
      },
    );
  },

  removeStaff: async (
    scheduleId: number,
    staffId: number,
  ): Promise<RemoveStaffResponse> => {
    return await apiClient.delete<RemoveStaffResponse>(
      TOURS_API.REMOVE_STAFF(scheduleId, staffId),
    );
  },

  getAssignedSchedules: async (
    page: number = 1,
    pageSize: number = 10,
    upcomingOnly: boolean = false,
    tourName?: string,
  ): Promise<PaginationResponse<AssignedTourSchedule>> => {
    return await apiClient.get<PaginationResponse<AssignedTourSchedule>>(
      TOURS_API.GET_ASSIGNED_SCHEDULES,
      {
        params: {
          page,
          pageSize,
          upcomingOnly,
          ...(tourName?.trim() ? { tourName: tourName.trim() } : {}),
        },
      },
    );
  },
};
