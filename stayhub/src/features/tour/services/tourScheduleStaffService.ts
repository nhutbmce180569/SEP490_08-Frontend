
import { apiClient } from '../../auth/utils/axiosClient';

export interface AssignStaffPayload {
  scheduleId: number;
  staffId: number;
  assignedRole?: string;
}

export interface StaffAssignmentResponse {
  id: number;
  scheduleId: number;
  staffId: number;
  assignedRole: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RemoveStaffResponse {
  success: boolean;
  message: string;
}

/**
 * Tour Schedule Staff Management API Service
 * Handles assignment and removal of staff members from tour schedules
 */
export const tourScheduleStaffService = {
  /**
   * Get staff assigned to a schedule
   * @param scheduleId - Schedule ID
   */
  getStaffBySchedule: async (scheduleId: number) => {
    const response = await apiClient.get(`/tourschedulestaffs/schedule/${scheduleId}`);
    return response.data?.data || response.data || [];
  },

  /**
   * Assign staff member to a tour schedule
   * @param payload - { scheduleId, staffId, assignedRole }
   * @returns Promise with assigned staff details
   * @throws Error with message from backend if conflict or validation fails
   */
  assignStaff: async (payload: AssignStaffPayload): Promise<StaffAssignmentResponse> => {
    const response = await apiClient.post<StaffAssignmentResponse>(
      '/tourschedulestaffs',
      {
        ...payload,
        assignedRole: payload.assignedRole || 'Staff'
      }
    );
    return response.data;
  },

  /**
   * Remove staff member from a tour schedule
   * @param scheduleId - Schedule ID
   * @param staffId - Staff ID to remove
   * @returns Promise with response from backend
   */
  removeStaff: async (
    scheduleId: number,
    staffId: number
  ): Promise<RemoveStaffResponse> => {
    const response = await apiClient.delete<RemoveStaffResponse>(
      `/tourschedulestaffs/schedule/${scheduleId}/staff/${staffId}`
    );
    return response.data;
  },
};