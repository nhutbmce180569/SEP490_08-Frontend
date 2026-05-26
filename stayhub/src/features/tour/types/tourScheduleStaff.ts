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