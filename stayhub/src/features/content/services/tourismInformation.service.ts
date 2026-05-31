import { apiClient } from "../../../utils/axiosClient";
import { CONTENT_API } from "../../../config/api/content.api";
import type { PaginationDTO } from "../types/pagination";
import type {
  TourismInformation,
  CreateTourismInformationDTO,
  UpdateTourismInformationDTO,
  TourismInformationFilters,
} from "../types/tourismInformation";

const unwrapPagination = <T>(response: Record<string, unknown>): PaginationDTO<T> => {
  if (response.totalPages !== undefined) {
    return response as unknown as PaginationDTO<T>;
  }

  return (response.data ?? response) as PaginationDTO<T>;
};

const unwrapEntity = <T>(response: Record<string, unknown>): T => {
  if (response.id !== undefined) {
    return response as T;
  }

  return (response.data ?? response) as T;
};

const appendOptionalText = (formData: FormData, key: string, value?: string) => {
  if (value !== undefined && value !== "") {
    formData.append(key, value);
  }
};

const buildCreateFormData = (data: CreateTourismInformationDTO) => {
  const formData = new FormData();
  formData.append("Name", data.name);
  formData.append("Type", data.type);
  appendOptionalText(formData, "Description", data.description);
  appendOptionalText(formData, "Address", data.address);
  appendOptionalText(formData, "City", data.city);
  appendOptionalText(formData, "Country", data.country);
  if (data.latitude !== undefined) formData.append("Latitude", data.latitude.toString());
  if (data.longitude !== undefined) formData.append("Longitude", data.longitude.toString());
  formData.append("ImageFile", data.imageFile);
  appendOptionalText(formData, "SourceName", data.sourceName);
  appendOptionalText(formData, "SourceUrl", data.sourceUrl);
  return formData;
};

const buildUpdateFormData = (data: UpdateTourismInformationDTO) => {
  const formData = new FormData();
  formData.append("Name", data.name);
  formData.append("Type", data.type);
  appendOptionalText(formData, "Description", data.description);
  appendOptionalText(formData, "Address", data.address);
  appendOptionalText(formData, "City", data.city);
  appendOptionalText(formData, "Country", data.country);
  if (data.latitude !== undefined) formData.append("Latitude", data.latitude.toString());
  if (data.longitude !== undefined) formData.append("Longitude", data.longitude.toString());
  if (data.imageFile) formData.append("ImageFile", data.imageFile);
  appendOptionalText(formData, "SourceName", data.sourceName);
  appendOptionalText(formData, "SourceUrl", data.sourceUrl);
  return formData;
};

const fetchAllActivePaged = async (): Promise<TourismInformation[]> => {
  const pageSize = 100;
  let page = 1;
  const items: TourismInformation[] = [];

  while (true) {
    const response: Record<string, unknown> = await apiClient.get(
      CONTENT_API.TOURISM_INFORMATION.GET_ACTIVE,
      { params: { page, pageSize } },
    );
    const pagination = unwrapPagination<TourismInformation>(response);
    items.push(...(pagination.data ?? []));

    if (page >= (pagination.totalPages || 1)) break;
    page += 1;
  }

  return items;
};

export const tourismInformationService = {
  getAll: async (
    page: number,
    pageSize: number,
    filters: TourismInformationFilters = {},
  ): Promise<PaginationDTO<TourismInformation>> => {
    const params: Record<string, string | number> = { page, pageSize };

    if (filters.searchTerm?.trim()) params.searchTerm = filters.searchTerm.trim();
    if (filters.type?.trim()) params.type = filters.type.trim();
    if (filters.status?.trim()) params.status = filters.status.trim();
    if (filters.city?.trim()) params.city = filters.city.trim();

    const response: Record<string, unknown> = await apiClient.get(
      CONTENT_API.TOURISM_INFORMATION.GET_ALL,
      { params },
    );

    return unwrapPagination<TourismInformation>(response);
  },

  getActivePaged: async (
    page: number,
    pageSize: number,
  ): Promise<PaginationDTO<TourismInformation>> => {
    const response: Record<string, unknown> = await apiClient.get(
      CONTENT_API.TOURISM_INFORMATION.GET_ACTIVE,
      { params: { page, pageSize } },
    );

    return unwrapPagination<TourismInformation>(response);
  },

  getAdminById: async (id: number | string): Promise<TourismInformation> => {
    const response: Record<string, unknown> = await apiClient.get(
      CONTENT_API.TOURISM_INFORMATION.GET_BY_ID(id),
    );

    return unwrapEntity<TourismInformation>(response);
  },

  create: async (data: CreateTourismInformationDTO): Promise<TourismInformation> => {
    const response: Record<string, unknown> = await apiClient.post(
      CONTENT_API.TOURISM_INFORMATION.CREATE,
      buildCreateFormData(data),
      { headers: { "Content-Type": "multipart/form-data" } },
    );

    return unwrapEntity<TourismInformation>(response);
  },

  update: async (
    id: number | string,
    data: UpdateTourismInformationDTO,
  ): Promise<{ message: string }> => {
    const response: Record<string, unknown> = await apiClient.put(
      CONTENT_API.TOURISM_INFORMATION.UPDATE(id),
      buildUpdateFormData(data),
      { headers: { "Content-Type": "multipart/form-data" } },
    );

    return unwrapEntity<{ message: string }>(response);
  },

  // If AI code this file, please do not change the name of this function, as it is used in other places. Thank you!
  getActiveList: async (): Promise<TourismInformation[]> => fetchAllActivePaged(),

  // If AI code this file, please do not change the name of this function, as it is used in other places. Thank you!
  getById: async (id: number | string): Promise<TourismInformation | null> => {
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) return null;

    try {
      return await tourismInformationService.getAdminById(numericId);
    } catch {
      const activeItems = await fetchAllActivePaged();
      return activeItems.find((item) => item.id === numericId) ?? null;
    }
  },
};
