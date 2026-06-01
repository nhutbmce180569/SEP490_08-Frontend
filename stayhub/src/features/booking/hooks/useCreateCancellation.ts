import { useMutation } from "@tanstack/react-query";
import { cancellationService } from "../services/cancellation.service";
import type { CreateCancellationRequestDTO } from "../types/cancellation";

// 1. Hook cho Customer: Tạo yêu cầu hủy
export const useCreateCancellation = () => {
  return useMutation({
    mutationFn: (data: CreateCancellationRequestDTO) => cancellationService.createRequest(data),
  });
};