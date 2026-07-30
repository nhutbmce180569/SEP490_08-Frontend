import React, { useMemo } from "react";
import { AlignLeft, Tag, Type } from "lucide-react";
import { DynamicForm, type FormField } from "../../../components/dashboard/DynamicForm";
import { LoadingOverlay } from "../../../components/dashboard/LoadingOverlay";
import { useTranslation } from "../../../contexts/LocaleContext";
import { useUpdateTicketType } from "../hooks/useUpdateTicketType";

export const UpdateTicketType: React.FC = () => {
  const { t } = useTranslation();
  const {
    id,
    ticketType,
    isFetching,
    fetchError,
    isSubmitting,
    serverErrors,
    handleSubmit,
    handleCancel,
  } = useUpdateTicketType();

  const ticketTypeFields: FormField[] = useMemo(
    () => [
      {
        name: "name",
        label: t("content.ticketTypeName"),
        type: "text",
        icon: <Type className="h-4 w-4" />,
        colSpan: 1,
        required: true,
        maxLength: 50,
        validate: (value) => {
          const val = String(value || "").trim();
          if (val.length > 50) return t("content.ticketTypeNameMaxLength");
          if (!/^[\p{L}\p{N}\s]*$/u.test(val)) return t("content.ticketTypeNameSpecialChars", { defaultValue: "Ticket type name cannot contain special characters" });
          return undefined;
        },
      },
      {
        name: "isActive",
        label: t("common.status"),
        type: "select",
        icon: <Tag className="h-4 w-4" />,
        options: [
          { label: t("common.active"), value: "Active" },
          { label: t("common.inactive"), value: "Inactive" },
        ],
        required: true,
      },
      {
        name: "minAge",
        label: t("content.minAge", { defaultValue: "Min Age" }),
        type: "number",
        colSpan: 1,
        validate: (value, formData) => {
          const val = value !== undefined && value !== null && value !== "" ? Number(value) : null;
          if (val !== null && val < 0) return t("content.ageNegativeError");
          
          const maxVal = formData.maxAge !== undefined && formData.maxAge !== null && formData.maxAge !== "" ? Number(formData.maxAge) : null;
          if (val !== null && maxVal !== null && val >= maxVal) return t("content.maxAgeError");
          
          return undefined;
        }
      },
      {
        name: "maxAge",
        label: t("content.maxAge", { defaultValue: "Max Age" }),
        type: "number",
        colSpan: 1,
        validate: (value, formData) => {
          const val = value !== undefined && value !== null && value !== "" ? Number(value) : null;
          if (val !== null && val < 0) return t("content.ageNegativeError");
          
          const minVal = formData.minAge !== undefined && formData.minAge !== null && formData.minAge !== "" ? Number(formData.minAge) : null;
          if (val !== null && minVal !== null && val <= minVal) return t("content.maxAgeError");
          
          return undefined;
        }
      },
      {
        name: "description",
        label: t("common.description"),
        type: "textarea",
        icon: <AlignLeft className="h-4 w-4" />,
        colSpan: 2,
        maxLength: 500,
      },
    ],
    [t],
  );

  if (isFetching) {
    return (
      <div className="flex justify-center p-10 text-slate-500">
        {t("content.loadingTicketTypes")}
      </div>
    );
  }

  if (fetchError) {
    return <div className="flex justify-center p-10 text-rose-500">{fetchError}</div>;
  }

  if (!ticketType) {
    return (
      <div className="flex justify-center p-10 text-slate-500">
        {t("content.ticketTypeNotFound")}
      </div>
    );
  }

  return (
    <>
      <DynamicForm
        title={t("content.updateTicketType")}
        description={t("content.updateTicketTypeDesc", { id: String(id) })}
        fields={ticketTypeFields}
        initialValues={{
          ...ticketType,
          isActive: ticketType.isActive ? "Active" : "Inactive",
        }}
        onSubmit={handleSubmit}
        serverErrors={serverErrors}
        onCancel={handleCancel}
      />
      <LoadingOverlay isOpen={isSubmitting} message={t("content.updatingTicketType")} />
    </>
  );
};
