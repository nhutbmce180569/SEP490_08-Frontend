import { z } from "zod";

const UserVoucherAssignmentSchema = z.object({
  userId: z.number().int().positive("userIdMustBeValid"),
  quantity: z.number().int().min(1, "quantityMustBeAtLeast1"),
});

const TopCustomerAssignmentSchema = z.object({
  top: z.number().int().min(1, "topMustBeAtLeast1"),
  revenuePeriod: z.enum(["Month", "Year", "AllTime", "Custom"]),
  quantity: z.number().int().min(1, "quantityMustBeAtLeast1"),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
});

const voucherShape = z.object({
  code: z.string().min(3, "codeMinLength").max(50, "codeMaxLength"),
  tourId: z.number().optional(),
  discountType: z.enum(["Percent", "Amount"]),
  discountValue: z.number().min(1, "discountMin"),
  maxDiscountAmount: z.number().optional(),
  minOrderAmount: z.number().optional(),
  availableCount: z.number().int().min(1, "availableCountMin"),
  startDate: z.string().min(1, "startDateRequired"),
  endDate: z.string().min(1, "endDateRequired"),
  description: z.string().optional(),
  customerAssignments: z.array(UserVoucherAssignmentSchema).optional(),
  topCustomerAssignment: TopCustomerAssignmentSchema.optional(),
});

export const baseVoucherSchema = voucherShape.refine((data) => {
  if (data.discountType === "Percent") {
    return data.discountValue <= 100;
  }
  return true;
}, {
  message: "percentageMax",
  path: ["discountValue"],
}).refine((data) => {
  if (data.minOrderAmount !== undefined && data.minOrderAmount !== null) {
    return data.minOrderAmount >= 10000;
  }
  return true;
}, {
  message: "minOrderAmountMin",
  path: ["minOrderAmount"],
}).refine((data) => {
  return new Date(data.startDate) <= new Date(data.endDate);
}, {
  message: "endDateBeforeStartDate",
  path: ["endDate"],
});

export const updateVoucherSchema = voucherShape.partial().omit({ code: true }).refine((data) => {
  if (data.discountType === "Percent" && data.discountValue !== undefined) {
    return data.discountValue <= 100;
  }
  return true;
}, {
  message: "percentageMax",
  path: ["discountValue"],
}).refine((data) => {
  if (data.minOrderAmount !== undefined && data.minOrderAmount !== null) {
    return data.minOrderAmount >= 10000;
  }
  return true;
}, {
  message: "minOrderAmountMin",
  path: ["minOrderAmount"],
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate);
  }
  return true;
}, {
  message: "endDateBeforeStartDate",
  path: ["endDate"],
});
