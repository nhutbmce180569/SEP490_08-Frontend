import type { TourBasic } from "./tour";
import type { TourScheduleItinerary } from "./tourScheduleItinerary";
// import type { TourScheduleTicket } from "./tourScheduleTicket"; 
import type { TourScheduleStaff } from "./tourScheduleStaff";

// Map theo ReadTourScheduleDTO
export interface TourSchedule {
  id: number;
  tourId: number;
  departureDate: string;
  returnDate: string;
  note?: string | null;
  tour?: TourBasic; 
  tourScheduleStaffs?: TourScheduleStaff[];
  tourScheduleItineraries?: TourScheduleItinerary[];
  // tourScheduleTickets?: TourScheduleTicket[]; // 
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

// Map theo BaseTourScheduleDTO
export interface CreateTourScheduleRequest {
  tourId: number;
  departureDate: string; 
  returnDate: string;
  note?: string | null;
}

// Update dùng chung form với Create
export interface UpdateTourScheduleRequest extends CreateTourScheduleRequest { }