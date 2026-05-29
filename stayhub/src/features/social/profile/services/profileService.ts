import apiClient from "../../../../utils/axiosClient";
import { UserProfile, UserMoment } from "../types/profile.type";

export const getUserProfile = async (userId: string | number): Promise<UserProfile> => {
  const response: any = await apiClient.get(`/api/users/${userId}/profile`);
  // Tương thích với format bọc { data: ... } của Axios hoặc wrapper của hệ thống
  return response?.data?.data || response?.data || response;
};

export const getUserMoments = async (userId: string | number): Promise<UserMoment[]> => {
  const response: any = await apiClient.get(`/api/moments/user/${userId}`);
  return response?.data?.data || response?.data || response || [];
};