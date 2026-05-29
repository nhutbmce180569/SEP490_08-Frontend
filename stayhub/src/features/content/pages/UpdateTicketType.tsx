import React from "react";
import { AlignLeft, Tag, Type } from "lucide-react";
import { DynamicForm, type FormField } from "../../../components/dashboard/DynamicForm";
import { LoadingOverlay } from "../../../components/dashboard/LoadingOverlay";
import { useUpdateTicketType } from "../hooks/useUpdateTicketType";

const ticketTypeFields: FormField[] = [
  {
    name: "name",
    label: "Ticket Type Name",
    type: "text",
    icon: <Type className="h-4 w-4" />,
    colSpan: 1,
    required: true,
    validate: (value) =>
      String(value || "").trim().length > 100
        ? "Ticket type name cannot exceed 100 characters."
        : undefined,
  },
  {
    name: "isActive",
    label: "Status",
    type: "select",
    icon: <Tag className="h-4 w-4" />,
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
    icon: <AlignLeft className="h-4 w-4" />,
    colSpan: 2,
  },
];

export const UpdateTicketType: React.FC = () => {
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

  if (isFetching) {
    return <div className="flex justify-center p-10 text-slate-500">Loading ticket type details...</div>;
  }

  if (fetchError) {
    return <div className="flex justify-center p-10 text-rose-500">{fetchError}</div>;
  }

  if (!ticketType) {
    return <div className="flex justify-center p-10 text-slate-500">Ticket type not found.</div>;
  }

  return (
    <>
      <DynamicForm
        title="Update Ticket Type"
        description={`Edit details for ticket type #${id}`}
        fields={ticketTypeFields}
        initialValues={{
          ...ticketType,
          isActive: ticketType.isActive ? "Active" : "Inactive",
        }}
        onSubmit={handleSubmit}
        serverErrors={serverErrors}
        onCancel={handleCancel}
      />
      <LoadingOverlay isOpen={isSubmitting} message="Updating ticket type..." />
    </>
  );
};
