import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  sendRequest,
  getFriendships,
  getPendingRequests,
  respondToRequest,
  deleteFriendship,
  getPaginatedFriendList,
  getFriendshipStatus,
  getSentRequests
} from "../services/friendService";

export const friendQueryKeys = {
  all: ["friends"] as const,
  lists: () => [...friendQueryKeys.all, "list"] as const,
  pending: () => [...friendQueryKeys.all, "pending"] as const,
  sent: () => [...friendQueryKeys.all, "sent"] as const,
  paginated: (page: number) => [...friendQueryKeys.all, "paginated", page] as const,
  status: (targetUserId: string | number) => [...friendQueryKeys.all, "status", String(targetUserId)] as const,
};

export const useGetFriendships = () => {
  return useQuery({
    queryKey: friendQueryKeys.lists(),
    queryFn: getFriendships,
  });
};

export const useGetPendingRequests = (enabled: boolean = true) => {
  return useQuery({
    queryKey: friendQueryKeys.pending(),
    queryFn: getPendingRequests,
    enabled,
  });
};

export const useSendFriendRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: friendQueryKeys.all });
    },
  });
};

export const useRespondToRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: respondToRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: friendQueryKeys.all });
    },
  });
};

export const useDeleteFriendship = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteFriendship,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: friendQueryKeys.all });
    },
  });
};

export const useGetPaginatedFriendList = (page: number = 1, pageSize: number = 10) => {
  return useQuery({
    queryKey: friendQueryKeys.paginated(page),
    queryFn: () => getPaginatedFriendList(page, pageSize),
  });
};

export const useGetFriendshipStatus = (targetUserId: string | number | undefined) => {
  return useQuery({
    queryKey: friendQueryKeys.status(targetUserId ?? 0),
    queryFn: () => getFriendshipStatus(targetUserId ?? 0),
    enabled: !!targetUserId,
  });
};

export const useGetSentRequests = () => {
  return useQuery({
    queryKey: friendQueryKeys.sent(),
    queryFn: getSentRequests,
  });
};
