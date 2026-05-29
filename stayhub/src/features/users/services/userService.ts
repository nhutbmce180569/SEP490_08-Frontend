import { apiClient } from "../../../utils/axiosClient";
import type { UserProfile, PaginatedResult } from "../types/user.type";

const USER_API_URL = "/users";

export const searchUsers = async (query: string, page = 1, pageSize = 10): Promise<PaginatedResult<UserProfile>> => {
  const response = await apiClient.get<any>(
    `${USER_API_URL}/search?q=${encodeURIComponent(query)}&page=${page}&pageSize=${pageSize}`
  );

  const resBody = response.data ?? response;

  let users = [];
  if (resBody?.data?.data) {
    users = resBody.data.data;
  } else if (resBody?.data && Array.isArray(resBody.data)) {
    users = resBody.data;
  } else if (Array.isArray(resBody)) {
    users = resBody;
  }

  return {
    data: users || [],
    total: resBody?.data?.total || resBody?.total || users.length || 0,
    page: page,
    pageSize: pageSize
  };
};