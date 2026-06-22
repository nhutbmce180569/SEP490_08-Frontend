import type { TourBasic } from "./tour";
import type { TourScheduleItinerary } from "./tourScheduleItinerary";
import type { TourScheduleTicket } from "./tourScheduleTicket"; 
import type { TourScheduleStaff } from "./tourScheduleStaff";

export interface TourSchedule {
  id: number;
  tourId: number;
  departureDate: string;
  returnDate: string;
  note?: string | null;
  canEdit?: boolean;
  tour?: TourBasic; 
  tourScheduleStaffs?: TourScheduleStaff[];
  tourScheduleItineraries?: TourScheduleItinerary[];
  tourScheduleTickets?: TourScheduleTicket[] | null;
}



// Map theo BaseTourScheduleDTO
export interface CreateTourScheduleRequest {
  tourId: number;
  departureDate: string; 
  returnDate: string;
  note?: string | null;
}

// Update dùng chung form với Create
export type UpdateTourScheduleRequest = CreateTourScheduleRequest;

export interface PaginationResponse<T> {
  data: T[];
  total: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}
