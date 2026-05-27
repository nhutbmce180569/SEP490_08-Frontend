import type { TourBasic } from "./tour";
import type { TourScheduleItinerary } from "./tourScheduleItinerary";


// Map theo ReadTourScheduleDTO
export interface TourSchedule {
  id: number;
  tourId: number;
  departureDate: string;
  returnDate: string;
  price: number;
  maxCapacity: number;
  soldQuantity: number;
  availableSeats: number;
  note?: string | null;
  tour: TourBasic;
  tourScheduleItineraries?: TourScheduleItinerary[];
}

// Map theo BaseTourScheduleDTO
export interface CreateTourScheduleRequest {
  tourId: number;
  departureDate: string;
  returnDate: string;
  maxCapacity: number;
  availableSeats: number;
  price: number;
  status?: string | null;
  note?: string | null;
}

export interface UpdateTourScheduleRequest extends CreateTourScheduleRequest { }