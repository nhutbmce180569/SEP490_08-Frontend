import { apiClient } from "../../../../utils/axiosClient";
import type { 
  FriendRequestDto, 
  FriendRequestUpdateDto, 
  FriendshipResponse, 
  PendingRequestResponse 
} from "../types/friend.type";

const FRIEND_API_URL = "/friends";

export const sendRequest = async (data: FriendRequestDto): Promise<any> => {
  const response = await apiClient.post<any>(FRIEND_API_URL, data);
  return response.data ?? response;
};

export const getFriendships = async (): Promise<FriendshipResponse[]> => {
  const response = await apiClient.get<any>(FRIEND_API_URL);
  const resBody = response.data ?? response;
  const list = Array.isArray(resBody) ? resBody : (resBody?.data || []);

  return list.map((item: any) => ({
    id: item.id || item.Id || item.friendId || 0,
    friendId: item.friendId || item.FriendId || 0,
    // Bao vây mọi kiểu chữ hoa, chữ thường của FullName
    friendName: item.fullName || item.FullName || item.friendName || item.FriendName || "Ẩn danh (Do DB thiếu tên)",
    friendAvatarUrl: item.avatarUrl || item.AvatarUrl || item.friendAvatarUrl || item.FriendAvatarUrl || item.user?.avatarUrl || item.user?.AvatarUrl || item.friend?.avatarUrl || item.friend?.AvatarUrl || null,
    status: item.status || item.Status || "Friend",
  }));
};

export const getPendingRequests = async (): Promise<PendingRequestResponse[]> => {
  const response = await apiClient.get<any>(`${FRIEND_API_URL}/pending`);
  const resBody = response.data ?? response;
  const list = Array.isArray(resBody) ? resBody : (resBody?.data || []);

  // Backend trả về FriendshipResponseDto: id = friendship ID (dùng để respond/unfriend)
  // friendId = user ID của người gửi yêu cầu
  return list.map((item: any) => ({
    // requestId phải là friendship ID (item.id), KHÔNG phải friendId
    id: item.id || item.Id || 0,
    senderId: item.friendId || item.FriendId || item.requesterId || 0,
    senderName: item.fullName || item.senderName || "Ẩn danh (Do DB thiếu tên)",
    senderAvatarUrl: item.avatarUrl || item.AvatarUrl || item.senderAvatarUrl || item.SenderAvatarUrl || item.user?.avatarUrl || item.user?.AvatarUrl || item.sender?.avatarUrl || item.sender?.AvatarUrl || null,
    createdAt: item.createdAt || new Date().toISOString(),
  }));
};

export const respondToRequest = async (data: FriendRequestUpdateDto): Promise<void> => {
  // Gửi chính xác 2 biến mà FriendRequestUpdateDto của C# yêu cầu
  const payload = {
    requestId: data.requestId,
    status: data.isAccepted ? "Accepted" : "Declined" 
  };
  
  const response = await apiClient.put<any>(`${FRIEND_API_URL}/respond`, payload);
  return response.data ?? response;
};

export const deleteFriendship = async (id: number): Promise<void> => {
  const response = await apiClient.delete<any>(`${FRIEND_API_URL}/${id}`);
  return response.data ?? response;
};

export const getPaginatedFriendList = async (page = 1, pageSize = 10): Promise<{ data: FriendshipResponse[]; total: number }> => {
  const response = await apiClient.get<any>(`${FRIEND_API_URL}/list?page=${page}&pageSize=${pageSize}`);
  const paginationData = response?.data;
  const rawList = Array.isArray(paginationData?.data) ? paginationData.data : [];
  const total = paginationData?.total ?? 0;

  const mappedList = rawList.map((item: any) => ({
    id: item.id || item.Id || item.friendId || 0,
    friendId: item.friendId || item.FriendId || 0,
    friendName: item.fullName || item.FullName || item.friendName || item.FriendName || "Ẩn danh",
    friendAvatarUrl: item.avatarUrl || item.AvatarUrl || item.friendAvatarUrl || item.FriendAvatarUrl || null,
    friendEmail: item.email || item.Email || item.friendEmail || item.FriendEmail || "",
    status: item.status || item.Status || "Friend",
  }));

  return {
    data: mappedList,
    total: total,
  };
};

export const getFriendshipStatus = async (targetUserId: string | number): Promise<any> => {
  const response = await apiClient.get<any>(`${FRIEND_API_URL}/status/${targetUserId}`);
  return response.data ?? response;
};

export const getSentRequests = async (): Promise<PendingRequestResponse[]> => {
  const response = await apiClient.get<any>(`${FRIEND_API_URL}/sent`);
  const resBody = response.data ?? response;
  const list = Array.isArray(resBody) ? resBody : (resBody?.data || []);

  return list.map((item: any) => ({
    id: item.id || item.friendId || item.requestId || 0,
    senderId: item.friendId || item.receiverId || 0,
    senderName: item.fullName || item.receiverName || "Ẩn danh (Do DB thiếu tên)",
    senderAvatarUrl: item.avatarUrl || item.AvatarUrl || item.receiverAvatarUrl || item.ReceiverAvatarUrl || null,
    createdAt: item.createdAt || new Date().toISOString(),
  }));
};