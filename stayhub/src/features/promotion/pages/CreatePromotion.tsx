import React from "react";
import { useNavigate } from "react-router-dom";
import { DynamicForm, type FormField } from "../../../components/dashboard/DynamicForm";
import { PATH } from "../../../config/routes/route";
import { useTranslation } from "../../../contexts/LocaleContext";
import { promotionService } from "../services/promotion.service";
import type { PromotionFormData } from "../types/promotion";

export const CreatePromotion: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleCancel = () => {
    navigate(PATH.ADMIN.SYSTEM_PROMOTIONS);
  };

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      const payload: PromotionFormData = {
        code: data.code,
        name: data.name,
        description: data.description,
        discountType: data.discountType,
        discountValue: Number(data.discountValue),
        maxDiscountAmount: data.maxDiscountAmount ? Number(data.maxDiscountAmount) : null,
        startDate: data.startDate,
        endDate: data.endDate,
        status: data.status || "Active",
      };

      await promotionService.createPromotion(payload);
      navigate(PATH.ADMIN.SYSTEM_PROMOTIONS);
    } catch (error) {
      console.error("Failed to create promotion", error);
    }
  };

  const fields: FormField[] = [
    {
      name: "code",
      label: "Promotion Code",
      type: "text",
      placeholder: "e.g., SUMMER2024",
      required: true,
    },
    {
      name: "name",
      label: "Promotion Name",
      type: "text",
      placeholder: "Summer Sale 2024",
      required: true,
    },
    {
      name: "discountType",
      label: "Discount Type",
      type: "select",
      options: [
        { label: "Percentage (%)", value: "PERCENTAGE" },
        { label: "Fixed Amount (VND)", value: "FIXED" },
      ],
      required: true,
    },
    {
      name: "discountValue",
      label: "Discount Value",
      type: "number",
      placeholder: "e.g., 10 or 50000",
      required: true,
    },
    {
      name: "startDate",
      label: "Start Date",
      type: "datetime-local",
      required: true,
    },
    {
      name: "endDate",
      label: "End Date",
      type: "datetime-local",
      required: true,
    },
    {
      name: "maxDiscountAmount",
      label: "Max Discount Amount (VND)",
      type: "number",
      placeholder: "Optional limit for percentage discounts",
      visible: (data) => data.discountType === "PERCENTAGE",
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: [
        { label: "Active", value: "Active" },
        { label: "Inactive", value: "Inactive" },
      ],
      required: true,
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      placeholder: "Detailed information about the promotion",
      colSpan: 2,
    },
  ];

  return (
    <div className="py-6">
      <DynamicForm
        title="Create Promotion"
        description="Add a new promotional code to the system"
        fields={fields}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        initialData={{ status: "Active", discountType: "PERCENTAGE" }}
      />
    </div>
  );
};
