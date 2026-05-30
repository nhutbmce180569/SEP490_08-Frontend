export interface TourScheduleItinerary {
  id: number;
  scheduleId: number;
  itineraryDate: string;
  dayNumber: number;
  title?: string | null;
  description?: string | null;
  startDuration?: string | null;
  endDuration?: string | null;
  locationName?: string | null;
  locationLat?: number | null;
  locationLng?: number | null;
  tourismInfoId?: number | null;
}

export interface CreateTourScheduleItineraryRequest {
  scheduleId: number;
  itineraryDate: string;
  dayNumber: number;
  title?: string | null;
  description?: string | null;
  startDuration?: string | null;
  endDuration?: string | null;
  locationName?: string | null;
  locationLat?: number | null;
  locationLng?: number | null;
  tourismInfoId?: number | null;
}

export interface UpdateTourScheduleItineraryRequest extends CreateTourScheduleItineraryRequest { }

export interface CreateTourScheduleItineraryBatchRequest {
  itineraries: CreateTourScheduleItineraryRequest[];
}
