export interface ChatRoom {
  id: number;
  name?: string;
  roomName?: string;
  lastMessage?: string;
  unreadCount: number;
  avatarUrl?: string;
  isPinned?: boolean;
  isMuted?: boolean;
  isGroupChat?: boolean;
  isOnline?: boolean;
  lastMessageCreatedAt?: string;
  otherParticipantId?: number;
}

export interface ChatMessage {
  id: number;
  chatRoomId: number;
  senderId: number;
  senderName: string;
  senderAvatarUrl?: string;
  content: string;
  createdAt: string;
}