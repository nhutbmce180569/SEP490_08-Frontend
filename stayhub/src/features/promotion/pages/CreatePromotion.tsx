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
  const [serverErrors, setServerErrors] = React.useState<Record<string, any>>({});

  const handleCancel = () => {
    navigate(PATH.ADMIN.SYSTEM_PROMOTIONS);
  };

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      setServerErrors({});
      const payload: PromotionFormData = {
        code: data.code,
        name: data.name,
        description: data.description,
        discountType: data.discountType,
        discountValue: Number(data.discountValue),
        maxDiscountAmount: data.maxDiscountAmount ? Number(data.maxDiscountAmount) : null,
        startDate: data.startDate,
        endDate: data.endDate,
        status: "Active", // Default to Active as per latest requirement
      };

      await promotionService.createPromotion(payload);
      navigate(PATH.ADMIN.SYSTEM_PROMOTIONS);
    } catch (error: any) {
      console.error("Failed to create promotion", error);
      const responseData = error?.response?.data;
      
      // Handle standard .NET validation errors
      if (responseData?.errors) {
        setServerErrors(responseData.errors);
      } else {
        // Handle custom exception messages (e.g. "already exists")
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
      },
      onChangeCustom: (value, setFormData) => {
        if (typeof value === "string") {
          const genCode = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").substring(0, 25);
          setFormData((prev: Record<string, any>) => ({ ...prev, code: genCode }));
        }
      }
    },
    {
      name: "code",
      label: t("admin.promotionCode", { defaultValue: "Promotion Code" }),
      type: "text",
      placeholder: t("admin.promotionCodePlaceholder", { defaultValue: "e.g., SUMMER2024" }),
      required: true,
      maxLength: 25,
      validate: (value) => {
        if (!value || String(value).trim().length < 3) return t("admin.promotionCodeLength");
      }
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

  return (
    <div className="py-6">
      <DynamicForm
        title={t("admin.createPromotionTitle", { defaultValue: "Create Promotion" })}
        description={t("admin.createPromotionDesc", { defaultValue: "Add a new promotional code to the system" })}
        fields={fields}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        serverErrors={serverErrors}
      />
    </div>
  );
};
