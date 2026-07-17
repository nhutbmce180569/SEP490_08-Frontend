import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DynamicForm, type FormField } from "../../../components/dashboard/DynamicForm";
import { PATH } from "../../../config/routes/route";
import { useTranslation } from "../../../contexts/LocaleContext";
import { promotionService } from "../services/promotion.service";
import type { PromotionFormData } from "../types/promotion";

export const UpdatePromotion: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [initialData, setInitialData] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPromotion = async () => {
      if (!id) return;
      try {
        const promotion = await promotionService.getPromotionById(id);
        setInitialData({
          ...promotion,
          // Convert ISO dates to format suitable for datetime-local (YYYY-MM-DDThh:mm)
          startDate: promotion.startDate ? new Date(promotion.startDate).toISOString().slice(0, 16) : "",
          endDate: promotion.endDate ? new Date(promotion.endDate).toISOString().slice(0, 16) : "",
        });
      } catch (err: any) {
        setError("Failed to load promotion data");
      }
    };
    fetchPromotion();
  }, [id]);

  const handleCancel = () => {
    navigate(PATH.ADMIN.SYSTEM_PROMOTIONS);
  };

  const handleSubmit = async (data: Record<string, any>) => {
    if (!id) return;
    try {
      const payload: PromotionFormData = {
        code: data.code,
        name: data.name,
        description: data.description,
        discountType: data.discountType,
        discountValue: Number(data.discountValue),
        maxDiscountAmount: data.maxDiscountAmount ? Number(data.maxDiscountAmount) : null,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
        status: data.status,
      };

      await promotionService.updatePromotion(id, payload);
      navigate(PATH.ADMIN.SYSTEM_PROMOTIONS);
    } catch (err: any) {
      console.error("Failed to update promotion", err);
      // Depending on the API error handling format, we could set serverErrors here
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

  if (error) {
    return <div className="p-10 text-center text-rose-500">{error}</div>;
  }

  if (!initialData) {
    return <div className="p-10 text-center text-slate-500">Loading promotion...</div>;
  }

  return (
    <div className="py-6">
      <DynamicForm
        title="Update Promotion"
        description={`Editing promotion details for code ${initialData.code}`}
        fields={fields}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        initialData={initialData}
      />
    </div>
  );
};
