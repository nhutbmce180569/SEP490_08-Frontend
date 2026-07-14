import type { Moment } from "../../moments/types/moment.type";

export interface UserProfile {
  id: string | number;
  fullName: string;
  avatarUrl?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  createdAt?: string | null;
  roles?: string[];
}

export interface UserMoment extends Moment {
  scheduleId?: number | null;
}