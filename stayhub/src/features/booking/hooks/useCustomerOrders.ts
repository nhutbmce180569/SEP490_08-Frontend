import { useInfiniteQuery } from "@tanstack/react-query";
import type { ReadOrderDTO } from "../types/booking";
import { getOrdersByUserId } from "../services/booking.service";

type CustomerOrdersPage = {
  data: ReadOrderDTO[];
  totalPages: number;
  currentPage: number;
};

export const useCustomerOrders = (
  userId?: string | number | null,
  status?: string | null,
) => {
  const query = useInfiniteQuery({
    queryKey: ["customerOrders", userId, status || "All"],
    queryFn: async ({ pageParam = 1 }) => {
      if (!userId) return { data: [], totalPages: 0, currentPage: 1 };
      const response = await getOrdersByUserId(userId, pageParam, 5, status);
      return response;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage: CustomerOrdersPage) => {
      if (!lastPage || !lastPage.totalPages) return undefined;
      if (lastPage.currentPage < lastPage.totalPages) {
        return lastPage.currentPage + 1;
      }
      return undefined;
    },
    enabled: !!userId,
  });

  const orders: ReadOrderDTO[] =
    query.data?.pages.flatMap((page) => page.data || []) || [];

  return {
    ...query,
    orders,
    isLoading: query.isLoading,
    error: query.error ? query.error.message : null,
  };
};
