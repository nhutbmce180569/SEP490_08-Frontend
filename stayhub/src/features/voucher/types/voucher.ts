export interface ReadUserVoucherDTO {
  id: number;
  userId: number;
  userFullName?: string;
  userEmail?: string;
  quantity: number;
  status: string;
}

export interface ReadVoucherDTO {
  id: number;
  code: string;
  tourId?: number;
  tourName?: string;
  discountType: string;
  discountValue: number;
  maxDiscountAmount?: number;
  usedCount: number;
  availableCount: number;
  remainingCount: number;
  startDate: string;
  endDate: string;
  description?: string;
  creatorId: number;
  creatorName?: string;
  isActive: boolean;
  status: string;
  isCustomerSpecific: boolean;
  assignedCustomerCount: number;
}

export interface ReadVoucherDetailDTO extends ReadVoucherDTO {
  assignedCustomers: ReadUserVoucherDTO[];
}

export interface CreateUserVoucherAssignmentDTO {
  userId: number;
  quantity: number;
}

export type RevenuePeriod = 'Month' | 'Year' | 'AllTime';

export type VoucherTargetType = 'public' | 'specific' | 'topRevenue';

export interface TopCustomerVoucherAssignmentDTO {
  top: number;
  revenuePeriod: RevenuePeriod;
  quantity: number;
}

export interface CreateVoucherDTO {
  code: string;
  tourId?: number;
  discountType: string;
  discountValue: number;
  maxDiscountAmount?: number;
  availableCount: number;
  startDate: string;
  endDate: string;
  description?: string;
  customerAssignments?: CreateUserVoucherAssignmentDTO[];
  topCustomerAssignment?: TopCustomerVoucherAssignmentDTO;
}

export interface UpdateVoucherDTO {
  tourId?: number;
  discountType?: string;
  discountValue?: number;
  maxDiscountAmount?: number;
  availableCount?: number;
  startDate?: string;
  endDate?: string;
  description?: string;
  customerAssignments?: CreateUserVoucherAssignmentDTO[];
  topCustomerAssignment?: TopCustomerVoucherAssignmentDTO;
}

export interface VoucherFilters {
  search?: string;
  tourId?: number;
  discountType?: string;
  status?: string;
  voucherType?: string;
  createdByMe?: boolean;
}
