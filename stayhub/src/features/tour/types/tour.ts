import type { ReadReviewDTO } from "../../review/types/review";
import type { TourItinerary } from "./tourItinerary";
import type { TourSchedule } from "./tourSchedule";

// Map tương ứng với ReadTourDTO từ Backend C#
export interface Tour {
  id: number;
  categoryId: number;
  name: string;
  description?: string | null;
  status?: string | null;
  imageUrl?: string | null;
  country?: string | null;
  city?: string | null;
  address?: string | null;
  averageStar? : number | null;
  tourItineraries?: TourItinerary[];
  tourSchedules?: TourSchedule[];
  reviews? : ReadReviewDTO[];
}
export interface TourBasic {
  id: number;
  name: string;
  imageUrl?: string | null;
  country?: string | null;
  city?: string | null;
  address?: string | null;
}
export interface CreateTourRequest {
  operatorId: number;
  categoryId: number;
  name: string;
  description?: string | null;
  country?: string | null;
  city?: string | null;
  address?: string | null;
  status?: string | null;
  image?: File | null;
}

export interface UpdateTourRequest {
  operatorId: number;
  categoryId: number;
  name: string;
  description?: string | null;
  country?: string | null;
  city?: string | null;
  address?: string | null;
  status?: string | null;
  image?: File | null;
  removeImage?: boolean;
}
