import { apiClient } from "../../../../utils/axiosClient";
import type { Moment, Comment } from "../types/moment.type";

const MOMENT_API_URL = "/moments";

export const getMomentFeed = (
  scheduleId: number | null, 
  skip: number = 0, 
  top: number = 5
): Promise<Moment[]> => {
  const scheduleQuery = scheduleId ? `scheduleId=${scheduleId}&` : "";
  
  return apiClient.get<Moment[]>(
    `${MOMENT_API_URL}?${scheduleQuery}$skip=${skip}&$top=${top}`
  );
};

export const getMyFootprints = async (): Promise<{lat: number, lng: number}[]> => {
  const res = await apiClient.get<any>(`${MOMENT_API_URL}/my-footprints`);
  // Đảm bảo lấy đúng mảng data từ backend C#
  return res.data?.data || res.data || [];
};

export const createMoment = (data: FormData): Promise<Moment> => {
  return apiClient.post<Moment>(MOMENT_API_URL, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const toggleReaction = (momentId: number, userId: number, isLike: boolean): Promise<void> => {
  return apiClient.post<void>(`${MOMENT_API_URL}/${momentId}/reactions`, { 
    momentId: momentId,
    userId: userId, 
    isLike: isLike 
  });
};

export const addComment = (momentId: number, userId: number, content: string): Promise<Comment> => {
  return apiClient.post<Comment>(`${MOMENT_API_URL}/${momentId}/comments`, { 
    userId: userId, 
    comment: content 
  });
};

export const updateComment = (commentId: number, userId: number, content: string): Promise<Comment> => {
  return apiClient.put<Comment>(`${MOMENT_API_URL}/comments/${commentId}`, { 
    userId: userId, 
    comment: content 
  });
};

export const deleteComment = (commentId: number, userId: number): Promise<void> => {
  return apiClient.delete<void>(`${MOMENT_API_URL}/comments/${commentId}?userId=${userId}`);
};

export const deleteMoment = (momentId: number, userId: number): Promise<void> => {
  return apiClient.delete<void>(`${MOMENT_API_URL}/${momentId}?userId=${userId}`);
};