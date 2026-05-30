import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import {
  getMomentFeed,
  getMyFootprints,
  createMoment,
  toggleReaction,
  deleteMoment,
  addComment,
  updateComment,
  deleteComment,
} from "../services/momentService";

export const momentQueryKeys = {
  all: ["moments"] as const,
  feed: (scheduleId: number) => [...momentQueryKeys.all, "feed", scheduleId] as const,
  footprints: () => [...momentQueryKeys.all, "footprints"] as const,
};

export const useGetMomentFeed = (scheduleId: number) => {
  return useQuery({
    queryKey: momentQueryKeys.feed(scheduleId),
    queryFn: () => getMomentFeed(scheduleId),
    enabled: !!scheduleId,
  });
};

export const useGetMyFootprints = () => {
  return useQuery({
    queryKey: [...momentQueryKeys.all, "footprints"],
    queryFn: getMyFootprints,
  });
};

export const useInfiniteMomentFeed = (scheduleId: number, pageSize: number = 5) => {
  return useInfiniteQuery({
    queryKey: momentQueryKeys.feed(scheduleId),
    queryFn: ({ pageParam = 0 }) => getMomentFeed(scheduleId, pageParam, pageSize),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < pageSize) return undefined;
      return allPages.length * pageSize;
    },
    enabled: !!scheduleId,
  });
};

export const useCreateMoment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: FormData) => createMoment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: momentQueryKeys.all });
    },
  });
};

export const useToggleReaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ momentId, userId, isLike }: { momentId: number; userId: number; isLike: boolean }) =>
      toggleReaction(momentId, userId, isLike),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: momentQueryKeys.all });
    },
  });
};

export const useAddComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ momentId, userId, content }: { momentId: number; userId: number; content: string }) =>
      addComment(momentId, userId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: momentQueryKeys.all });
    },
  });
};

export const useUpdateComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId, userId, content }: { commentId: number; userId: number; content: string }) =>
      updateComment(commentId, userId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: momentQueryKeys.all });
    },
  });
};

export const useDeleteComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId, userId }: { commentId: number; userId: number }) =>
      deleteComment(commentId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: momentQueryKeys.all });
    },
  });
};

export const useDeleteMoment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ momentId, userId }: { momentId: number; userId: number }) =>
      deleteMoment(momentId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: momentQueryKeys.all });
    },
  });
};