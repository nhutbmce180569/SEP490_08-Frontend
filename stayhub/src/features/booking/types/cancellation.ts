export interface CreateCancellationRequestDTO {
  orderId: number;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  reason: string;
}

export interface ProcessCancellationDTO {
  action: "Approve" | "Reject";
  rejectReason?: string;
}

export interface CancellationRequestListDTO {
  id: number;
  orderId: number;
  customerId: number;
  requestedAt?: string;
  refundAmount: number;
  status: string;
}

export interface CancellationRequestDetailDTO {
  id: number;
  orderId: number;
  customerId: number;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  requestedAt?: string;
  originalAmount: number;
  cancellationFee: number;
  feePercent: number;
  refundAmount: number;
  reason: string;
  status: string;
  rejectReason?: string;
  processedAt?: string;
  processedBy?: number;
}