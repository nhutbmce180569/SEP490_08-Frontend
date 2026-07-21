import type { Review } from "../types/review";
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
  canEdit?: boolean;
  createdBy: number;
  createdByName?: string | null;
  updatedBy?: number | null;
  updatedByName?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  tourItineraries?: TourItinerary[];
  tourSchedules?: TourSchedule[];
  reviews? : Review[];
  tourImages?: TourImage[];
  transportationType?: string | null;
  totalReviews?: number;
  fiveStarCount?: number;
  fourStarCount?: number;
  threeStarCount?: number;
  twoStarCount?: number;
  oneStarCount?: number;
}

export interface TourImage {
  id: number;
  tourId: number;
  imageUrl: string;
  createdAt?: string;
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
  transportationType: string;
  tourImages?: File[] | null;
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
  transportationType: string;
  tourImages?: File[] | null;
  removedTourImageIds?: number[];
}
