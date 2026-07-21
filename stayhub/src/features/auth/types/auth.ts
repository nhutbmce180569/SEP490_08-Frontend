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
  requirePasswordChange: boolean;
  roles: string[];
}

export interface LoginResponseDTO {
  requirePhoneNumber?: boolean;
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
  otpCode?: string;
}

export interface SendRegisterOtpDTO {
  email: string;
  fullName: string;
}

export interface GoogleLoginDTO {
  idToken: string;
  phoneNumber?: string;
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

export interface VerifyResetOtpDTO {
  email: string;
  code: string;
}

export interface ResetPasswordDTO {
  email: string;
  code?: string;
  resetToken?: string;
  newPassword: string;
}
