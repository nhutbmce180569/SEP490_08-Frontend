import { useQuery } from "@tanstack/react-query";
import { cancellationService } from "../services/cancellation.service";

// 2. Hook cho Admin/Manager: Lấy danh sách yêu cầu (có filter theo status)
export const useCancellationRequests = (status?: string, page: number = 1, pageSize: number = 5) => {
  return useQuery({
    queryKey: ["cancellationRequests", status, page, pageSize],
    queryFn: () => cancellationService.getRequests(status, page, pageSize),
  });
};
