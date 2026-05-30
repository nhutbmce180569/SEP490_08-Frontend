import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  sendRequest,
  getFriendships,
  getPendingRequests,
  respondToRequest,
  deleteFriendship,
  getPaginatedFriendList
} from "../services/friendService";

export const friendQueryKeys = {
  all: ["friends"] as const,
  lists: () => [...friendQueryKeys.all, "list"] as const,
  pending: () => [...friendQueryKeys.all, "pending"] as const,
  paginated: (page: number) => [...friendQueryKeys.all, "paginated", page] as const,
};

export const useGetFriendships = () => {
  return useQuery({
    queryKey: friendQueryKeys.lists(),
    queryFn: getFriendships,
  });
};

export const useGetPendingRequests = () => {
  return useQuery({
    queryKey: friendQueryKeys.pending(),
    queryFn: getPendingRequests,
  });
};

export const useSendFriendRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: friendQueryKeys.pending() });
    },
  });
};

export const useRespondToRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: respondToRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: friendQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: friendQueryKeys.pending() });
    },
  });
};

export const useDeleteFriendship = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteFriendship,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: friendQueryKeys.lists() });
    },
  });
};

export const useGetPaginatedFriendList = (page: number = 1, pageSize: number = 10) => {
  return useQuery({
    queryKey: friendQueryKeys.paginated(page),
    queryFn: () => getPaginatedFriendList(page, pageSize),
  });
};