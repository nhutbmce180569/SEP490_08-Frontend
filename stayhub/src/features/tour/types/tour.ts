export interface TourSchedule {
  id: number;
  price: number;
}

export interface TourItinerary {
  id: number;
  title: string;
}

export interface TourReview {
  id: number;
  rating: number;
}

export interface Tour {
  id: number;
  name: string;
  city?: string;
  country?: string;
  imageUrl?: string;
  averageStar?: number;
  reviews?: TourReview[];
  tourSchedules?: TourSchedule[];
  tourItineraries?: TourItinerary[];
}
