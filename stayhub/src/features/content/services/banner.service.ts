import { apiClient } from "../../../utils/axiosClient";
import { CONTENT_API } from "../../../config/api/content.api";
import type { ReadBannerDTO, CreateBannerDTO, UpdateBannerDTO } from "../types/banner";
import type { PaginationDTO } from "../types/pagination";

export const bannerService = {
  getAll: async (page: number, pageSize: number, keyword?: string): Promise<PaginationDTO<ReadBannerDTO>> => {
    if (keyword && keyword.trim() !== "") {
      // Gọi search endpoint khi có keyword
      const response: any = await apiClient.get(CONTENT_API.BANNERS.SEARCH, {
        params: { q: keyword, page, pageSize },
      });
      
      // Controller Search bọc data trong Ok(new { message, data })
      if (response.data && response.data.totalPages !== undefined) {
        return response.data;
      }
      return response.totalPages !== undefined ? response : response.data;
    } else {
      const response: any = await apiClient.get(CONTENT_API.BANNERS.GET_ALL, {
        params: { page, pageSize },
      });
      return response.totalPages !== undefined ? response : response.data;
    }
  },

  getActive: async (page: number, pageSize: number): Promise<PaginationDTO<ReadBannerDTO>> => {
    const response: any = await apiClient.get(CONTENT_API.BANNERS.GET_ACTIVE, {
      params: { page, pageSize },
    });
    return response.totalPages !== undefined ? response : response.data;
  },

  getById: async (id: number | string): Promise<ReadBannerDTO> => {
    const response: any = await apiClient.get(CONTENT_API.BANNERS.GET_BY_ID(id));
    return response.id !== undefined ? response : response.data;
  },

  create: async (data: CreateBannerDTO): Promise<ReadBannerDTO> => {
    const formData = new FormData();
    formData.append("Title", data.title);
    formData.append("ImageFile", data.imageFile);
    if (data.targetUrl) formData.append("TargetUrl", data.targetUrl);
    if (data.priority !== undefined) formData.append("Priority", data.priority.toString());

    const response: any = await apiClient.post(CONTENT_API.BANNERS.CREATE, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.id !== undefined ? response : response.data;
  },

  update: async (id: number | string, data: UpdateBannerDTO): Promise<{ message: string }> => {
    const formData = new FormData();
    formData.append("Title", data.title);
    if (data.imageFile) formData.append("ImageFile", data.imageFile);
    if (data.targetUrl) formData.append("TargetUrl", data.targetUrl);
    if (data.priority !== undefined) formData.append("Priority", data.priority.toString());
    if (data.isActive !== undefined) formData.append("IsActive", data.isActive.toString());

    const response: any = await apiClient.put(CONTENT_API.BANNERS.UPDATE(id), formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.message !== undefined ? response : response.data;
  },

  delete: async (id: number | string): Promise<{ message: string }> => {
    const response: any = await apiClient.delete(CONTENT_API.BANNERS.DELETE(id));
    return response.message !== undefined ? response : response.data;
  },
};