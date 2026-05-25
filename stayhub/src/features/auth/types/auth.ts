export interface LoginDTO {
  email: string;
  password: string;
}

export interface UserResponseDTO {
  id: number;
  email: string;
  fullName: string;
  avatarUrl?: string;
  provider?: string;
  phoneNumber?: string;
  gender?: string;
  dateOfBirth?: string;
  lastOnline?: string;
}

export interface LoginResponseDTO {
  user: UserResponseDTO;
  token: string;
  refreshToken: string;
}

export interface UpdateProfileDTO {
  fullName: string;
  phoneNumber?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  avatarFile?: File | null;
}

export interface RegisterDTO {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
  gender: string;
  dateOfBirth: string | null;
}

export interface GoogleLoginDTO {
  idToken: string;
}

export interface FacebookLoginDTO {
  accessToken: string;
}

export interface FacebookUserDTO {
  id: string;
  email: string;
  name: string;
}

export interface RefreshTokenRequestDTO {
  refreshToken: string;
}

export interface ChangePasswordDTO {
  oldPassword: string;
  newPassword: string;
}

export interface ForgotPasswordDTO {
  email: string;
}

export interface ResetPasswordDTO {
  email: string;
  code: string;
  newPassword: string;
}