export interface PendingFriendRequest {
  id: number;
  senderId: number;
  senderName: string;
  senderAvatarUrl?: string;
}

export const useGetPendingRequests = () => {
  return {
    data: [] as PendingFriendRequest[],
    isLoading: false,
  };
};
