import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import {
  getMomentFeed,
  getMyFootprints,
  getHeatmap,
  createMoment,
  toggleReaction,
  deleteMoment,
  addComment,
  updateComment,
  deleteComment,
} from "../services/momentService";

export const momentQueryKeys = {
  all: ["moments"] as const,
  // Đổi thành number | null. Nếu null, gán chuỗi "global" để React Query phân biệt cache
  feed: (scheduleId: number | null) => [...momentQueryKeys.all, "feed", scheduleId ?? "global"] as const,
  footprints: () => [...momentQueryKeys.all, "footprints"] as const,
};

// 👉 Cho phép scheduleId nhận giá trị null
export const useGetMomentFeed = (scheduleId: number | null) => {
  return useQuery({
    queryKey: momentQueryKeys.feed(scheduleId),
    queryFn: () => getMomentFeed(scheduleId),
    // BỎ DÒNG enabled: !!scheduleId Ở ĐÂY để cho phép gọi API khi null
  });
};

export const useGetMyFootprints = () => {
  return useQuery({
    queryKey: [...momentQueryKeys.all, "footprints"],
    queryFn: getMyFootprints,
  });
};

// Heatmap realtime tu LocationLogs (giong mobile). Chi fetch khi lop heatmap bat.
export const useGetHeatmap = (scheduleId: number | null, type: string = "online", enabled: boolean = true) => {
  return useQuery({
    queryKey: [...momentQueryKeys.all, "heatmap", scheduleId ?? "global", type],
    queryFn: () => getHeatmap(scheduleId, type),
    enabled,
    // Du lieu di chuyen thay doi lien tuc -> lam tuoi dinh ky.
    refetchInterval: enabled ? 30000 : false,
  });
};

// 👉 Cho phép scheduleId nhận giá trị null
export const useInfiniteMomentFeed = (scheduleId: number | null, pageSize: number = 5) => {
  return useInfiniteQuery({
    queryKey: momentQueryKeys.feed(scheduleId),
    queryFn: ({ pageParam = 0 }) => getMomentFeed(scheduleId, pageParam, pageSize),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < pageSize) return undefined;
      return allPages.length * pageSize;
    },
    // BỎ DÒNG enabled: !!scheduleId Ở ĐÂY 
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