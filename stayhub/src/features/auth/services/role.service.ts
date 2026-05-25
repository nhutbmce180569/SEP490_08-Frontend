import { apiClient } from "../../../utils/axiosClient";
import { AUTH_API } from "../../../config/api/auth.api";
import type { ReadRoleDTO } from "../types/role";

export const roleService = {
  getAllRoles: async (): Promise<ReadRoleDTO[]> => {
    try {
      const response: any = await apiClient.get(AUTH_API.GET_ALL_ROLES);
      
      // Dựa vào Controller: Ok(new { message = "...", data = roles })
      if (response && Array.isArray(response.data)) return response.data;
      if (Array.isArray(response)) return response;

      return [];
    } catch (error) {
      console.error("Failed to fetch roles:", error);
      return [];
    }
  },

  getRoleById: async (id: number | string): Promise<ReadRoleDTO> => {
    const response: any = await apiClient.get(AUTH_API.GET_ROLE_BY_ID(id));
    return response?.data || response;
  },

  getRoleByName: async (name: string): Promise<ReadRoleDTO> => {
    const response: any = await apiClient.get(AUTH_API.GET_ROLE_BY_NAME(name));
    return response?.data || response;
  },
};