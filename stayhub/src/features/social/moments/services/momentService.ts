import { apiClient } from "../../../../utils/axiosClient";
import type { Moment, Comment } from "../types/moment.type";

const MOMENT_API_URL = "/moments";

/* =========================================================================
 * NORMALIZERS
 * Backend (SocialAPI) tra ve field phang: userName/avatarUrl cho comment,
 * momentReactions cho reactions, reactionCount/isLikedByMe cho moment.
 * Chuan hoa ve dung shape Moment/Comment de cac component dung thong nhat.
 * ========================================================================= */
const mapComment = (c: any): any => ({
  ...c,
  id: c.id ?? c.Id,
  momentId: c.momentId ?? c.MomentId,
  userId: c.userId ?? c.UserId ?? c.user?.id ?? c.user?.Id,
  user: {
    id: c.userId ?? c.UserId ?? c.user?.id ?? c.user?.Id,
    fullName:
      c.user?.fullName ?? c.user?.FullName ??
      c.userName ?? c.UserName ?? "",
    avatarUrl:
      c.user?.avatarUrl ?? c.user?.AvatarUrl ??
      c.avatarUrl ?? c.AvatarUrl ?? null,
  },
  text: c.comment ?? c.Comment ?? c.text ?? c.Text ?? "",
  comment: c.comment ?? c.Comment ?? c.text ?? "",
  createdAt:
    c.timestamp ?? c.Timestamp ?? c.createdAt ?? c.CreatedAt ??
    new Date().toISOString(),
});

const mapReaction = (r: any): any => ({
  id: r.id ?? r.Id ?? 0,
  userId: r.userId ?? r.UserId,
  isLike: (r.isLike ?? r.IsLike ?? true) === true,
});

const mapMoment = (m: any): Moment => {
  const reactionsRaw = m.momentReactions ?? m.MomentReactions ?? m.reactions ?? [];
  const reactions = reactionsRaw.map(mapReaction);
  const likeCount =
    m.reactionCount ?? m.ReactionCount ?? m.totalLikes ?? m.TotalLikes ??
    reactions.filter((r: any) => r.isLike).length;

  return {
    ...m,
    id: m.id ?? m.Id,
    userId: m.userId ?? m.UserId ?? m.user?.id,
    user: {
      id: m.userId ?? m.UserId ?? m.user?.id ?? m.User?.Id,
      fullName: m.user?.fullName ?? m.User?.FullName ?? m.fullName ?? "",
      avatarUrl: m.user?.avatarUrl ?? m.User?.AvatarUrl ?? m.avatarUrl ?? null,
    },
    imageUrl: m.imageUrl ?? m.ImageUrl ?? "",
    caption: m.caption ?? m.Caption ?? null,
    lat: m.lat ?? m.Lat ?? null,
    lng: m.lng ?? m.Lng ?? null,
    locationName: m.locationName ?? m.LocationName ?? null,
    privacy: m.privacy ?? m.Privacy ?? "Public",
    createdAt: m.createdAt ?? m.CreatedAt ?? new Date().toISOString(),
    comments: (m.comments ?? m.Comments ?? []).map(mapComment),
    reactions,
    reactionCount: likeCount,
    isLikedByMe: (m.isLikedByMe ?? m.IsLikedByMe ?? false) === true,
  } as Moment;
};

// Trich xuat mang tu nhieu kieu response (body-array hoac AxiosResponse, co/khong wrapper {data}).
const extractList = (raw: any): any[] => {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.data?.data)) return raw.data.data;
  return [];
};

export const getMomentFeed = async (
  scheduleId: number | null,
  skip: number = 0,
  top: number = 5
): Promise<Moment[]> => {
  const scheduleQuery = scheduleId ? `scheduleId=${scheduleId}&` : "";
  const raw: any = await apiClient.get<any>(
    `${MOMENT_API_URL}?${scheduleQuery}$skip=${skip}&$top=${top}`
  );
  return extractList(raw).map(mapMoment);
};

// FIX: footprint lay tu LocationLogs (di chuyen) qua /locations/footprints,
// KHONG phai tu anh (/moments/my-footprints). Khop voi mobile.
export const getMyFootprints = async (): Promise<{ lat: number; lng: number }[]> => {
  const raw: any = await apiClient.get<any>(`/locations/footprints`);
  return extractList(raw).map((f: any) => ({
    lat: Number(f.lat ?? f.Lat),
    lng: Number(f.lng ?? f.Lng),
  }));
};

// MOI: heatmap realtime tu LocationLogs (giong mobile), weight = so lan qua o luoi.
export const getHeatmap = async (
  scheduleId: number | null,
  days: number = 90
): Promise<{ lat: number; lng: number; weight: number }[]> => {
  const scheduleQuery = scheduleId ? `scheduleId=${scheduleId}&` : "";
  const raw: any = await apiClient.get<any>(`/locations/heatmap?${scheduleQuery}days=${days}`);
  return extractList(raw).map((p: any) => ({
    lat: Number(p.lat ?? p.Lat),
    lng: Number(p.lng ?? p.Lng),
    weight: Number(p.weight ?? p.Weight ?? p.count ?? 1),
  }));
};

export const createMoment = (data: FormData): Promise<Moment> => {
  return apiClient.post<Moment>(MOMENT_API_URL, data, {
    headers: { "Content-Type": "multipart/form-data" },
    // Bound upload de khong treo vo han neu mang cham.
    timeout: 90000,
  });
};

export const toggleReaction = (momentId: number, userId: number, isLike: boolean): Promise<void> => {
  return apiClient.post<void>(`${MOMENT_API_URL}/${momentId}/reactions`, {
    momentId: momentId,
    userId: userId,
    isLike: isLike
  });
};

export const addComment = async (momentId: number, userId: number, content: string): Promise<Comment> => {
  const res: any = await apiClient.post<any>(`${MOMENT_API_URL}/${momentId}/comments`, {
    userId: userId,
    comment: content
  });
  const body = res?.data ?? res;
  return mapComment(body) as Comment;
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
