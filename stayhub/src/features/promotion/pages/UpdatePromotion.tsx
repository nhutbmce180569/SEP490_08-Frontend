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
  const [serverErrors, setServerErrors] = useState<Record<string, any>>({});

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
      setServerErrors({});
      const payload: PromotionFormData = {
        code: data.code,
        name: data.name,
        description: data.description,
        discountType: data.discountType,
        discountValue: Number(data.discountValue),
        maxDiscountAmount: data.maxDiscountAmount ? Number(data.maxDiscountAmount) : null,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
        // status is not passed here since it's removed from form
      };

      await promotionService.updatePromotion(id, payload);
      navigate(PATH.ADMIN.SYSTEM_PROMOTIONS);
    } catch (error: any) {
      console.error("Failed to update promotion", error);
      const responseData = error?.response?.data;
      
      // Handle standard .NET validation errors
      if (responseData?.errors) {
        setServerErrors(responseData.errors);
      } else {
        // Handle custom exception messages
        const msg = responseData?.message || (typeof responseData === "string" ? responseData : error.message);
        if (typeof msg === "string" && msg.toLowerCase().includes("already exists")) {
          setServerErrors({ code: msg });
        } else {
          setServerErrors({ form: msg || "An error occurred" });
        }
      }
    }
  };

  const fields: FormField[] = [
    {
      name: "name",
      label: t("admin.promotionName", { defaultValue: "Promotion Name" }),
      type: "text",
      placeholder: t("admin.promotionNamePlaceholder", { defaultValue: "e.g., Summer Sale 2024" }),
      required: true,
      maxLength: 100,
      validate: (value) => {
        if (!value || String(value).trim().length < 5) return t("admin.promotionNameLength");
      }
    },
    {
      name: "code",
      label: t("admin.promotionCode", { defaultValue: "Promotion Code" }),
      type: "text",
      placeholder: t("admin.promotionCodePlaceholder", { defaultValue: "e.g., SUMMER2024" }),
      required: true,
      maxLength: 25,
      readOnly: true,
    },
    {
      name: "discountRow",
      label: "",
      type: "row",
      colSpan: 2,
      subFields: [
        {
          name: "discountType",
          label: t("admin.promotionDiscountType", { defaultValue: "Discount Type" }),
          type: "select",
          options: [
            { label: t("admin.promotionPercentage", { defaultValue: "Percentage (%)" }), value: "PERCENTAGE" },
            { label: t("admin.promotionFixedAmount", { defaultValue: "Fixed Amount (VND)" }), value: "FIXED" },
          ],
          required: true,
          readOnly: true,
        },
        {
          name: "discountValue",
          label: t("admin.promotionDiscountValue", { defaultValue: "Discount Value" }),
          type: "number",
          placeholder: t("admin.promotionDiscountValuePlaceholder", { defaultValue: "e.g., 10 or 50000" }),
          required: true,
          validate: (value, formData) => {
            const num = Number(value);
            if (value === undefined || value === null || num <= 0) return t("admin.promotionDiscountPositive");
            if (formData.discountType === "PERCENTAGE") {
              if (num < 1 || num > 100) return t("admin.promotionDiscountPercentageRange");
            } else if (formData.discountType === "FIXED") {
              if (num < 10000) return t("admin.promotionDiscountFixedMin");
            }
          }
        },
        {
          name: "maxDiscountAmount",
          label: t("admin.promotionMaxDiscountAmount", { defaultValue: "Max Discount Amount (VND)" }),
          type: "number",
          placeholder: t("admin.promotionMaxDiscountAmountPlaceholder", { defaultValue: "Optional limit for percentage discounts" }),
          visible: (data) => data.discountType === "PERCENTAGE",
          validate: (value) => {
            if (value !== undefined && value !== null && value !== "") {
              if (Number(value) < 10000) return t("admin.promotionMaxDiscountFixedMin");
            }
          }
        }
      ]
    },
    {
      name: "startDate",
      label: t("admin.promotionStartDate", { defaultValue: "Start Date" }),
      type: "datetime-local",
      required: true,
    },
    {
      name: "endDate",
      label: t("admin.promotionEndDate", { defaultValue: "End Date" }),
      type: "datetime-local",
      required: true,
      validate: (value, formData) => {
        if (formData.startDate && new Date(value) <= new Date(formData.startDate)) {
          return t("admin.promotionEndDateError");
        }
      }
    },

    {
      name: "description",
      label: t("common.description", { defaultValue: "Description" }),
      type: "textarea",
      placeholder: t("admin.promotionDescriptionPlaceholder", { defaultValue: "Detailed information about the promotion" }),
      colSpan: 2,
    },
  ];

  if (!initialData && !error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return <div className="p-10 text-center text-rose-500">{error}</div>;
  }

  return (
    <div className="py-6">
      <DynamicForm
        title={t("admin.updatePromotionTitle", { defaultValue: "Update Promotion" })}
        description={t("admin.updatePromotionDesc", { defaultValue: "Edit promotional code details" })}
        fields={fields}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        initialData={initialData || undefined}
        serverErrors={serverErrors}
      />
    </div>
  );
};
