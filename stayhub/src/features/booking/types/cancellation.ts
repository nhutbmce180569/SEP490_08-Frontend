export interface CreateCancellationRequestDTO {
  orderId: number;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  reason: string;
}

export interface ProcessCancellationDTO {
  Action: "Approve" | "Reject";
  RejectReason?: string;
}

export interface CancellationRequestListDTO {
  id: number;
  orderId: number;
  customerId: number;
  requestedAt?: string;
  refundAmount: number;
  status: string;
  tourId?: number;
  tourName?: string;
}

export interface CancellationRequestPaginationDTO {
  data: CancellationRequestListDTO[];
  total: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface CancellationTourDTO {
  id: number;
  operatorId: number;
  categoryId: number;
  name: string;
  description?: string | null;
  status?: string | null;
  imageUrl?: string | null;
  country?: string | null;
  city?: string | null;
  address?: string | null;
  averageStar?: number | null;
  reviews?: unknown[] | null;
}

export interface CancellationCustomerDTO {
  id: number;
  fullName: string;
  avatarUrl?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  createdAt?: string | null;
}

export interface CancellationRequestDetailDTO {
  id: number;
  tour?: CancellationTourDTO | null;
  customer?: CancellationCustomerDTO | null;
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
