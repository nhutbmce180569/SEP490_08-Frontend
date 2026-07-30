export interface TourScheduleStaff {
  id: number;
  scheduleId: number;
  staffId: number;
  assignedRole?: string | null;
}

export interface CreateTourScheduleStaffRequest {
  scheduleId: number;
  staffId: number;
  assignedRole?: string | null;
}

export interface AssignedTourSchedule {
  scheduleId: number;
  tourId: number;
  departureDate: string;
  returnDate: string;
  tourName?: string | null;
  tourImageUrl?: string | null;
  assignedRole?: string | null;
}

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
