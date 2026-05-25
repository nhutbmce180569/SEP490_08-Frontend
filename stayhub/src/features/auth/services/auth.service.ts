import { AUTH_API } from "../../../config/api/auth.api";
import { apiClient } from "../../../utils/axiosClient";
import type { 
  LoginDTO, 
  LoginResponseDTO, 
  RegisterDTO, 
  GoogleLoginDTO, 
  FacebookLoginDTO,
  RefreshTokenRequestDTO,
  ChangePasswordDTO,
  UserResponseDTO,
  UpdateProfileDTO,
  ForgotPasswordDTO,
  ResetPasswordDTO
} from "../types/auth";

// Interface định nghĩa format chung mà Backend C# trả về (Ok(new { message = "...", data = ... }))
export interface AuthApiResponse<T> {
  message: string;
  data: T;
}

export const login = async (data: LoginDTO): Promise<AuthApiResponse<LoginResponseDTO>> => {
  try {
    return await apiClient.post<AuthApiResponse<LoginResponseDTO>>(AUTH_API.LOGIN, data);
  } catch (error) {
    throw error;
  }
};

export const forgotPassword = async (data: ForgotPasswordDTO): Promise<AuthApiResponse<any>> => {
  try {
    return await apiClient.post<AuthApiResponse<any>>(AUTH_API.FORGOT_PASSWORD, data);
  } catch (error) {
    throw error;
  }
};

export const resetPassword = async (data: ResetPasswordDTO): Promise<AuthApiResponse<any>> => {
  try {
    return await apiClient.post<AuthApiResponse<any>>(AUTH_API.RESET_PASSWORD, data);
  } catch (error) {
    throw error;
  }
};

export const changePassword = async (data: ChangePasswordDTO): Promise<AuthApiResponse<LoginResponseDTO>> => {
  try {
    return await apiClient.post<AuthApiResponse<LoginResponseDTO>>(AUTH_API.CHANGE_PASSWORD, data);
  } catch (error) {
    throw error;
  }
};

export const getProfile = async (): Promise<AuthApiResponse<UserResponseDTO>> => {
  try {
    return await apiClient.get<AuthApiResponse<UserResponseDTO>>(AUTH_API.PROFILE);
  } catch (error) {
    throw error;
  }
};

export const updateProfile = async (data: UpdateProfileDTO): Promise<AuthApiResponse<LoginResponseDTO>> => {
  try {
    const formData = new FormData();
    formData.append("fullName", data.fullName);
    if (data.phoneNumber) formData.append("phoneNumber", data.phoneNumber);
    if (data.gender) formData.append("gender", data.gender);
    if (data.dateOfBirth) formData.append("dateOfBirth", data.dateOfBirth);
    if (data.avatarFile) formData.append("avatarFile", data.avatarFile);

    return await apiClient.put<AuthApiResponse<LoginResponseDTO>>(AUTH_API.PROFILE, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  } catch (error) {
    throw error;
  }
};

export const facebookLogin = async (data: FacebookLoginDTO): Promise<AuthApiResponse<LoginResponseDTO>> => {
  try {
    // Gọi endpoint Facebook Login.
    return await apiClient.post<AuthApiResponse<LoginResponseDTO>>(AUTH_API.FACEBOOK_LOGIN, data);
  } catch (error) {
    throw error;
  }
};

export const googleLogin = async (data: GoogleLoginDTO): Promise<AuthApiResponse<LoginResponseDTO>> => {
  try {
    // Dùng endpoint theo controller AuthController của backend
    return await apiClient.post<AuthApiResponse<LoginResponseDTO>>(AUTH_API.GOOGLE_LOGIN, data);
  } catch (error) {
    throw error;
  }
};

export const register = async (data: RegisterDTO): Promise<AuthApiResponse<UserResponseDTO>> => {
  try {
    return await apiClient.post<AuthApiResponse<UserResponseDTO>>(AUTH_API.REGISTER, data);
  } catch (error) {
    throw error;
  }
};

export const refreshToken = async (data: RefreshTokenRequestDTO): Promise<AuthApiResponse<LoginResponseDTO>> => {
  try {
    return await apiClient.post<AuthApiResponse<LoginResponseDTO>>(AUTH_API.REFRESH_TOKEN, data);
  } catch (error) {
    throw error;
  }
};

export const logout = async (data: RefreshTokenRequestDTO): Promise<AuthApiResponse<any>> => {
  try {
    return await apiClient.post<AuthApiResponse<any>>(AUTH_API.LOGOUT, data);
  } catch (error) {
    throw error;
  }
};