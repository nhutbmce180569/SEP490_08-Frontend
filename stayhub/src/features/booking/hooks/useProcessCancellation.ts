import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cancellationService } from "../services/cancellation.service";
import type { ProcessCancellationDTO } from "../types/cancellation";

// 4. Hook cho Admin/Manager: Xử lý (Approve/Reject)
export const useProcessCancellation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProcessCancellationDTO }) =>
      cancellationService.processRequest(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["cancellationRequests"] });
      queryClient.invalidateQueries({ queryKey: ["cancellationRequest", variables.id] });
    },
  });
};