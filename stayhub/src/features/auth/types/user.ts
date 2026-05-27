export interface ReadUserDTO {
  id: number;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  provider?: string | null;
  phoneNumber?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  status?: string | null;
  lastOnline?: string | null;
  roles: string[];
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface CreateUserDTO {
  email: string;
  password: string;
  fullName: string;
  avatarFile?: File | null;
  phoneNumber?: string;
  gender?: string;
  dateOfBirth?: string;
  status?: string;
  roleIds?: number[];
}

export interface UpdateUserDTO {
  fullName: string;
  avatarFile?: File | null;
  phoneNumber?: string;
  gender?: string;
  dateOfBirth?: string;
  status?: string;
  locPrivacy?: boolean;
  momentPrivacy?: boolean;
  roleIds?: number[];
}

export interface ChangeUserStatusDTO {
  status: string;
}