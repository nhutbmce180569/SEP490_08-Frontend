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

