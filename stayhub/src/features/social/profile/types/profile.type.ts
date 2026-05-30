export interface UserProfile {
  id: string | number;
  fullName: string;
  avatarUrl?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  createdAt?: string | null;
}

export interface UserMoment {
  id: string | number;
  scheduleId?: number | null;
  imageUrl: string;
  caption?: string | null;
  lat?: number | null;
  lng?: number | null;
  privacy: 'Public' | 'Friend' | 'Private';
  createdAt?: string | null;
}