import { FULL_API } from "../../../config/api/api";
import { apiClient } from "../../../utils/axiosClient";
import type {
  CreateCategoryDTO,
  PaginationDTO,
  ReadCategoryDTO,
  UpdateCategoryDTO,
} from "../types/category";

const CATEGORY_API = `${FULL_API}/categories`;

type ApiEnvelope<T> = T | { data: T };
type MessageResponse = { message: string };

const hasObjectData = <T>(response: ApiEnvelope<T>): response is { data: T } =>
  Boolean(response && typeof response === "object" && "data" in response);

const unwrapData = <T>(response: ApiEnvelope<T>): T =>
  hasObjectData(response) ? response.data : response;

const unwrapPagination = (
  response: ApiEnvelope<PaginationDTO<ReadCategoryDTO>>,
): PaginationDTO<ReadCategoryDTO> => {
  if (
    response &&
    typeof response === "object" &&
    "data" in response &&
    Array.isArray(response.data) &&
    "totalPages" in response
  ) {
    return response as PaginationDTO<ReadCategoryDTO>;
  }

  return unwrapData(response);
};

export const getAllCategories = async (
  page: number = 1,
  pageSize: number = 10,
  keyword?: string,
): Promise<PaginationDTO<ReadCategoryDTO>> => {
  if (keyword?.trim()) {
    const response = await apiClient.get<
      ApiEnvelope<PaginationDTO<ReadCategoryDTO>>
    >(`${CATEGORY_API}/search`, {
      params: { q: keyword, page, pageSize },
    });
    return unwrapPagination(response);
  }

  const response = await apiClient.get<
    ApiEnvelope<PaginationDTO<ReadCategoryDTO>>
  >(CATEGORY_API, {
    params: { page, pageSize },
  });
  return unwrapPagination(response);
};

export const getActiveCategories = async (
  page: number = 1,
  pageSize: number = 10,
): Promise<PaginationDTO<ReadCategoryDTO>> => {
  const response = await apiClient.get<
    ApiEnvelope<PaginationDTO<ReadCategoryDTO>>
  >(`${CATEGORY_API}/active`, { params: { page, pageSize } });
  return unwrapPagination(response);
};

export const getCategoryById = async (
  id: number | string,
): Promise<ReadCategoryDTO> => {
  const response = await apiClient.get<ApiEnvelope<ReadCategoryDTO>>(
    `${CATEGORY_API}/${id}`,
  );
  return unwrapData(response);
};

export const createCategory = async (
  data: CreateCategoryDTO,
): Promise<ReadCategoryDTO> => {
  const formData = new FormData();
  formData.append("name", data.name);
  formData.append("slug", data.slug);
  if (data.description) formData.append("description", data.description);
  if (data.iconFile) formData.append("iconFile", data.iconFile);

  const response = await apiClient.post<ApiEnvelope<ReadCategoryDTO>>(
    CATEGORY_API,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return unwrapData(response);
};

export const updateCategory = async (
  id: number | string,
  data: UpdateCategoryDTO,
): Promise<MessageResponse> => {
  const formData = new FormData();
  formData.append("name", data.name);
  formData.append("slug", data.slug);
  if (data.description) formData.append("description", data.description);
  if (data.isActive !== undefined) {
    formData.append("isActive", data.isActive.toString());
  }
  if (data.iconFile) formData.append("iconFile", data.iconFile);

  const response = await apiClient.put<ApiEnvelope<MessageResponse>>(
    `${CATEGORY_API}/${id}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return unwrapData(response);
};

export const deleteCategory = async (
  id: number | string,
): Promise<MessageResponse> => {
  const response = await apiClient.delete<ApiEnvelope<MessageResponse>>(
    `${CATEGORY_API}/${id}`,
  );
  return unwrapData(response);
};

export const activateCategory = async (
  id: number | string,
): Promise<MessageResponse> => {
  const response = await apiClient.patch<ApiEnvelope<MessageResponse>>(
    `${CATEGORY_API}/${id}/activate`,
  );
  return unwrapData(response);
};

export const deactivateCategory = async (
  id: number | string,
): Promise<MessageResponse> => {
  const response = await apiClient.patch<ApiEnvelope<MessageResponse>>(
    `${CATEGORY_API}/${id}/deactivate`,
  );
  return unwrapData(response);
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
