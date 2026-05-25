import { apiClient } from "../../../utils/axiosClient";
import { AUTH_API } from "../../../config/api/auth.api";
import type { ReadUserDTO, CreateUserDTO, UpdateUserDTO, ChangeUserStatusDTO } from "../types/user";
import type { PaginationDTO } from "../types/pagination";

export const userService = {
  getAllUsers: async (page: number, pageSize: number): Promise<PaginationDTO<ReadUserDTO>> => {
    const response: any = await apiClient.get(AUTH_API.GET_ALL_USERS, {
      params: { page, pageSize },
    });
    return response.totalPages !== undefined ? response : response.data;
  },

  getUserById: async (id: number | string): Promise<ReadUserDTO> => {
    const response: any = await apiClient.get(AUTH_API.GET_USER_BY_ID(id));
    return response.id !== undefined ? response : response.data;
  },

  getUserByEmail: async (email: string): Promise<ReadUserDTO> => {
    const response: any = await apiClient.get(AUTH_API.GET_USER_BY_EMAIL(email));
    return response.id !== undefined ? response : response.data;
  },

  createUser: async (data: CreateUserDTO): Promise<ReadUserDTO> => {
    const formData = new FormData();
    formData.append("email", data.email);
    formData.append("password", data.password);
    formData.append("fullName", data.fullName);
    if (data.phoneNumber) formData.append("phoneNumber", data.phoneNumber);
    if (data.gender) formData.append("gender", data.gender);
    if (data.dateOfBirth) formData.append("dateOfBirth", data.dateOfBirth);
    if (data.status) formData.append("status", data.status);
    
    if (data.roleIds && data.roleIds.length > 0) {
      data.roleIds.forEach((id) => formData.append("roleIds", id.toString()));
    }
    
    if (data.avatarFile) {
      formData.append("avatarFile", data.avatarFile);
    }

    const response: any = await apiClient.post(AUTH_API.CREATE_USER, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.id !== undefined ? response : response.data;
  },

  updateUser: async (id: number | string, data: UpdateUserDTO): Promise<{ message: string }> => {
    const formData = new FormData();
    formData.append("fullName", data.fullName);
    if (data.phoneNumber) formData.append("phoneNumber", data.phoneNumber);
    if (data.gender) formData.append("gender", data.gender);
    if (data.dateOfBirth) formData.append("dateOfBirth", data.dateOfBirth);
    if (data.status) formData.append("status", data.status);
    if (data.locPrivacy !== undefined) formData.append("locPrivacy", String(data.locPrivacy));
    if (data.momentPrivacy !== undefined) formData.append("momentPrivacy", String(data.momentPrivacy));
    
    if (data.roleIds && data.roleIds.length > 0) {
      data.roleIds.forEach((id) => formData.append("roleIds", id.toString()));
    }
    
    if (data.avatarFile) {
      formData.append("avatarFile", data.avatarFile);
    }

    const response: any = await apiClient.put(AUTH_API.UPDATE_USER(id), formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.message !== undefined ? response : response.data;
  },

  deleteUser: async (id: number | string): Promise<{ message: string }> => {
    const response: any = await apiClient.delete(AUTH_API.DELETE_USER(id));
    return response.message !== undefined ? response : response.data;
  },

  changeUserStatus: async (id: number | string, data: ChangeUserStatusDTO): Promise<{ message: string }> => {
    const response: any = await apiClient.put(AUTH_API.CHANGE_USER_STATUS(id), data);
    return response.message !== undefined ? response : response.data;
  },
};