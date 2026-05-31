import { useQuery } from "@tanstack/react-query";
import { cancellationService } from "../services/cancellation.service";

// 3. Hook cho Admin/Manager: Lấy chi tiết yêu cầu
export const useCancellationDetails = (id: number) => {
  return useQuery({
    queryKey: ["cancellationRequest", id],
    queryFn: () => cancellationService.getRequestDetail(id),
    enabled: !!id,
  });
};