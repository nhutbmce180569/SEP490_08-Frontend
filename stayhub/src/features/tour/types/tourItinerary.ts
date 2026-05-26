export interface TourItinerary {
  id: number;
  tourId: number;
  dayNumber: number;
  title: string;
  description?: string | null;
  startDuration?: string | null;
  endDuration?: string | null;
  locationName?: string | null;
  locationLat?: number | null;
  locationLng?: number | null;
}

export interface CreateItineraryRequest {
  tourId: number;
  dayNumber: number;
  title?: string | null;
  description?: string | null;
  startDuration?: string | null;
  endDuration?: string | null;
  locationName?: string | null;
  locationLat?: number | null;
  locationLng?: number | null;
}

export interface UpdateItineraryRequest {
  tourId: number;
  dayNumber: number;
  title?: string | null;
  description?: string | null;
  startDuration?: string | null;
  endDuration?: string | null;
  locationName?: string | null;
  locationLat?: number | null;
  locationLng?: number | null;
}
