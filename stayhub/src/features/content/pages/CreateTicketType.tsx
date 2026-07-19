import React, { useMemo } from "react";
import { AlignLeft, Tag, Type } from "lucide-react";
import { DynamicForm, type FormField } from "../../../components/dashboard/DynamicForm";
import { LoadingOverlay } from "../../../components/dashboard/LoadingOverlay";
import { useTranslation } from "../../../contexts/LocaleContext";
import { useCreateTicketType } from "../hooks/useCreateTicketType";

export const CreateTicketType: React.FC = () => {
  const { t } = useTranslation();
  const { handleSubmit, handleCancel, isSubmitting, serverErrors } = useCreateTicketType();

  const ticketTypeFields: FormField[] = useMemo(
    () => [
      {
        name: "name",
        label: t("content.ticketTypeName"),
        type: "text",
        placeholder: t("content.ticketTypeNamePlaceholder"),
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
        name: "description",
        label: t("common.description"),
        type: "textarea",
        placeholder: t("content.ticketTypeDescPlaceholder"),
        icon: <AlignLeft className="h-4 w-4" />,
        colSpan: 2,
        maxLength: 500,
      },
    ],
    [t],
  );

  return (
    <>
      <DynamicForm
        title={t("content.createNewTicketType")}
        description={t("content.createTicketTypeDescLong")}
        fields={ticketTypeFields}
        initialValues={{ isActive: "Active" }}
        onSubmit={handleSubmit}
        serverErrors={serverErrors}
        onCancel={handleCancel}
      />
      <LoadingOverlay isOpen={isSubmitting} message={t("content.creatingTicketType")} />
    </>
  );
};
