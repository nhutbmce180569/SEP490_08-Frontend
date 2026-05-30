import { apiClient } from "../../../../utils/axiosClient";
import type { ChatRoom, ChatMessage } from "../types/chat.type";

export const getChatRooms = async (): Promise<ChatRoom[]> => {
  const response = await apiClient.get<any>("/chats/rooms");
  return response?.data ?? response;
};

export const getRoomMessages = async (
  roomId: number,
  skip: number = 0,
  top: number = 50
): Promise<ChatMessage[]> => {
  const response = await apiClient.get<any>(
    `/chats/rooms/${roomId}/messages?skip=${skip}&top=${top}`
  );
  return response?.data ?? response;
};

export const sendGroupInvitation = async (
  chatRoomId: number,
  inviteeId: number
): Promise<any> => {
  const response = await apiClient.post<any>("/chats/invite", {
    chatRoomId,
    inviteeId,
  });
  return response?.data ?? response;
};

export const respondToInvitation = async (
  invitationId: number,
  status: "Accepted" | "Declined"
): Promise<any> => {
  const response = await apiClient.post<any>(`/chats/invite/${invitationId}/respond`, { status });
  return response?.data ?? response;
};

export const createChatRoom = async (receiverId: number): Promise<any> => {
  const response = await apiClient.post<any>('/chats', { receiverId });
  return response?.data ?? response;
};
export const sendMessage = async (
  roomId: number,
  content: string
): Promise<any> => {
  const response = await apiClient.post<any>(`/chats/${roomId}/messages`, { content });
  return response?.data ?? response;
};