export interface TourismInformation {
  id: number;
  name: string;
  type: string;
  description?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  imageUrl?: string | null;
  sourceName?: string | null;
  sourceUrl?: string | null;
  status?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export const TOURISM_INFORMATION_TYPES = [
  "Destination",
  "Heritage",
  "LocalFood",
  "Restaurant",
  "Activity",
  "Other",
] as const;

export type TourismInformationType = (typeof TOURISM_INFORMATION_TYPES)[number];

export const TOURISM_INFORMATION_STATUS = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
} as const;

export const TOURISM_DEFAULT_COUNTRY = "Vietnam";

export interface CreateTourismInformationDTO {
  name: string;
  type: string;
  description?: string;
  address?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  imageFile: File;
  sourceName?: string;
  sourceUrl?: string;
}

export interface UpdateTourismInformationDTO {
  name: string;
  type: string;
  description?: string;
  address?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  imageFile?: File;
  sourceName?: string;
  sourceUrl?: string;
}

export interface TourismInformationFilters {
  searchTerm?: string;
  type?: string;
  status?: string;
  city?: string;
}

export const TOURISM_TYPE_LABELS: Record<TourismInformationType, string> = {
  Destination: "Destination",
  Heritage: "Heritage",
  LocalFood: "Local Food",
  Restaurant: "Restaurant",
  Activity: "Activity",
  Other: "Other",
};
