import axios from 'axios';
import type { ChatRoom, ChatMessage } from '../types/chat.type';

const apiClient = axios.create({
  baseURL: 'https://localhost:7010',
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const chatService = {
  getChatRooms: async (): Promise<ChatRoom[]> => {
    const response = await apiClient.get<any>('/api/chat/rooms');
    return response.data?.data || response.data || [];
  },

  getChatMessages: async (roomId: number): Promise<ChatMessage[]> => {
    const response = await apiClient.get<any>(
      `/api/chat/rooms/${roomId}/messages`
    );
    return response.data?.data || response.data || [];
  },

  createChatRoom: async (friendId: number): Promise<any> => {
    const response = await apiClient.post<any>('/api/chat/rooms', {
      friendId,
    });
    return response.data?.data || response.data || response;
  },

  pinRoom: async (roomId: number): Promise<void> => {
    await apiClient.post(`/api/chat/rooms/${roomId}/pin`);
  },

  muteRoom: async (roomId: number): Promise<void> => {
    await apiClient.post(`/api/chat/rooms/${roomId}/mute`);
  },

  addMembers: async (roomId: number, userIds: number[]): Promise<ChatRoom> => {
    const response = await apiClient.post<any>(
      `/api/chat/rooms/${roomId}/members`,
      { userIds }
    );
    return response.data?.data || response.data || response;
  },

  leaveGroup: async (roomId: number): Promise<void> => {
    await apiClient.delete(`/api/chat/rooms/${roomId}/leave`);
  },
};