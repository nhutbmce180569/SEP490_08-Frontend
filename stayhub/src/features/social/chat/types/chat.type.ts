export interface ChatRoom {
  id: number;
  scheduleId: number | null;
  roomName: string;
  isGroupChat: boolean;
  createdAt: string;
}

export interface ChatMessage {
  id: number;
  chatRoomId: number;
  senderId: number;
  content: string;
  isRead: boolean;
  sentAt: string;
}

export interface GroupInvitationPayload {
  type: string;
  roomId: number;
  inviterId: number;
  message: string;
}