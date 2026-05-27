import { apiClient } from "../../../utils/axiosClient";
import { FULL_API } from "../../../config/api/api";
import type { ReadCategoryDTO, CreateCategoryDTO, UpdateCategoryDTO, PaginationDTO } from "../types/category";

// Đường dẫn này có thể điều chỉnh lại nếu bạn quản lý trong file content.api.ts
const CATEGORY_API = `${FULL_API}/categories`;

export const getAllCategories = async (page: number = 1, pageSize: number = 10, keyword?: string): Promise<PaginationDTO<ReadCategoryDTO>> => {
  if (keyword && keyword.trim() !== "") {
    const response: any = await apiClient.get(`${CATEGORY_API}/search`, {
      params: { q: keyword, page, pageSize },
    });
    if (response.data && response.data.totalPages !== undefined) {
      return response.data;
    }
    return response.totalPages !== undefined ? response : response.data;
  } else {
    const response: any = await apiClient.get(CATEGORY_API, {
      params: { page, pageSize },
    });
    return response.totalPages !== undefined ? response : response.data;
  }
};

export const getActiveCategories = async (page: number = 1, pageSize: number = 10): Promise<PaginationDTO<ReadCategoryDTO>> => {
  const response: any = await apiClient.get(`${CATEGORY_API}/active`, { params: { page, pageSize } });
  return response.totalPages !== undefined ? response : response.data;
};

export const getCategoryById = async (id: number | string): Promise<ReadCategoryDTO> => {
  const response: any = await apiClient.get(`${CATEGORY_API}/${id}`);
  return response.id !== undefined ? response : response.data;
};

export const createCategory = async (data: CreateCategoryDTO): Promise<ReadCategoryDTO> => {
  const formData = new FormData();
  formData.append("name", data.name);
  formData.append("slug", data.slug);
  if (data.description) formData.append("description", data.description);
  if (data.isActive !== undefined) formData.append("isActive", data.isActive.toString());
  if (data.iconFile) formData.append("iconFile", data.iconFile);

  const response: any = await apiClient.post(CATEGORY_API, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.id !== undefined ? response : response.data;
};

export const updateCategory = async (id: number | string, data: UpdateCategoryDTO): Promise<{ message: string }> => {
  const formData = new FormData();
  formData.append("name", data.name);
  formData.append("slug", data.slug);
  if (data.description) formData.append("description", data.description);
  if (data.isActive !== undefined) formData.append("isActive", data.isActive.toString());
  if (data.iconFile) formData.append("iconFile", data.iconFile);

  const response: any = await apiClient.put(`${CATEGORY_API}/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.message !== undefined ? response : response.data;
};

export const deleteCategory = async (id: number | string): Promise<{ message: string }> => {
  const response: any = await apiClient.delete(`${CATEGORY_API}/${id}`);
  return response.message !== undefined ? response : response.data;
};

export const activateCategory = async (id: number | string): Promise<{ message: string }> => {
  const response: any = await apiClient.patch(`${CATEGORY_API}/${id}/activate`);
  return response.message !== undefined ? response : response.data;
};

export const deactivateCategory = async (id: number | string): Promise<{ message: string }> => {
  const response: any = await apiClient.patch(`${CATEGORY_API}/${id}/deactivate`);
  return response.message !== undefined ? response : response.data;
};

export const categoryService = {
  getAllCategories,
  getActiveCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  activateCategory,
  deactivateCategory,
};