import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { createChatRoom, getChatRooms, getRoomMessages, respondToInvitation, sendMessage } from "../services/chatService";
export const chatQueryKeys = {
  all: ["chats"] as const,
  rooms: () => [...chatQueryKeys.all, "rooms"] as const,
  messages: (roomId: number) => [...chatQueryKeys.all, "messages", roomId] as const,
};

export const useGetChatRooms = () => {
  const accessToken = localStorage.getItem("accessToken");
  
  return useQuery({
    queryKey: chatQueryKeys.rooms(),
    queryFn: getChatRooms,
    enabled: !!accessToken,
  });
};

export const useGetRoomMessages = (roomId: number, top: number = 50) => {
  return useInfiniteQuery({
    queryKey: chatQueryKeys.messages(roomId),
    queryFn: ({ pageParam = 0 }) => getRoomMessages(roomId, pageParam, top),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      // If the number of messages returned is less than the requested top, we've reached the end
      if (lastPage.length < top) return undefined;
      
      // Otherwise, calculate the next 'skip' value
      return allPages.length * top;
    },
    enabled: !!roomId,
  });
};

export const useRespondToInvitation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      invitationId, 
      status 
    }: { 
      invitationId: number; 
      status: "Accepted" | "Declined" 
    }) => respondToInvitation(invitationId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatQueryKeys.rooms() });
    },
  });
};

export const useCreateChatRoom = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createChatRoom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatQueryKeys.rooms() });
    },
  });
};
export const useSendMessage = () => {
  return useMutation({
    mutationFn: ({ roomId, content }: { roomId: number; content: string }) => 
      sendMessage(roomId, content),
    // Lưu ý: Không cần gọi invalidateQueries ở đây vì SignalR sẽ lo việc cập nhật UI
  });
};