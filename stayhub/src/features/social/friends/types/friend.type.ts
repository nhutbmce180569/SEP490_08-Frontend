export interface FriendRequestDto {
  receiverId: number;
}

export interface FriendRequestUpdateDto {
  requestId: number;
  isAccepted: boolean;
}

export interface FriendshipResponse {
  id: number;
  friendId: number;
  friendName: string;
  friendAvatarUrl?: string | null;
  status: string;
}

export interface PendingRequestResponse {
  id: number;
  senderId: number;
  senderName: string;
  senderAvatarUrl?: string | null;
  createdAt: string;
}