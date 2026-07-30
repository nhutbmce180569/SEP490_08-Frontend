import { useQuery } from "@tanstack/react-query";
import { getUserProfile, getUserMoments } from "../services/profileService";

export const profileQueryKeys = {
  all: ["socialProfile"] as const,
  profile: (userId: string) => [...profileQueryKeys.all, "detail", userId] as const,
  moments: (userId: string) => [...profileQueryKeys.all, "moments", userId] as const,
};

export const useGetUserProfile = (userId: string) => {
  return useQuery({
    queryKey: profileQueryKeys.profile(userId),
    queryFn: () => getUserProfile(userId),
    enabled: !!userId,
  });
};

export const useGetUserMoments = (userId: string) => {
  return useQuery({
    queryKey: profileQueryKeys.moments(userId),
    queryFn: () => getUserMoments(userId),
    enabled: !!userId,
  });
};